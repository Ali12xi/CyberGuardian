import "server-only";

import { intelligenceMap, type IntelligenceFindingId } from "@/lib/intelligenceMap";
import {
  classifyRedirectHop,
  finalizeRedirectAnalysis,
  mergeRedirectIntent,
  type RedirectAnalysisFlags,
} from "@/lib/redirectAnalysis";
import { checkDomainReputation } from "@/lib/reputation";
import { calculateDeterministicScore as calculateFinalScore } from "@/lib/scoring/calculateScore";
import type {
  Finding,
  InfrastructureDetection,
  RedirectIntent,
  RedirectStep,
  ScanStageName,
  ScanStageState,
  ScanResult,
  Severity,
} from "@/lib/types";

type ValidationResult = {
  valid: boolean;
  url: string;
  blockedReason?: string;
};

type ValidateUrl = (input: string) => Promise<ValidationResult>;

type FetchStep = {
  response: Response;
  url: string;
  statusCode: number;
};

type CertificateIdentity = {
  CN?: string;
  O?: string;
  OU?: string;
};

type PeerCertificate = {
  issuer?: CertificateIdentity;
  subject?: CertificateIdentity;
  issuerCertificate?: {
    fingerprint256?: string;
  };
  fingerprint256?: string;
  valid_to?: string;
};

type TlsSocketLike = {
  authorized: boolean;
  authorizationError: string | Error | null;
  getPeerCertificate: (detailed: true) => unknown;
  getProtocol: () => string | null;
  getCipher: () => {
    name?: string;
    standardName?: string;
    version?: string;
  };
  once: (event: string, listener: () => void) => unknown;
  removeAllListeners: () => unknown;
  destroy: () => unknown;
};

type TlsModule = {
  connect: (options: {
    host: string;
    port: number;
    servername: string;
    rejectUnauthorized: boolean;
  }) => TlsSocketLike;
};

type PassiveSignals = {
  headerNames: string;
  headerValues: string;
  server: string;
  poweredBy: string;
  via: string;
  altSvc: string;
  cookies: string;
  finalHostname: string;
  redirectHostnames: string[];
};

type Candidate = {
  category: InfrastructureDetection["category"];
  name: string;
  score: number;
  signals: string[];
};

class ScanStageTimeoutError extends Error {
  constructor(public readonly stage: ScanStageName) {
    super(`${stage}_timeout`);
    this.name = "ScanStageTimeoutError";
  }
}

const MAX_REDIRECTS = 5;
const MAX_RESPONSE_BYTES = 1_000_000;
const TRANSIENT_RETRY_ATTEMPTS = 2;
const STAGE_TIMEOUTS: Record<Exclude<ScanStageName, "aiSummary">, number> = {
  dns: 4_000,
  tls: 4_000,
  headers: 6_000,
  redirects: 12_000,
  infrastructure: 1_000,
};
const SCAN_STAGE_NAMES: ScanStageName[] = [
  "dns",
  "tls",
  "headers",
  "redirects",
  "infrastructure",
  "aiSummary",
];
const SECURITY_HEADERS = [
  "strict-transport-security",
  "content-security-policy",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
] as const;

const SUSPICIOUS_TLDS = new Set([
  "buzz",
  "click",
  "country",
  "gq",
  "info",
  "loan",
  "mom",
  "party",
  "pw",
  "rest",
  "review",
  "ru",
  "stream",
  "support",
  "tk",
  "top",
  "work",
  "xyz",
  "zip",
]);

const PHISHING_KEYWORDS = [
  "account",
  "bank",
  "billing",
  "confirm",
  "crypto",
  "login",
  "password",
  "paypal",
  "secure",
  "signin",
  "support",
  "update",
  "verify",
  "wallet",
];

const TRUSTED_DOMAINS = new Set([
  "cloudflare.com",
  "github.com",
  "google.com",
  "microsoft.com",
  "openai.com",
]);

const BRAND_KEYWORDS = [
  "apple",
  "amazon",
  "cloudflare",
  "facebook",
  "github",
  "google",
  "instagram",
  "microsoft",
  "netflix",
  "openai",
  "paypal",
  "twitter",
  "whatsapp",
];

const TYPO_REPLACEMENTS: Record<string, string> = {
  "0": "o",
  "1": "l",
  "3": "e",
  "4": "a",
  "5": "s",
  "@": "a",
};

function assertNodeRuntime() {
  const runtime = globalThis as typeof globalThis & {
    EdgeRuntime?: string;
    process?: {
      versions?: {
        node?: string;
      };
    };
  };

  if (
    !runtime.process?.versions?.node ||
    runtime.EdgeRuntime
  ) {
    throw new Error("node_runtime_required");
  }
}

async function loadTls(): Promise<TlsModule> {
  assertNodeRuntime();

  // Keep Node's TLS module out of client and Edge bundles. The import is
  // intentionally delayed until after the runtime guard has passed.
  const importNodeModule = new Function("specifier", "return import(specifier)") as (
    specifier: string,
  ) => Promise<TlsModule>;

  return importNodeModule("tls");
}

async function loadValidator(): Promise<ValidateUrl> {
  assertNodeRuntime();

  const { validateUrl } = await import("@/lib/validator");

  return validateUrl;
}

function createInitialStages(): Record<ScanStageName, ScanStageState> {
  return Object.fromEntries(
    SCAN_STAGE_NAMES.map((name) => [
      name,
      {
        name,
        status: name === "aiSummary" ? "pending" : "pending",
        durationMs: 0,
      },
    ]),
  ) as Record<ScanStageName, ScanStageState>;
}

function updateStage(
  result: ScanResult,
  name: ScanStageName,
  status: ScanStageState["status"],
  startedAt: number,
  reason?: string,
) {
  result.meta.stages[name] = {
    name,
    status,
    durationMs: Date.now() - startedAt,
    ...(reason ? { reason } : {}),
  };
}

function getErrorReason(error: unknown, fallback: string) {
  if (error instanceof ScanStageTimeoutError) {
    return error.message;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message.replace(/[^a-z0-9_-]/gi, "_").toLowerCase().slice(0, 80);
  }

  return fallback;
}

function isTransientError(error: unknown) {
  if (error instanceof ScanStageTimeoutError) {
    return true;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return /timeout|abort|econnreset|etimedout|eai_again|network|fetch failed/i.test(
    error.message,
  );
}

function combineSignals(primary: AbortSignal, secondary: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();

  if (primary.aborted || secondary.aborted) {
    controller.abort();
    return {
      signal: controller.signal,
      cleanup: () => undefined,
    };
  }

  primary.addEventListener("abort", abort, { once: true });
  secondary.addEventListener("abort", abort, { once: true });

  return {
    signal: controller.signal,
    cleanup: () => {
      primary.removeEventListener("abort", abort);
      secondary.removeEventListener("abort", abort);
    },
  };
}

async function withStageTimeout<T>(
  stage: ScanStageName,
  timeoutMs: number,
  task: (signal: AbortSignal) => Promise<T>,
) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new ScanStageTimeoutError(stage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([task(controller.signal), timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function retryTransient<T>(
  task: () => Promise<T>,
  attempts = TRANSIENT_RETRY_ATTEMPTS,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;

      if (!isTransientError(error) || attempt === attempts) {
        break;
      }
    }
  }

  throw lastError;
}

function createEmptyResult(finalUrl = ""): ScanResult {
  return {
    score: 0,
    grade: "A",
    threatLevel: "low",
    scoreBreakdown: {
      positives: [],
      penalties: [],
      ceilings: [],
      rawScore: 0,
      finalScore: 0,
      grade: "A",
      attenuationProfile: "standard",
      redirectAnalysis: {
        hops: 0,
        intent: "standard",
        chain: [],
        crossDomain: false,
      },
    },
    observableCoverage: {
      tls: "failed",
      headers: "failed",
      infrastructure: "limited",
      reputation: "not-checked",
      overall: "limited",
    },
    deterministicHash: "",
    ssl: {
      valid: false,
      selfSigned: false,
      issuer: "",
      daysLeft: 0,
      protocol: "",
      cipher: "",
      weakProtocol: false,
      weakCipher: false,
    },
    headers: Object.fromEntries(
      SECURITY_HEADERS.map((header) => [header, false]),
    ),
    intelligence: {
      domain: "",
      reputation: "neutral",
      suspiciousTld: false,
      punycode: false,
      typosquatting: false,
      phishingKeywords: [],
      excessiveSubdomains: false,
      entropy: 0,
      dnsRisk: "low",
      activePhishingIndicators: false,
    },
    infrastructure: {
      cdn: "",
      waf: "",
      hostingProvider: "",
      cloudProvider: "",
      asn: "",
      reverseProxy: "",
      framework: "",
      ipOwner: "",
      confidence: 0,
      detections: [],
      serverExposureScore: 0,
      redirectTrust: "neutral",
    },
    technologies: [],
    reputation: null,
    redirects: {
      chain: [],
      suspicious: false,
      analysis: {
        hops: 0,
        intent: "standard",
        chain: [],
        crossDomain: false,
      },
    },
    meta: {
      responseTime: 0,
      statusCode: 0,
      finalUrl,
      server: "",
      scanTimestamp: new Date().toISOString(),
      stages: createInitialStages(),
    },
    findings: [],
  };
}

function addFinding(
  findings: Finding[],
  severity: Severity,
  en: string,
  ar: string,
  id?: IntelligenceFindingId,
) {
  const intelligence = id ? intelligenceMap[id] : undefined;

  findings.push({
    ...(id ? { id } : {}),
    severity: intelligence?.severity ?? severity,
    message: { en, ar },
    ...(intelligence
      ? {
          impact: intelligence.impact,
          remediation: intelligence.remediation,
        }
      : {}),
  });
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function generateDeterministicHash(scanResult: ScanResult) {
  const rawScoringData = {
    ssl: scanResult.ssl,
    headers: scanResult.headers,
    intelligence: scanResult.intelligence,
    infrastructure: scanResult.infrastructure,
    reputation: scanResult.reputation,
    redirects: scanResult.redirects,
    statusCode: scanResult.meta.statusCode,
    stageStatuses: Object.fromEntries(
      Object.entries(scanResult.meta.stages).map(([stage, state]) => [
        stage,
        state.status,
      ]),
    ),
    technologies: scanResult.technologies,
    findingSeverities: scanResult.findings.map((finding) => finding.severity),
  };
  const source = stableStringify(rawScoringData);
  let hash = 0x811c9dc5;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `cg-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function normalizeFindingTitle(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized
    .replace(/\bmissing security header\b/g, " ")
    .replace(/\btechnical issue\b/g, " ")
    .replace(/\breview\b/g, " ")
    .replace(/\bdetected\b/g, " ")
    .replace(/\ba detected\b/g, " ")
    .replace(/\bthe detected\b/g, " ")
    .replace(/\bcross domain redirects?\b/g, "redirect")
    .replace(/\bcross domain flows?\b/g, "redirect")
    .replace(/\bredirect chains?\b/g, "redirect")
    .replace(/\bredirects? detected\b/g, "redirect")
    .replace(/\bunexpected redirects?\b/g, "redirect")
    .replace(/\bsuspicious redirects?\b/g, "redirect")
    .replace(/\s+/g, " ")
    .trim();
}

function getFindingDedupeKey(finding: Finding) {
  const combinedText = [
    finding.id ?? "",
    finding.message.en,
    finding.impact?.en ?? "",
    finding.remediation?.en ?? "",
  ].join(" ");
  const normalizedText = normalizeFindingTitle(combinedText);

  if (
    /\bredirect\b/.test(normalizedText) ||
    /\bcross domain\b/.test(normalizedText)
  ) {
    return "root:redirect";
  }

  if (normalizedText.includes("content security policy") || normalizedText.includes("csp")) {
    return "root:content-security-policy";
  }

  if (normalizedText.includes("strict transport security") || normalizedText.includes("hsts")) {
    return "root:strict-transport-security";
  }

  if (normalizedText.includes("x frame options") || normalizedText.includes("clickjacking")) {
    return "root:x-frame-options";
  }

  if (
    normalizedText.includes("x content type options") ||
    normalizedText.includes("mime sniffing")
  ) {
    return "root:x-content-type-options";
  }

  if (normalizedText.includes("referrer policy")) {
    return "root:referrer-policy";
  }

  if (normalizedText.includes("permissions policy")) {
    return "root:permissions-policy";
  }

  if (normalizedText.includes("tls") || normalizedText.includes("ssl")) {
    if (normalizedText.includes("self signed")) {
      return "root:self-signed-tls";
    }

    if (normalizedText.includes("expired") || normalizedText.includes("expires")) {
      return "root:tls-expiration";
    }

    if (normalizedText.includes("weak") || normalizedText.includes("deprecated")) {
      return "root:weak-tls";
    }

    return "root:tls";
  }

  if (
    normalizedText.includes("infrastructure") ||
    normalizedText.includes("server metadata")
  ) {
    return "root:infrastructure-exposure";
  }

  return `root:${normalizedText}`;
}

function getSeverityRank(severity: Severity) {
  const ranks: Record<Severity, number> = {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2,
    informational: 1,
  };

  return ranks[severity];
}

function getFindingDetailScore(finding: Finding) {
  return (
    (finding.id ? 100 : 0) +
    (finding.impact ? 80 : 0) +
    (finding.remediation ? 80 : 0) +
    finding.message.en.length +
    finding.message.ar.length +
    (finding.impact?.en.length ?? 0) +
    (finding.impact?.ar.length ?? 0) +
    (finding.remediation?.en.length ?? 0) +
    (finding.remediation?.ar.length ?? 0)
  );
}

function isActionableFinding(finding: Finding) {
  const actionablePrefix = /^(enable|add|enforce|configure|review|restrict|remove|harden|investigate|verify|reduce)\b/i;

  return (
    actionablePrefix.test(finding.message.en.trim()) ||
    actionablePrefix.test(finding.remediation?.en.trim() ?? "")
  );
}

function dedupeFindings(findings: Finding[]) {
  const uniqueFindings = new Map<string, Finding>();

  findings.forEach((finding) => {
    const key = getFindingDedupeKey(finding);
    const existing = uniqueFindings.get(key);

    if (!existing) {
      uniqueFindings.set(key, finding);
      return;
    }

    const findingDetail = getFindingDetailScore(finding);
    const existingDetail = getFindingDetailScore(existing);
    const findingSeverity = getSeverityRank(finding.severity);
    const existingSeverity = getSeverityRank(existing.severity);
    const findingActionable = isActionableFinding(finding);
    const existingActionable = isActionableFinding(existing);

    if (
      findingSeverity > existingSeverity ||
      (findingSeverity === existingSeverity &&
        findingActionable &&
        !existingActionable) ||
      (findingSeverity === existingSeverity &&
        findingActionable === existingActionable &&
        findingDetail > existingDetail)
    ) {
      uniqueFindings.set(key, finding);
    }
  });

  return Array.from(uniqueFindings.values());
}

function getRecommendationRootKeys(result: ScanResult) {
  const recommendationRoots = new Set<string>();

  if (result.redirects.suspicious || result.redirects.analysis?.intent === "suspicious") {
    recommendationRoots.add("root:redirect");
  }

  if (result.technologies.length > 0 || result.meta.server) {
    recommendationRoots.add("root:infrastructure-exposure");
  }

  return recommendationRoots;
}

function removeFindingRecommendationOverlaps(result: ScanResult) {
  const recommendationRoots = getRecommendationRootKeys(result);

  if (recommendationRoots.size === 0) {
    return result.findings;
  }

  return result.findings.filter((finding) => {
    const key = getFindingDedupeKey(finding);

    if (!recommendationRoots.has(key)) {
      return true;
    }

    return isActionableFinding(finding);
  });
}

function finalizeScore(result: ScanResult) {
  result.findings = dedupeFindings(result.findings);
  const scoring = calculateFinalScore(result);
  result.score = scoring.score;
  result.grade = scoring.grade;
  result.threatLevel = scoring.threatLevel;
  result.scoreBreakdown = scoring.scoreBreakdown;
  result.observableCoverage = scoring.observableCoverage;
  result.findings = removeFindingRecommendationOverlaps(result);
  result.deterministicHash = generateDeterministicHash(result);

  return Object.freeze(result);
}

function readResponseServerHeader(response: Response): string | null {
  const direct = response.headers.get("server") ?? response.headers.get("Server");
  if (direct?.trim()) {
    return direct.trim();
  }

  for (const [key, value] of Array.from(response.headers.entries())) {
    if (key.toLowerCase() === "server" && value?.trim()) {
      return value.trim();
    }
  }

  return null;
}

async function tryFetchServerHeaderSupplement(url: string, timeoutMs: number): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      headers: {
        Accept: "text/html, application/xhtml+xml",
        Range: "bytes=0-0",
      },
      signal: controller.signal,
    });

    await response.body?.cancel();
    return readResponseServerHeader(response);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function sanitizeServerHeader(serverHeader: string | null) {
  if (!serverHeader) {
    return "";
  }

  return serverHeader
    .split(/\s+/)
    .map((part) => part.replace(/\/[\w.+-]+/g, ""))
    .join(" ")
    .trim();
}

function getRegistrableDomain(hostname: string) {
  const parts = hostname.toLowerCase().split(".").filter(Boolean);

  if (parts.length <= 2) {
    return parts.join(".");
  }

  return parts.slice(-2).join(".");
}

function calculateEntropy(value: string) {
  if (!value) {
    return 0;
  }

  const counts = Array.from(value).reduce<Record<string, number>>(
    (accumulator, char) => {
      accumulator[char] = (accumulator[char] ?? 0) + 1;
      return accumulator;
    },
    {},
  );
  const entropy = Object.values(counts).reduce((total, count) => {
    const probability = count / value.length;
    return total - probability * Math.log2(probability);
  }, 0);

  return Number(entropy.toFixed(2));
}

function normalizeForTyposquatting(value: string) {
  return Array.from(value)
    .map((char) => TYPO_REPLACEMENTS[char] ?? char)
    .join("")
    .replace(/[^a-z]/g, "");
}

function hasTyposquattingIndicator(label: string, domain: string) {
  const normalized = normalizeForTyposquatting(label);

  return BRAND_KEYWORDS.some((brand) => {
    if (domain === `${brand}.com` || label === brand) {
      return false;
    }

    return (
      normalized.includes(brand) ||
      (Math.abs(normalized.length - brand.length) <= 2 &&
        normalized[0] === brand[0] &&
        normalized.at(-1) === brand.at(-1))
    );
  });
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function analyzeDomainIntelligence(targetUrl: URL, findings: Finding[]) {
  const hostname = targetUrl.hostname.toLowerCase();
  const domain = getRegistrableDomain(hostname);
  const labels = hostname.split(".").filter(Boolean);
  const tld = labels.at(-1) ?? "";
  const primaryLabel = domain.split(".")[0] ?? "";
  const searchableUrl = safeDecode(targetUrl.toString()).toLowerCase();
  const phishingKeywords = PHISHING_KEYWORDS.filter((keyword) =>
    searchableUrl.includes(keyword),
  );
  const activePhishingIndicators =
    (hostname.includes("xn--") || hasTyposquattingIndicator(primaryLabel, domain)) &&
    phishingKeywords.some((keyword) =>
      ["login", "signin", "password", "verify", "account", "wallet"].includes(keyword),
    );
  const intelligence: ScanResult["intelligence"] = {
    domain,
    reputation: TRUSTED_DOMAINS.has(domain) ? "trusted" : "neutral",
    suspiciousTld: SUSPICIOUS_TLDS.has(tld),
    punycode: hostname.includes("xn--"),
    typosquatting: hasTyposquattingIndicator(primaryLabel, domain),
    phishingKeywords,
    excessiveSubdomains: labels.length > 4,
    entropy: calculateEntropy(primaryLabel),
    dnsRisk: activePhishingIndicators
      ? "high"
      : hostname.includes("xn--") || SUSPICIOUS_TLDS.has(tld)
        ? "medium"
        : "low",
    activePhishingIndicators,
  };

  if (
    intelligence.suspiciousTld ||
    intelligence.punycode ||
    intelligence.typosquatting ||
    intelligence.phishingKeywords.length > 0 ||
    intelligence.excessiveSubdomains ||
    intelligence.entropy >= 4.2
  ) {
    intelligence.reputation = "suspicious";
  }

  if (intelligence.suspiciousTld) {
    addFinding(
      findings,
      "medium",
      "The domain uses a top-level domain commonly associated with abuse.",
      "يستخدم النطاق امتدادًا شائع الارتباط بإساءة الاستخدام.",
    );
  }

  if (intelligence.activePhishingIndicators) {
    addFinding(
      findings,
      "critical",
      "The URL combines deceptive Domain indicators with authentication-oriented Phishing keywords.",
      "يجمع URL بين مؤشرات Domain خادعة وكلمات Phishing مرتبطة بتسجيل الدخول أو الحسابات.",
    );
  }

  if (intelligence.punycode) {
    addFinding(
      findings,
      "medium",
      "The domain uses punycode/IDN encoding, which can hide lookalike characters.",
      "يستخدم النطاق ترميز Punycode/IDN الذي قد يخفي أحرفًا مشابهة.",
    );
  }

  if (intelligence.typosquatting) {
    addFinding(
      findings,
      "high",
      "The domain contains typosquatting indicators related to a known brand.",
      "يحتوي النطاق على مؤشرات انتحال كتابي مرتبطة بعلامة معروفة.",
    );
  }

  if (intelligence.phishingKeywords.length > 0) {
    addFinding(
      findings,
      "medium",
      "The URL contains keywords frequently used in phishing campaigns.",
      "يحتوي الرابط على كلمات تظهر كثيرًا في حملات التصيد.",
    );
  }

  if (intelligence.excessiveSubdomains) {
    addFinding(
      findings,
      "low",
      "The hostname uses an unusually deep subdomain structure.",
      "يستخدم اسم المضيف بنية نطاقات فرعية عميقة بشكل غير معتاد.",
    );
  }

  if (intelligence.entropy >= 4.2) {
    addFinding(
      findings,
      "medium",
      "The primary domain label has high entropy and may be automatically generated.",
      "يمتلك اسم النطاق الأساسي عشوائية عالية وقد يكون مولدًا آليًا.",
    );
  }

  return intelligence;
}

function getIssuerName(certificate: PeerCertificate) {
  return (
    certificate.issuer?.O ||
    certificate.issuer?.CN ||
    certificate.issuer?.OU ||
    "Unknown issuer"
  );
}

function getCertificateDaysLeft(validTo?: string) {
  if (!validTo) {
    return 0;
  }

  const expiresAt = new Date(validTo).getTime();

  if (Number.isNaN(expiresAt)) {
    return 0;
  }

  return Math.ceil((expiresAt - Date.now()) / 86_400_000);
}

function isSelfSignedCertificate(socket: TlsSocketLike, certificate: PeerCertificate) {
  const issuerCertificate = certificate.issuerCertificate;
  const sameFingerprint =
    Boolean(issuerCertificate?.fingerprint256) &&
    issuerCertificate?.fingerprint256 === certificate.fingerprint256;
  const sameSubjectAndIssuer =
    certificate.subject?.CN !== undefined &&
    certificate.subject.CN === certificate.issuer?.CN;

  return (
    socket.authorizationError === "DEPTH_ZERO_SELF_SIGNED_CERT" ||
    sameFingerprint ||
    sameSubjectAndIssuer
  );
}

function isWeakTlsProtocol(protocol: string) {
  return ["SSLv2", "SSLv3", "TLSv1", "TLSv1.1"].includes(protocol);
}

function isWeakCipher(cipher: string) {
  const normalized = cipher.toUpperCase();

  return (
    normalized.includes("RC4") ||
    normalized.includes("3DES") ||
    normalized.includes("DES") ||
    normalized.includes("MD5") ||
    normalized.includes("NULL") ||
    normalized.includes("EXPORT")
  );
}

function isRedirectStatus(statusCode: number) {
  return [301, 302, 303, 307, 308].includes(statusCode);
}

function isAllowedContentType(contentType: string | null) {
  if (!contentType) {
    return true;
  }

  const normalized = contentType.split(";")[0]?.trim().toLowerCase();

  return normalized === "text/html" || normalized === "application/xhtml+xml";
}

function isResponseTooLarge(contentLength: string | null) {
  if (!contentLength) {
    return false;
  }

  const size = Number(contentLength);

  return Number.isFinite(size) && size > MAX_RESPONSE_BYTES;
}

function isAntiBotOrChallengeResponse(response: Response) {
  const headers = Array.from(response.headers.entries())
    .map(([key, value]) => `${key}:${value}`)
    .join(" ")
    .toLowerCase();
  const server = readResponseServerHeader(response)?.toLowerCase() ?? "";

  return (
    response.status === 403 ||
    headers.includes("cf-mitigated") ||
    headers.includes("cf-chl") ||
    headers.includes("cloudflare challenge") ||
    headers.includes("akamai bot") ||
    headers.includes("x-sucuri-block") ||
    headers.includes("datadome") ||
    headers.includes("perimeterx") ||
    server.includes("cloudflare")
  );
}

/**
 * Many providers strip or reshape headers for automated clients. A small response with none of the
 * tracked security headers is not proof those controls are absent site-wide — only that we could
 * not observe them on this surface.
 */
function shouldTreatFinalResponseAsLimitedObservableSurface(
  response: Response,
  headersUnableToVerify: boolean,
): boolean {
  if (headersUnableToVerify) {
    return true;
  }

  if (response.status === 403 || response.status === 503) {
    return true;
  }

  const distinctKeys = Array.from(response.headers.keys()).length;
  const anyTrackedSecurityHeaderPresent = SECURITY_HEADERS.some((header) =>
    response.headers.has(header),
  );

  return distinctKeys <= 14 && !anyTrackedSecurityHeaderPresent;
}

async function inspectTlsCertificate(
  targetUrl: URL,
  signal: AbortSignal,
  timeoutMs: number,
) {
  if (targetUrl.protocol !== "https:") {
    return {
      valid: false,
      selfSigned: false,
      issuer: "",
      daysLeft: 0,
      protocol: "",
      cipher: "",
      weakProtocol: false,
      weakCipher: false,
    };
  }

  assertNodeRuntime();

  const { connect } = await loadTls();

  return new Promise<ScanResult["ssl"]>((resolve) => {
    const socket = connect({
      host: targetUrl.hostname,
      port: Number(targetUrl.port || 443),
      servername: targetUrl.hostname,
      rejectUnauthorized: false,
    }) as TlsSocketLike;

    const cleanup = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      socket.removeAllListeners();
      socket.destroy();
    };

    const finish = (ssl: ScanResult["ssl"]) => {
      cleanup();
      resolve(ssl);
    };

    const abort = () => {
      finish({
        valid: false,
        selfSigned: false,
        issuer: "",
        daysLeft: 0,
        protocol: "",
        cipher: "",
        weakProtocol: false,
        weakCipher: false,
      });
    };

    const timer = setTimeout(abort, timeoutMs);

    signal.addEventListener("abort", abort, { once: true });

    socket.once("secureConnect", () => {
      const certificate = socket.getPeerCertificate(true) as PeerCertificate;

      if (!certificate || Object.keys(certificate).length === 0) {
        finish({
          valid: false,
          selfSigned: false,
          issuer: "",
          daysLeft: 0,
          protocol: "",
          cipher: "",
          weakProtocol: false,
          weakCipher: false,
        });
        return;
      }

      const daysLeft = getCertificateDaysLeft(certificate.valid_to);
      const selfSigned = isSelfSignedCertificate(socket, certificate);
      const tlsProtocol = socket.getProtocol() ?? "";
      const cipher = socket.getCipher();
      const cipherName = cipher.standardName || cipher.name || "";

      /**
       * Scanner connects with rejectUnauthorized:false to read peer material. Node's
       * `socket.authorized` can be false for benign chain/hostname policy differences while
       * the peer still presents a non-expired, non-self-signed certificate on modern TLS.
       * `ssl.valid` therefore reflects observable certificate material + crypto posture, not
       * full browser-equivalent PKI success (which would duplicate `authorized` semantics).
       */
      const materialCertificateOk =
        !selfSigned &&
        daysLeft > 0 &&
        !isWeakTlsProtocol(tlsProtocol) &&
        !isWeakCipher(cipherName);

      finish({
        valid: materialCertificateOk,
        selfSigned,
        issuer: getIssuerName(certificate),
        daysLeft,
        protocol: tlsProtocol,
        cipher: cipherName,
        weakProtocol: isWeakTlsProtocol(tlsProtocol),
        weakCipher: isWeakCipher(cipherName),
      });
    });

    socket.once("error", abort);
  });
}

async function safeFetch(url: string, signal: AbortSignal): Promise<FetchStep> {
  const headResponse = await fetch(url, {
    method: "HEAD",
    redirect: "manual",
    cache: "no-store",
    signal,
  });

  if (![405, 501].includes(headResponse.status)) {
    return {
      response: headResponse,
      url,
      statusCode: headResponse.status,
    };
  }

  // Fallback keeps bandwidth low when HEAD is unsupported. The body is never
  // parsed or rendered, and it is cancelled as soon as response headers arrive.
  const getResponse = await fetch(url, {
    method: "GET",
    redirect: "manual",
    cache: "no-store",
    headers: {
      Accept: "text/html, application/xhtml+xml",
      Range: "bytes=0-0",
    },
    signal,
  });

  await getResponse.body?.cancel();

  return {
    response: getResponse,
    url,
    statusCode: getResponse.status,
  };
}

async function safeFetchWithRetry(
  url: string,
  parentSignal: AbortSignal,
): Promise<FetchStep> {
  return retryTransient(() =>
    withStageTimeout("headers", STAGE_TIMEOUTS.headers, async (fetchSignal) => {
      const combined = combineSignals(parentSignal, fetchSignal);

      try {
        return await safeFetch(url, combined.signal);
      } finally {
        combined.cleanup();
      }
    }),
  );
}

async function validateWithDnsTimeout(
  input: string,
  validateUrl: ValidateUrl,
): Promise<ValidationResult> {
  let lastResult: ValidationResult | null = null;
  let lastError: unknown;

  for (let attempt = 1; attempt <= TRANSIENT_RETRY_ATTEMPTS; attempt += 1) {
    let result: ValidationResult;

    try {
      result = await withStageTimeout("dns", STAGE_TIMEOUTS.dns, () =>
        validateUrl(input),
      );
      lastResult = result;
    } catch (error) {
      lastError = error;

      if (!isTransientError(error) || attempt === TRANSIENT_RETRY_ATTEMPTS) {
        throw error;
      }

      continue;
    }

    if (
      result.valid ||
      !["dns_timeout", "dns_failed"].includes(result.blockedReason ?? "") ||
      attempt === TRANSIENT_RETRY_ATTEMPTS
    ) {
      return result;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return lastResult ?? { valid: false, url: input, blockedReason: "dns_failed" };
}

async function followRedirects(
  initialUrl: string,
  signal: AbortSignal,
  findings: Finding[],
  validateUrl: ValidateUrl,
) {
  const chain: RedirectStep[] = [];
  const visited = new Set<string>();
  let currentUrl = initialUrl;
  let hopWorst: RedirectIntent = "standard";
  const flags: RedirectAnalysisFlags = {
    loop: false,
    maxDepthExceeded: false,
    validationFailed: false,
  };
  let finalStep: FetchStep | null = null;

  for (let depth = 0; depth <= MAX_REDIRECTS; depth += 1) {
    const validation = await validateUrl(currentUrl);

    if (!validation.valid) {
      flags.validationFailed = true;
      addFinding(
        findings,
        "high",
        "A redirect target failed URL safety validation.",
        "فشل هدف إعادة التوجيه في فحص أمان الرابط.",
      );
      break;
    }

    currentUrl = validation.url;

    if (visited.has(currentUrl)) {
      flags.loop = true;
      addFinding(
        findings,
        "high",
        "A redirect loop was detected.",
        "تم اكتشاف حلقة إعادة توجيه.",
        "redirect-loop",
      );
      break;
    }

    visited.add(currentUrl);

    const step = await safeFetchWithRetry(currentUrl, signal);
    chain.push({
      url: currentUrl,
      statusCode: step.statusCode,
    });

    if (!isRedirectStatus(step.statusCode)) {
      finalStep = step;
      break;
    }

    if (depth === MAX_REDIRECTS) {
      flags.maxDepthExceeded = true;
      addFinding(
        findings,
        "medium",
        "Redirect depth exceeded the maximum allowed limit.",
        "تجاوزت عمليات إعادة التوجيه الحد الأقصى المسموح.",
        "suspicious-redirect",
      );
      break;
    }

    const location = step.response.headers.get("location");

    if (!location) {
      finalStep = step;
      break;
    }

    const nextUrl = new URL(location, currentUrl).toString();
    const hopIntent = classifyRedirectHop(currentUrl, nextUrl);
    hopWorst = mergeRedirectIntent(hopWorst, hopIntent);

    if (hopIntent === "suspicious") {
      addFinding(
        findings,
        "medium",
        "A redirect targets a different registrable domain or an unexpected destination.",
        "توجّه إعادة التوجيه إلى نطاق مسجّل مختلف أو وجهة غير متوقعة.",
        "cross-domain-redirect",
      );
    }

    currentUrl = nextUrl;
  }

  const analysis = finalizeRedirectAnalysis(chain, hopWorst, flags);

  return {
    chain,
    suspicious: analysis.intent === "suspicious",
    analysis,
    finalStep,
    finalUrl: finalStep?.url || currentUrl,
  };
}

function analyzeSecurityHeaders(
  response: Response,
  findings: Finding[],
  unableToVerify = false,
) {
  const headers: Record<string, boolean> = {};
  const headerFindingIds: Partial<Record<(typeof SECURITY_HEADERS)[number], IntelligenceFindingId>> = {
    "strict-transport-security": "missing-hsts",
    "content-security-policy": "missing-csp",
    "x-frame-options": "missing-x-frame-options",
    "x-content-type-options": "missing-x-content-type-options",
    "referrer-policy": "missing-referrer-policy",
    "permissions-policy": "missing-permissions-policy",
  };

  for (const header of SECURITY_HEADERS) {
    const present = response.headers.has(header);
    headers[header] = present;

    if (!present && !unableToVerify) {
      addFinding(
        findings,
        "low",
        `Missing security header: ${header}.`,
        `رأس الأمان مفقود: ${header}.`,
        headerFindingIds[header],
      );
    }
  }

  return headers;
}

function analyzeResponseSafety(response: Response, findings: Finding[]) {
  if (isResponseTooLarge(response.headers.get("content-length"))) {
    addFinding(
      findings,
      "medium",
      "Response size exceeds the scanner safety limit.",
      "حجم الاستجابة يتجاوز حد الأمان الخاص بالفاحص.",
    );
  }

  if (!isAllowedContentType(response.headers.get("content-type"))) {
    addFinding(
      findings,
      "medium",
      "Unsupported or non-HTML content type was detected.",
      "تم اكتشاف نوع محتوى غير مدعوم أو غير HTML.",
    );
  }
}

function addTechnology(technologies: Set<string>, value: string) {
  technologies.add(value);
}

function createPassiveSignals(
  response: Response,
  finalUrl: string,
  redirects: ScanResult["redirects"],
): PassiveSignals {
  const server = readResponseServerHeader(response)?.toLowerCase() ?? "";
  const poweredBy = response.headers.get("x-powered-by")?.toLowerCase() ?? "";
  const via = response.headers.get("via")?.toLowerCase() ?? "";
  const altSvc = response.headers.get("alt-svc")?.toLowerCase() ?? "";
  const cookies = response.headers.get("set-cookie")?.toLowerCase() ?? "";
  const headerNames = Array.from(response.headers.keys()).join(" ").toLowerCase();
  const headerValues = Array.from(response.headers.entries())
    .map(([key, value]) => `${key}:${value}`)
    .join(" ")
    .toLowerCase();
  let finalHostname = "";

  try {
    finalHostname = new URL(finalUrl).hostname.toLowerCase();
  } catch {
    finalHostname = "";
  }

  const redirectHostnames = redirects.chain
    .map((step) => {
      try {
        return new URL(step.url).hostname.toLowerCase();
      } catch {
        return "";
      }
    })
    .filter(Boolean);

  return {
    headerNames,
    headerValues,
    server,
    poweredBy,
    via,
    altSvc,
    cookies,
    finalHostname,
    redirectHostnames,
  };
}

function hasSignal(signals: PassiveSignals, patterns: string[]) {
  return patterns.some((pattern) =>
    signals.headerNames.includes(pattern) ||
    signals.headerValues.includes(pattern) ||
    signals.server.includes(pattern) ||
    signals.poweredBy.includes(pattern) ||
    signals.via.includes(pattern) ||
    signals.altSvc.includes(pattern) ||
    signals.cookies.includes(pattern) ||
    signals.finalHostname.includes(pattern) ||
    signals.redirectHostnames.some((hostname) => hostname.includes(pattern)),
  );
}

function addCandidate(
  candidates: Candidate[],
  category: InfrastructureDetection["category"],
  name: string,
  weight: number,
  signal: string,
) {
  const existing = candidates.find(
    (candidate) => candidate.category === category && candidate.name === name,
  );

  if (existing) {
    existing.score += weight;
    existing.signals.push(signal);
    return;
  }

  candidates.push({
    category,
    name,
    score: weight,
    signals: [signal],
  });
}

function collectPassiveInfrastructureCandidates(signals: PassiveSignals) {
  const candidates: Candidate[] = [];

  /** Generic Google Frontend–class edge signals (no hostname allowlist). */
  const gfeAltSvc =
    signals.altSvc.includes("h3") ||
    signals.altSvc.includes("quic") ||
    signals.altSvc.includes("hq-interop");
  const gfeVia = /\bgoogle\b/.test(signals.via);
  const gfeServer = signals.server.includes("gws") || signals.server.includes("gfe");
  const gfeHeaders =
    signals.headerNames.includes("x-goog") || signals.headerValues.includes("x-goog");

  if (gfeServer || gfeVia || gfeHeaders || gfeAltSvc) {
    addCandidate(candidates, "cdn", "GFE-class edge proxy", 44, "gfe_edge_signal");
    addCandidate(candidates, "reverseProxy", "GFE-class edge proxy", 40, "gfe_edge_signal");
  }

  if (hasSignal(signals, ["cf-ray", "cf-cache-status", "__cf_bm", "cloudflare"])) {
    addCandidate(candidates, "cdn", "Cloudflare", 45, "cloudflare_edge_headers");
    addCandidate(candidates, "waf", "Cloudflare WAF", 35, "cloudflare_security_headers");
    addCandidate(candidates, "reverseProxy", "Cloudflare", 42, "cloudflare_reverse_proxy");
    addCandidate(candidates, "asn", "Cloudflare AS13335", 42, "cloudflare_network_signal");
    addCandidate(candidates, "ipOwner", "Cloudflare", 42, "cloudflare_network_signal");
  }

  if (hasSignal(signals, ["x-vercel-id", "x-vercel-cache", "vercel", ".vercel.app"])) {
    addCandidate(candidates, "cdn", "Vercel Edge Network", 38, "vercel_edge_headers");
    addCandidate(candidates, "hosting", "Vercel", 45, "vercel_platform_headers");
    addCandidate(candidates, "cloud", "Vercel", 34, "vercel_platform_headers");
    addCandidate(candidates, "reverseProxy", "Vercel Edge", 40, "vercel_edge_headers");
    addCandidate(candidates, "asn", "Vercel AS398101", 40, "vercel_network_signal");
    addCandidate(candidates, "ipOwner", "Vercel", 40, "vercel_network_signal");
  }

  if (hasSignal(signals, ["x-nf-request-id", "netlify", ".netlify.app"])) {
    addCandidate(candidates, "cdn", "Netlify Edge", 36, "netlify_edge_headers");
    addCandidate(candidates, "hosting", "Netlify", 45, "netlify_platform_headers");
    addCandidate(candidates, "cloud", "Netlify", 30, "netlify_platform_headers");
    addCandidate(candidates, "reverseProxy", "Netlify Edge", 40, "netlify_edge_headers");
    addCandidate(candidates, "ipOwner", "Netlify", 40, "netlify_network_signal");
  }

  if (hasSignal(signals, ["rndr-id", "render", ".onrender.com"])) {
    addCandidate(candidates, "hosting", "Render", 45, "render_platform_headers");
    addCandidate(candidates, "cloud", "Render", 30, "render_platform_headers");
    addCandidate(candidates, "reverseProxy", "Render Edge", 40, "render_edge_signal");
    addCandidate(candidates, "ipOwner", "Render", 40, "render_network_signal");
  }

  if (hasSignal(signals, ["x-amz", "cloudfront", "amazon", "aws", "awselb", "elb"])) {
    addCandidate(candidates, "cdn", "AWS CloudFront", 34, "aws_edge_headers");
    addCandidate(candidates, "cloud", "AWS", 45, "aws_headers");
    addCandidate(candidates, "hosting", "AWS", 30, "aws_headers");
    addCandidate(candidates, "reverseProxy", "AWS Elastic Load Balancer", 40, "aws_load_balancer_signal");
    addCandidate(candidates, "asn", "Amazon AS16509", 42, "aws_network_signal");
    addCandidate(candidates, "ipOwner", "Amazon Web Services", 42, "aws_network_signal");
  }

  if (hasSignal(signals, ["azure", "x-azure", "azurewebsites.net", "microsoft-iis"])) {
    addCandidate(candidates, "cloud", "Azure", 42, "azure_headers");
    addCandidate(candidates, "hosting", "Azure App Service", 32, "azure_hosting_signal");
    addCandidate(candidates, "asn", "Microsoft AS8075", 42, "azure_network_signal");
    addCandidate(candidates, "ipOwner", "Microsoft Azure", 42, "azure_network_signal");
  }

  if (hasSignal(signals, ["google", "gcp", "appspot.com", "run.app", "x-cloud-trace-context"])) {
    addCandidate(candidates, "cloud", "GCP", 42, "gcp_headers");
    addCandidate(candidates, "hosting", "Google Cloud", 32, "gcp_hosting_signal");
    addCandidate(candidates, "asn", "Google AS15169", 42, "gcp_network_signal");
    addCandidate(candidates, "ipOwner", "Google Cloud", 42, "gcp_network_signal");
  }

  if (hasSignal(signals, ["sucuri", "x-sucuri-id", "x-sucuri-cache"])) {
    addCandidate(candidates, "waf", "Sucuri WAF", 42, "sucuri_security_headers");
    addCandidate(candidates, "cdn", "Sucuri CDN", 25, "sucuri_edge_headers");
  }

  if (hasSignal(signals, ["akamai", "x-akamai", "akamai-ghost"])) {
    addCandidate(candidates, "cdn", "Akamai", 42, "akamai_headers");
    addCandidate(candidates, "waf", "Akamai WAF", 40, "akamai_security_signal");
    addCandidate(candidates, "asn", "Akamai AS20940", 42, "akamai_network_signal");
    addCandidate(candidates, "ipOwner", "Akamai", 42, "akamai_network_signal");
  }

  if (hasSignal(signals, ["fastly", "x-served-by", "x-cache-hits"])) {
    addCandidate(candidates, "cdn", "Fastly", 40, "fastly_headers");
    addCandidate(candidates, "reverseProxy", "Fastly", 40, "fastly_proxy_signal");
    addCandidate(candidates, "asn", "Fastly AS54113", 42, "fastly_network_signal");
    addCandidate(candidates, "ipOwner", "Fastly", 42, "fastly_network_signal");
  }

  if (hasSignal(signals, ["nginx"])) {
    addCandidate(candidates, "reverseProxy", "nginx", 40, "nginx_server_header");
    addCandidate(candidates, "server", "nginx", 42, "nginx_server_header");
  }

  if (hasSignal(signals, ["apache"])) {
    addCandidate(candidates, "server", "Apache", 42, "apache_server_header");
    addCandidate(candidates, "reverseProxy", "Apache", 40, "apache_server_header");
  }

  if (hasSignal(signals, ["express"])) {
    addCandidate(candidates, "framework", "Express", 42, "express_powered_by_header");
  }

  if (hasSignal(signals, ["nextjs", "next.js", "x-nextjs", "_next", "__next", "next-router"])) {
    addCandidate(candidates, "framework", "Next.js", 42, "nextjs_headers_or_cookies");
  }

  if (hasSignal(signals, ["wordpress", "wp-", "x-redirect-by:wordpress"])) {
    addCandidate(candidates, "framework", "WordPress", 42, "wordpress_headers_or_cookies");
  }

  return candidates;
}

function toDetection(candidate: Candidate): InfrastructureDetection {
  const uniqueSignals = Array.from(new Set(candidate.signals)).sort((a, b) =>
    a.localeCompare(b),
  );
  const signalBonus = uniqueSignals.length > 1 ? 14 : 0;

  return {
    category: candidate.category,
    name: candidate.name,
    confidence: Math.min(95, candidate.score + signalBonus),
    signals: uniqueSignals,
  };
}

function selectDetection(
  detections: InfrastructureDetection[],
  category: InfrastructureDetection["category"],
) {
  return detections
    .filter((detection) => detection.category === category && detection.confidence >= 40)
    .sort((left, right) => {
      if (right.confidence !== left.confidence) {
        return right.confidence - left.confidence;
      }

      return left.name.localeCompare(right.name);
    })[0];
}

function detectTechnologies(response: Response, finalUrl: string, redirects: ScanResult["redirects"]) {
  const technologies = new Set<string>();
  const signals = createPassiveSignals(response, finalUrl, redirects);
  const detections = collectPassiveInfrastructureCandidates(signals).map(toDetection);

  if (selectDetection(detections, "server")?.name === "nginx") {
    addTechnology(technologies, "nginx");
  }

  if (selectDetection(detections, "server")?.name === "Apache") {
    addTechnology(technologies, "Apache");
  }

  if (selectDetection(detections, "cdn")?.name === "Cloudflare") {
    addTechnology(technologies, "Cloudflare");
  }

  if (selectDetection(detections, "hosting")?.name === "Vercel") {
    addTechnology(technologies, "Vercel");
  }

  if (selectDetection(detections, "hosting")?.name === "Netlify") {
    addTechnology(technologies, "Netlify");
  }

  if (selectDetection(detections, "hosting")?.name === "Render") {
    addTechnology(technologies, "Render");
  }

  if (selectDetection(detections, "cloud")?.name === "AWS") {
    addTechnology(technologies, "AWS");
  }

  if (selectDetection(detections, "cloud")?.name === "Azure") {
    addTechnology(technologies, "Azure");
  }

  if (selectDetection(detections, "cloud")?.name === "GCP") {
    addTechnology(technologies, "GCP");
  }

  if (detections.some((detection) => detection.name === "Express" && detection.confidence >= 40)) {
    addTechnology(technologies, "Express");
  }

  if (detections.some((detection) => detection.name === "Next.js" && detection.confidence >= 40)) {
    addTechnology(technologies, "Next.js");
  }

  if (detections.some((detection) => detection.name === "WordPress" && detection.confidence >= 40)) {
    addTechnology(technologies, "WordPress");
  }

  if (hasSignal(signals, ["varnish", "x-varnish"])) {
    addTechnology(technologies, "Varnish");
  }

  if (detections.some((detection) => detection.name === "GFE-class edge proxy" && detection.confidence >= 35)) {
    addTechnology(technologies, "GFE-class edge");
  }

  return Array.from(technologies).sort((a, b) => a.localeCompare(b));
}

function analyzeInfrastructure(
  response: Response,
  technologies: string[],
  redirects: ScanResult["redirects"],
  finalUrl: string,
) {
  const signals = createPassiveSignals(response, finalUrl, redirects);
  const detections = collectPassiveInfrastructureCandidates(signals)
    .map(toDetection)
    .filter((detection) => detection.confidence >= 35)
    .sort((left, right) => {
      if (left.category !== right.category) {
        return left.category.localeCompare(right.category);
      }

      if (right.confidence !== left.confidence) {
        return right.confidence - left.confidence;
      }

      return left.name.localeCompare(right.name);
    });
  const cdn = selectDetection(detections, "cdn")?.name ?? "";
  const waf = selectDetection(detections, "waf")?.name ?? "";
  const hostingProvider = selectDetection(detections, "hosting")?.name ?? "";
  const cloudProvider = selectDetection(detections, "cloud")?.name ?? "";
  const asn = selectDetection(detections, "asn")?.name ?? "";
  const reverseProxy = selectDetection(detections, "reverseProxy")?.name ?? "";
  const framework = selectDetection(detections, "framework")?.name ?? "";
  const ipOwner = selectDetection(detections, "ipOwner")?.name ?? "";
  const confidence =
    detections.length > 0
      ? Math.round(
          detections.reduce((total, detection) => total + detection.confidence, 0) /
            detections.length,
        )
      : 0;
  const server = readResponseServerHeader(response)?.toLowerCase() ?? "";
  const exposedServerTokens =
    (server ? 1 : 0) +
    (signals.poweredBy ? 1 : 0) +
    (framework ? 1 : 0) +
    (reverseProxy && !cdn ? 1 : 0);
  const serverExposureScore = Math.min(
    100,
    exposedServerTokens * 18 +
      technologies.length * 8 +
      (signals.cookies ? 8 : 0) +
      (waf ? -10 : 0) +
      (cdn ? -8 : 0) +
      (confidence >= 75 ? -6 : 0),
  );

  return {
    cdn,
    waf,
    hostingProvider,
    cloudProvider,
    asn,
    reverseProxy,
    framework,
    ipOwner,
    confidence,
    detections,
    serverExposureScore: Math.max(0, serverExposureScore),
    redirectTrust: redirects.suspicious
      ? "suspicious"
      : cdn || waf || hostingProvider || cloudProvider
        ? "trusted"
        : "neutral",
  } satisfies ScanResult["infrastructure"];
}

function analyzeSslFindings(
  ssl: ScanResult["ssl"],
  protocol: string,
  findings: Finding[],
) {
  if (protocol !== "https:") {
    addFinding(
      findings,
      "medium",
      "The URL does not use HTTPS, so no TLS certificate is available.",
      "الرابط لا يستخدم HTTPS، لذلك لا توجد شهادة TLS.",
    );
    return;
  }

  if (!ssl.issuer) {
    addFinding(
      findings,
      "high",
      "No TLS certificate could be detected.",
      "تعذر اكتشاف شهادة TLS.",
    );
  }

  if (ssl.selfSigned) {
    addFinding(
      findings,
      "high",
      "The TLS certificate appears to be self-signed.",
      "تبدو شهادة TLS موقعة ذاتيًا.",
      "self-signed-ssl",
    );
  }

  if (ssl.daysLeft <= 0) {
    addFinding(
      findings,
      "high",
      "The TLS certificate is expired.",
      "انتهت صلاحية شهادة TLS.",
      "expired-ssl",
    );
  } else if (ssl.daysLeft <= 30) {
    addFinding(
      findings,
      "medium",
      "The TLS certificate expires within 30 days.",
      "ستنتهي صلاحية شهادة TLS خلال 30 يومًا.",
      "ssl-expiring-soon",
    );
  }

  if (ssl.weakProtocol) {
    addFinding(
      findings,
      "high",
      "The server negotiated a deprecated TLS protocol.",
      "تفاوض الخادم باستخدام بروتوكول TLS قديم.",
      "weak-tls",
    );
  }

  if (ssl.weakCipher) {
    addFinding(
      findings,
      "medium",
      "The negotiated TLS cipher appears weak or deprecated.",
      "تبدو خوارزمية التشفير المتفاوض عليها ضعيفة أو قديمة.",
      "weak-tls",
    );
  }
}

export async function scanUrl(input: string): Promise<ScanResult> {
  const startedAt = Date.now();
  const result = createEmptyResult();
  result.meta.scanTimestamp = new Date(startedAt).toISOString();

  try {
    assertNodeRuntime();

    const validateUrl = await loadValidator();
    const dnsStartedAt = Date.now();
    let validation: ValidationResult;

    try {
      validation = await validateWithDnsTimeout(input, validateUrl);
      updateStage(
        result,
        "dns",
        validation.valid ? "completed" : "failed",
        dnsStartedAt,
        validation.valid ? undefined : validation.blockedReason ?? "dns_failed",
      );
    } catch (error) {
      const reason = getErrorReason(error, "dns_failed");
      updateStage(
        result,
        "dns",
        reason.includes("timeout") ? "timeout" : "failed",
        dnsStartedAt,
        reason,
      );
      addFinding(
        result.findings,
        "informational",
        `DNS validation could not complete reliably (${reason}).`,
        `تعذر إكمال فحص DNS بثبات (${reason}).`,
      );
      result.meta.finalUrl = input;
      result.meta.responseTime = Date.now() - startedAt;
      return finalizeScore(result);
    }

    result.meta.finalUrl = validation.url;

    if (!validation.valid) {
      addFinding(
        result.findings,
        "high",
        "URL validation failed before scanning.",
        "فشل التحقق من الرابط قبل بدء الفحص.",
      );
      return finalizeScore(result);
    }

    const targetUrl = new URL(validation.url);
    result.intelligence = analyzeDomainIntelligence(targetUrl, result.findings);
    result.reputation = await checkDomainReputation(result.intelligence.domain);

    const tlsStartedAt = Date.now();

    try {
      result.ssl = await retryTransient(() =>
        withStageTimeout("tls", STAGE_TIMEOUTS.tls, (signal) =>
          inspectTlsCertificate(targetUrl, signal, STAGE_TIMEOUTS.tls),
        ),
      );
      updateStage(result, "tls", "completed", tlsStartedAt);
      analyzeSslFindings(result.ssl, targetUrl.protocol, result.findings);
    } catch (error) {
      const reason = getErrorReason(error, "tls_failed");
      updateStage(
        result,
        "tls",
        reason.includes("timeout") ? "timeout" : "partial",
        tlsStartedAt,
        reason,
      );
      addFinding(
        result.findings,
        "informational",
        `TLS inspection was incomplete (${reason}); security visibility is marked partial instead of assuming certificate failure.`,
        `لم يكتمل فحص TLS (${reason})؛ تم تسجيل مستوى الرؤية الأمنية كجزئي بدل افتراض فشل الشهادة.`,
      );
    }

    const redirectsStartedAt = Date.now();
    let redirectResult: Awaited<ReturnType<typeof followRedirects>>;

    try {
      redirectResult = await withStageTimeout(
        "redirects",
        STAGE_TIMEOUTS.redirects,
        (signal) =>
          followRedirects(validation.url, signal, result.findings, validateUrl),
      );
      updateStage(result, "redirects", "completed", redirectsStartedAt);
    } catch (error) {
      const reason = getErrorReason(error, "redirects_failed");
      updateStage(
        result,
        "redirects",
        reason.includes("timeout") ? "timeout" : "partial",
        redirectsStartedAt,
        reason,
      );

      if (reason.includes("headers_timeout")) {
        updateStage(result, "headers", "timeout", redirectsStartedAt, reason);
      }

      addFinding(
        result.findings,
        "informational",
        `HTTP/redirect inspection was incomplete (${reason}); the report contains partial externally observable intelligence.`,
        `لم يكتمل فحص HTTP/Redirects (${reason})؛ يحتوي التقرير على معلومات خارجية جزئية.`,
      );
      result.meta.responseTime = Date.now() - startedAt;
      return finalizeScore(result);
    }

    result.redirects = {
      chain: redirectResult.chain,
      suspicious: redirectResult.suspicious,
      analysis: redirectResult.analysis,
    };
    result.meta.finalUrl = redirectResult.finalUrl;

    if (!redirectResult.finalStep) {
      updateStage(
        result,
        "redirects",
        redirectResult.chain.length > 0 ? "partial" : "failed",
        redirectsStartedAt,
        "final_response_unavailable",
      );
      addFinding(
        result.findings,
        "medium",
        "The scan stopped before a final response was reached.",
        "توقف الفحص قبل الوصول إلى استجابة نهائية.",
      );
      return finalizeScore(result);
    }

    const finalResponse = redirectResult.finalStep.response;
    const headersStartedAt = Date.now();
    const headersUnableToVerify = isAntiBotOrChallengeResponse(finalResponse);
    const limitedObservableSurface = shouldTreatFinalResponseAsLimitedObservableSurface(
      finalResponse,
      headersUnableToVerify,
    );

    result.headers = analyzeSecurityHeaders(
      finalResponse,
      result.findings,
      limitedObservableSurface,
    );
    analyzeResponseSafety(finalResponse, result.findings);

    const headersStageStatus: ScanStageState["status"] = limitedObservableSurface
      ? "partial"
      : "completed";
    const headersStageReason = headersUnableToVerify
      ? "unable_to_verify_antibot"
      : limitedObservableSurface
        ? "limited_observable_surface"
        : undefined;

    updateStage(result, "headers", headersStageStatus, headersStartedAt, headersStageReason);

    const infrastructureStartedAt = Date.now();

    try {
      await withStageTimeout("infrastructure", STAGE_TIMEOUTS.infrastructure, async () => {
        result.technologies = detectTechnologies(
          finalResponse,
          redirectResult.finalUrl,
          result.redirects,
        );
        result.infrastructure = analyzeInfrastructure(
          finalResponse,
          result.technologies,
          result.redirects,
          redirectResult.finalUrl,
        );

        if (result.infrastructure.serverExposureScore >= 40) {
          addFinding(
            result.findings,
            "low",
            "Infrastructure and server metadata are externally visible.",
            "بيانات البنية التحتية والخادم ظاهرة خارجيًا.",
            "infrastructure-exposed",
          );
        }
      });
      updateStage(result, "infrastructure", "completed", infrastructureStartedAt);
    } catch (error) {
      const reason = getErrorReason(error, "infrastructure_failed");
      updateStage(
        result,
        "infrastructure",
        reason.includes("timeout") ? "timeout" : "partial",
        infrastructureStartedAt,
        reason,
      );
      addFinding(
        result.findings,
        "informational",
        `Infrastructure fingerprinting was incomplete (${reason}).`,
        `لم يكتمل فحص Infrastructure (${reason}).`,
      );
    }

    let serverHeaderRaw = readResponseServerHeader(finalResponse);
    if (!sanitizeServerHeader(serverHeaderRaw)) {
      const fromGet = await tryFetchServerHeaderSupplement(redirectResult.finalUrl, 6000);
      if (fromGet) {
        serverHeaderRaw = fromGet;
      }
    }

    result.meta = {
      ...result.meta,
      responseTime: Date.now() - startedAt,
      statusCode: finalResponse.status,
      finalUrl: redirectResult.finalUrl,
      server: sanitizeServerHeader(serverHeaderRaw),
      scanTimestamp: new Date(startedAt).toISOString(),
    };

    if (finalResponse.status >= 500) {
      addFinding(
        result.findings,
        "medium",
        "The server returned an error status code.",
        "أعاد الخادم رمز حالة يشير إلى خطأ.",
      );
    }

    return finalizeScore(result);
  } catch (error) {
    const reason = getErrorReason(error, "scan_failed");

    addFinding(
      result.findings,
      reason.includes("timeout") ? "informational" : "medium",
      `The scan completed with partial intelligence because a stage failed (${reason}).`,
      `اكتمل الفحص بمعلومات جزئية بسبب فشل مرحلة (${reason}).`,
    );

    result.meta.responseTime = Date.now() - startedAt;

    return finalizeScore(result);
  }
}
