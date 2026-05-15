import { calculateGrade } from "@/lib/scoring/calculateGrade";
import { calculateObservableCoverage } from "@/lib/scoring/calculateCoverage";
import {
  COVERAGE_CREDIT_IDS,
  MAX_ACHIEVABLE_SCORE,
  MAX_COVERAGE_CREDIT,
  MAX_SCORE,
  MIN_SCORE,
  NEGATIVE_PENALTIES,
  POSITIVE_SIGNALS,
  SCORE_CEILINGS,
} from "@/lib/scoring/constants";
import { EMPTY_REDIRECT_ANALYSIS } from "@/lib/redirectAnalysis";
import { calculateThreatLevel } from "@/lib/scoring/threatLevel";
import type {
  AttenuationProfile,
  ObservableCoverage,
  RedirectAnalysis,
  ScanResult,
  ScoreBreakdown,
  ScoreItem,
  ThreatLevel,
} from "@/lib/types";

function getRedirectAnalysis(result: ScanResult): RedirectAnalysis {
  return result.redirects.analysis ?? EMPTY_REDIRECT_ANALYSIS;
}

const HEADER_GAP_PENALTY_IDS = new Set([
  "missingHsts",
  "missingCsp",
  "missingXFrame",
  "missingXContentType",
]);

function sumHeaderGapPenaltyMagnitude(penalties: ScoreItem[]): number {
  let total = 0;
  for (const penalty of penalties) {
    if (HEADER_GAP_PENALTY_IDS.has(penalty.id)) {
      total += Math.abs(penalty.value);
    }
  }
  return total;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function isTls12OrNewer(protocol: string) {
  const match = protocol.match(/TLSv?(\d+)\.(\d+)/i);
  if (!match) return false;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return major > 1 || (major === 1 && minor >= 2);
}

function hasStrongCipher(cipher: string) {
  if (!cipher) return false;
  const normalized = cipher.toUpperCase();
  return (
    !normalized.includes("RC4") &&
    !normalized.includes("3DES") &&
    !normalized.includes("DES") &&
    !normalized.includes("MD5") &&
    !normalized.includes("NULL") &&
    !normalized.includes("EXPORT")
  );
}

function makeItem(id: string, label: string, labelAr: string, value: number, reason: string): ScoreItem {
  return { id, label, labelAr, value, reason };
}

function sumItems(items: ScoreItem[]) {
  return items.reduce((total, item) => total + item.value, 0);
}

/**
 * Scale coverage-related positives so their combined value never exceeds `maxBundle`
 * (also bounded by MAX_COVERAGE_CREDIT). Header-gap credits must not exceed the magnitude
 * of header-gap penalties they compensate when those penalties exist.
 */
function applyCoverageCreditCap(positives: ScoreItem[], maxBundle: number = MAX_COVERAGE_CREDIT) {
  const cap = Math.min(MAX_COVERAGE_CREDIT, Math.max(0, maxBundle));

  const entries = COVERAGE_CREDIT_IDS.map((id) => {
    const item = positives.find((p) => p.id === id);

    return item ? { item } : null;
  }).filter((e): e is { item: ScoreItem } => e !== null);

  if (entries.length === 0) {
    return;
  }

  const sum = entries.reduce((total, { item }) => total + item.value, 0);

  if (sum <= cap) {
    return;
  }

  let allocated = 0;

  for (let index = 0; index < entries.length - 1; index += 1) {
    const scaled = Math.max(0, Math.round((entries[index].item.value * cap) / sum));
    entries[index].item.value = scaled;
    allocated += scaled;
  }

  const last = entries[entries.length - 1].item;
  last.value = Math.max(0, cap - allocated);

  const suffixEn = " (coverage credit bundle capped.)";

  for (const { item } of entries) {
    if (!item.reason.includes("coverage credit bundle capped")) {
      item.reason = `${item.reason}${suffixEn}`;
    }
  }
}

/** Observable CDN/WAF/reverse-proxy signals (scanner output only — no domain allowlists). */
function hasObservableEdgeHardening(result: ScanResult): boolean {
  if (result.infrastructure.waf || result.infrastructure.cdn || result.infrastructure.reverseProxy) {
    return true;
  }

  return result.infrastructure.detections.some(
    (detection) => detection.category === "waf" || detection.category === "cdn" || detection.category === "reverseProxy",
  );
}

function resolveAttenuationProfile(
  coverage: ObservableCoverage,
  headerPenaltyFactor: number,
  strongEdge: boolean,
): AttenuationProfile {
  if (coverage.overall === "limited" || coverage.tls === "failed" || coverage.headers === "failed") {
    return "limited-observability";
  }
  if (headerPenaltyFactor <= 0.31) {
    return "enterprise-edge";
  }
  if (headerPenaltyFactor < 1) {
    return "edge-managed";
  }
  if (coverage.overall === "partial") {
    return strongEdge ? "edge-managed" : "limited-observability";
  }
  return "standard";
}

function countObservedBrowserHeaderSignals(result: ScanResult): number {
  const keys = [
    "strict-transport-security",
    "content-security-policy",
    "x-frame-options",
    "x-content-type-options",
  ] as const;

  return keys.reduce((n, key) => n + (result.headers[key] ? 1 : 0), 0);
}

function computePositives(result: ScanResult, coverage: ObservableCoverage) {
  const items: ScoreItem[] = [];
  const isHttps = result.meta.finalUrl.toLowerCase().startsWith("https://");

  if (isHttps) {
    items.push(
      makeItem("httpsEnabled", "HTTPS enabled", "HTTPS مفعّل", POSITIVE_SIGNALS.httpsEnabled, "Final URL uses HTTPS."),
    );
  }
  if (result.ssl.valid) {
    items.push(
      makeItem(
        "validCertificate",
        "Valid certificate",
        "شهادة صالحة",
        POSITIVE_SIGNALS.validCertificate,
        "TLS certificate is valid and trusted.",
      ),
    );
  }
  if (isTls12OrNewer(result.ssl.protocol)) {
    items.push(
      makeItem(
        "modernTlsVersion",
        "Modern TLS version",
        "إصدار TLS حديث",
        POSITIVE_SIGNALS.modernTlsVersion,
        `Negotiated TLS version is ${result.ssl.protocol || "modern"}.`,
      ),
    );
  }
  if (hasStrongCipher(result.ssl.cipher) && !result.ssl.weakCipher) {
    items.push(
      makeItem(
        "modernCipherSuite",
        "Modern cipher suite",
        "خوارزمية تشفير حديثة",
        POSITIVE_SIGNALS.modernCipherSuite,
        `Cipher ${result.ssl.cipher || "detected"} is not weak.`,
      ),
    );
  }

  if (result.headers["strict-transport-security"]) {
    items.push(
      makeItem("hstsEnabled", "HSTS present", "HSTS موجود", POSITIVE_SIGNALS.hstsEnabled, "Strict-Transport-Security header observed."),
    );
  }
  if (result.headers["content-security-policy"]) {
    items.push(
      makeItem("cspPresent", "CSP present", "CSP موجود", POSITIVE_SIGNALS.cspPresent, "Content-Security-Policy header observed."),
    );
  }
  if (result.headers["x-frame-options"]) {
    items.push(
      makeItem("xFrameOptions", "X-Frame-Options present", "X-Frame-Options موجود", POSITIVE_SIGNALS.xFrameOptions, "X-Frame-Options header observed."),
    );
  }
  if (result.headers["x-content-type-options"]) {
    items.push(
      makeItem("xContentTypeOptions", "X-Content-Type-Options present", "X-Content-Type-Options موجود", POSITIVE_SIGNALS.xContentTypeOptions, "X-Content-Type-Options header observed."),
    );
  }

  if (result.redirects.chain.length <= 1 && !result.redirects.suspicious) {
    items.push(
      makeItem("noRedirectChain", "No risky redirect chain", "لا توجد سلسلة Redirects خطرة", POSITIVE_SIGNALS.noRedirectChain, "Redirect chain is short and non-suspicious."),
    );
  }
  if (result.infrastructure.serverExposureScore < 40 && !result.redirects.suspicious) {
    items.push(
      makeItem("cleanInfrastructure", "Low infrastructure exposure", "تعرض Infrastructure منخفض", POSITIVE_SIGNALS.cleanInfrastructure, "Server exposure score is low."),
    );
  }

  if (coverage.headers !== "full" && coverage.tls === "full" && isHttps && result.ssl.valid) {
    items.push(
      makeItem(
        "observabilityAwareTransportCredit",
        "Strong TLS with bounded header observability",
        "TLS قوي مع رؤية محدودة للرؤوس",
        POSITIVE_SIGNALS.observabilityAwareTransportCredit,
        "TLS and certificate trust were fully assessed while security headers were not fully observable on this HTTP response; missing headers are not treated as proof controls are absent.",
      ),
    );
  }

  if (
    coverage.headers !== "full" &&
    coverage.tls === "full" &&
    hasObservableEdgeHardening(result) &&
    countObservedBrowserHeaderSignals(result) < 2
  ) {
    items.push(
      makeItem(
        "observableEdgeHardening",
        "Observable edge or WAF signals",
        "إشارات Edge أو WAF",
        POSITIVE_SIGNALS.observableEdgeHardening,
        "Security headers were not fully observable on this response; CDN/WAF or reverse-proxy signals suggest controls may be enforced elsewhere.",
      ),
    );
  }

  if (
    coverage.headers === "full" &&
    hasObservableEdgeHardening(result) &&
    countObservedBrowserHeaderSignals(result) <= 2
  ) {
    items.push(
      makeItem(
        "edgeManagedHeaderSurface",
        "Edge-managed response surface",
        "سطح استجابة يُدار عبر Edge",
        POSITIVE_SIGNALS.edgeManagedHeaderSurface,
        "CDN or WAF signals were observed while at most two of the tracked browser security headers were present on this response; enterprise edges often vary which headers appear on a single HTML surface.",
      ),
    );
  }

  return items;
}

function computePenalties(result: ScanResult, coverage: ObservableCoverage): {
  items: ScoreItem[];
  headerPenaltyFactor: number;
} {
  const items: ScoreItem[] = [];
  const applied = new Set<string>();
  const isHttps = result.meta.finalUrl.toLowerCase().startsWith("https://");

  const addPenalty = (id: keyof typeof NEGATIVE_PENALTIES, label: string, labelAr: string, reason: string) => {
    if (applied.has(id)) return;
    applied.add(id);
    items.push(makeItem(id, label, labelAr, NEGATIVE_PENALTIES[id], reason));
  };

  if (!isHttps) {
    addPenalty("noHttps", "HTTPS not enabled", "HTTPS غير مفعّل", "Final URL does not use HTTPS.");
  } else if (!result.ssl.valid) {
    addPenalty("invalidCertificate", "Invalid certificate", "شهادة غير صالحة", "TLS certificate is invalid or not trusted.");
  }

  if (result.ssl.selfSigned) {
    addPenalty("selfSignedCert", "Self-signed certificate", "شهادة موقعة ذاتيًا", "Certificate appears self-signed.");
  }
  if (result.ssl.weakProtocol) {
    addPenalty("weakTlsVersion", "Weak TLS version", "إصدار TLS ضعيف", "Deprecated TLS protocol detected.");
  }
  if (result.ssl.weakCipher) {
    addPenalty("weakCipherSuite", "Weak cipher suite", "خوارزمية تشفير ضعيفة", "Weak or deprecated cipher detected.");
  }

  const headerSignalsAreEvidence = coverage.headers === "full";

  let headerPenaltyFactor = 1;
  if (headerSignalsAreEvidence && hasObservableEdgeHardening(result)) {
    headerPenaltyFactor = 0.5;
  }
  if (
    headerSignalsAreEvidence &&
    coverage.infrastructure === "full" &&
    isHttps &&
    result.ssl.valid &&
    isTls12OrNewer(result.ssl.protocol) &&
    !result.ssl.weakCipher &&
    hasObservableEdgeHardening(result)
  ) {
    headerPenaltyFactor = Math.min(headerPenaltyFactor, 0.3);
  }

  const headerPenaltyAttenuated = headerPenaltyFactor < 1;

  const addHeaderGapPenalty = (
    id: keyof typeof NEGATIVE_PENALTIES,
    label: string,
    labelAr: string,
    reason: string,
  ) => {
    if (applied.has(id)) return;
    applied.add(id);
    const base = NEGATIVE_PENALTIES[id];
    const value = Math.round(base * headerPenaltyFactor);
    if (value === 0) return;
    items.push(makeItem(id, label, labelAr, value, reason));
  };

  const headerGapReason = (headerName: string, standardReason: string) => {
    if (!headerPenaltyAttenuated) {
      return standardReason;
    }

    if (headerPenaltyFactor <= 0.31) {
      return `${headerName} not observed on this response; header gap penalty reduced (enterprise edge: full infrastructure observability, modern TLS, and CDN/WAF signals lower certainty that absent headers imply missing controls).`;
    }

    return `${headerName} not observed on this response; penalty reduced because observable CDN/WAF suggests edge-managed policy.`;
  };

  if (headerSignalsAreEvidence) {
    if (!result.headers["strict-transport-security"]) {
      addHeaderGapPenalty(
        "missingHsts",
        "Missing HSTS",
        "غياب HSTS",
        headerGapReason("Strict-Transport-Security", "Strict-Transport-Security not observed on the scanned HTML response."),
      );
    }
    if (!result.headers["content-security-policy"]) {
      addHeaderGapPenalty(
        "missingCsp",
        "Missing CSP",
        "غياب CSP",
        headerGapReason("Content-Security-Policy", "Content-Security-Policy not observed on the scanned HTML response."),
      );
    }
    if (!result.headers["x-frame-options"]) {
      addHeaderGapPenalty(
        "missingXFrame",
        "Missing X-Frame-Options",
        "غياب X-Frame-Options",
        headerGapReason("X-Frame-Options", "X-Frame-Options not observed on the scanned HTML response."),
      );
    }
    if (!result.headers["x-content-type-options"]) {
      addHeaderGapPenalty(
        "missingXContentType",
        "Missing X-Content-Type-Options",
        "غياب X-Content-Type-Options",
        headerGapReason("X-Content-Type-Options", "X-Content-Type-Options not observed on the scanned HTML response."),
      );
    }
  }

  const redirectAnalysis = getRedirectAnalysis(result);
  if (redirectAnalysis.intent === "suspicious") {
    addPenalty(
      "suspiciousRedirect",
      "Suspicious redirects",
      "Redirects مشبوهة",
      "Redirect chain shows unrelated domains, unsafe targets, a loop, excessive depth, or three or more distinct registrable domains.",
    );
    if (redirectAnalysis.hops > 3) {
      addPenalty(
        "longRedirectChain",
        "Long redirect chain",
        "سلسلة Redirects طويلة",
        "Redirect chain depth exceeds standard expectation while intent is flagged as suspicious.",
      );
    }
  }
  if (result.intelligence.reputation === "suspicious" || result.intelligence.activePhishingIndicators) {
    addPenalty("suspiciousDomain", "Suspicious domain signals", "إشارات نطاق مشبوهة", "Observable domain intelligence flags suspicious behavior.");
  }
  if (result.reputation?.verdict === "malicious") {
    addPenalty("maliciousReputation", "Malicious reputation", "سمعة خبيثة", "External reputation vendor verdict is malicious.");
  }

  if (coverage.infrastructure === "full") {
    const exposure = result.infrastructure.serverExposureScore;
    if (exposure >= 65 && !applied.has("serverExposure")) {
      applied.add("serverExposure");
      items.push(
        makeItem(
          "serverExposure",
          "Server exposure",
          "تعرض الخادم",
          NEGATIVE_PENALTIES.serverExposure,
          "Server metadata indicates materially increased external exposure (fully observed).",
        ),
      );
    } else if (exposure >= 48 && !applied.has("serverExposure")) {
      applied.add("serverExposure");
      items.push(
        makeItem(
          "serverExposure",
          "Server exposure",
          "تعرض الخادم",
          -2,
          "Server metadata suggests moderate external exposure (fully observed).",
        ),
      );
    }
  }

  return { items, headerPenaltyFactor };
}

function computeCeilings(result: ScanResult) {
  const items: ScoreItem[] = [];
  const isHttps = result.meta.finalUrl.toLowerCase().startsWith("https://");

  if (!isHttps) {
    items.push(
      makeItem("noHttps", "No HTTPS ceiling", "سقف بدون HTTPS", SCORE_CEILINGS.noHttps, "Scores are capped when HTTPS is absent."),
    );
  }
  if (isHttps && !result.ssl.valid) {
    items.push(
      makeItem(
        "invalidCertificate",
        "Invalid certificate ceiling",
        "سقف شهادة غير صالحة",
        SCORE_CEILINGS.invalidCertificate,
        "Scores are capped when certificate validation fails.",
      ),
    );
  }
  if (result.reputation?.verdict === "malicious") {
    items.push(
      makeItem(
        "maliciousReputation",
        "Malicious reputation ceiling",
        "سقف السمعة الخبيثة",
        SCORE_CEILINGS.maliciousReputation,
        "Malicious reputation hard-caps the score.",
      ),
    );
  }

  if (result.findings.some((finding) => finding.severity === "critical")) {
    items.push(
      makeItem(
        "criticalFinding",
        "Critical finding ceiling",
        "سقف نتيجة حرجة",
        SCORE_CEILINGS.criticalFinding,
        "At least one critical finding exists.",
      ),
    );
  } else if (result.findings.some((finding) => finding.severity === "high")) {
    items.push(
      makeItem(
        "highFinding",
        "High finding ceiling",
        "سقف نتيجة عالية",
        SCORE_CEILINGS.highFinding,
        "At least one high-severity finding exists.",
      ),
    );
  }

  return items;
}

export function calculateDeterministicScore(result: ScanResult): {
  score: number;
  grade: ScanResult["grade"];
  threatLevel: ThreatLevel;
  scoreBreakdown: ScoreBreakdown;
  observableCoverage: ObservableCoverage;
} {
  const observableCoverage = calculateObservableCoverage(result);
  const positives = computePositives(result, observableCoverage);
  const { items: penalties, headerPenaltyFactor } = computePenalties(result, observableCoverage);
  const headerGapDebt = sumHeaderGapPenaltyMagnitude(penalties);
  const coverageCreditCap =
    headerGapDebt > 0 ? Math.min(MAX_COVERAGE_CREDIT, headerGapDebt) : MAX_COVERAGE_CREDIT;
  applyCoverageCreditCap(positives, coverageCreditCap);
  const ceilings = computeCeilings(result);

  const positivesTotal = sumItems(positives);
  const penaltiesTotal = sumItems(penalties);
  const adjustments = 0;

  const ceilingCap = ceilings.length > 0 ? Math.min(...ceilings.map((ceiling) => ceiling.value)) : MAX_SCORE;
  const uncappedRaw = positivesTotal + penaltiesTotal + adjustments;
  const rawScore = clamp(uncappedRaw, MIN_SCORE, MAX_ACHIEVABLE_SCORE);
  const strongEdge = hasObservableEdgeHardening(result);
  let finalScore = clamp(Math.min(rawScore, ceilingCap), MIN_SCORE, MAX_ACHIEVABLE_SCORE);
  if (observableCoverage.overall === "partial") {
    finalScore = Math.min(finalScore, strongEdge ? 88 : 82);
  }
  finalScore = clamp(finalScore, MIN_SCORE, MAX_ACHIEVABLE_SCORE);
  const grade = calculateGrade(finalScore);
  const threatLevel = calculateThreatLevel(result, finalScore);
  const attenuationProfile = resolveAttenuationProfile(
    observableCoverage,
    headerPenaltyFactor,
    strongEdge,
  );
  const redirectAnalysis = getRedirectAnalysis(result);

  return {
    score: finalScore,
    grade,
    threatLevel,
    observableCoverage,
    scoreBreakdown: {
      positives,
      penalties,
      ceilings,
      rawScore,
      finalScore,
      grade,
      attenuationProfile,
      redirectAnalysis,
    },
  };
}
