import QRCode from "qrcode";
import { calculateCategoryScores } from "@/lib/categoryScores";
import { getEffectiveSnippetsForFinding, getFixTimeEstimate } from "@/lib/fixSnippets";
import { getLocalizedRemediation, type RemediationCategory } from "@/lib/remediation";
import type { PdfExportMeta, ScanResultForPdf } from "@/lib/pdf/phaseB/mapScanResult";
import { mapScanResult } from "@/lib/pdf/phaseB/mapScanResult";
import { TRACKED_HEADERS, CATEGORY_LABEL_AR } from "@/lib/pdf/v5/constants";
import type { LocaleV5 } from "@/lib/pdf/v5/components";
import type { Finding, ScanResult, Severity } from "@/lib/types";
import { sanitizeText } from "@/lib/pdf/v5/text/sanitizeText";

/**
 * Normalize Arabic text before passing to PDF renderer.
 * Removes ONLY known corruption artifacts — does NOT filter by character range.
 */
export function normalizeArabicText(input: string | null | undefined): string {
  if (input === null || input === undefined) {
    return "";
  }
  input = sanitizeText(input);
  return input
    .replace(/\u00D8/g, "")
    .replace(/\u00D9/g, "")
    .replace(/\u00FE/g, "")
    .replace(/\u00D7/g, "")
    .replace(/\u00C3/g, "")
    .replace(/\u0327/g, "")
    .replace(/\uFFFD/g, "")
    .replace(/\u200E/g, "")
    .replace(/\u200F/g, "")
    .replace(/[\u202A-\u202E]/g, "")
    .replace(/\u0062\u0331/g, "")
    .normalize("NFC")
    .replace(/\u00A0/g, " ")
    .replace(/\u064a\u0327\u0644\u0644/g, "\u064a\u0642\u0644\u0644")
    .replace(/\u064a\u0644\u0644(?!\u0650)/g, "\u064a\u0642\u0644\u0644")
    .replace(/work[\uFFFD]frame/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function localizedText(text: string, locale: LocaleV5): string {
  if (locale === "ar") {
    return normalizeArabicText(text);
  }
  return text.trim();
}

export function cleanText(s: string): string {
  s = sanitizeText(s);
  return s
    .replace(/This is (low|medium|high|critical) severity[^.]*\./gi, "")
    .replace(/For scan reporting[^.]*\./gi, "")
    .replace(/As an AI[^.]*\./gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * buildUnifiedVerdict
 *
 * Deterministic reconciliation of reputation + verdict from
 * scanner signals. Replaces the vendor-supplied (and sometimes
 * contradictory) verdict/reputation strings with a single
 * consistent classification driven by the numeric evidence.
 *
 * Rules (evaluated in order):
 *   total === 0           → neutral   (no data — cannot judge)
 *   malicious > 0         → malicious (any positive detection)
 *   suspicious >= 3       → suspicious (multiple weak signals)
 *   otherwise             → trusted   (clean evidence)
 *
 * Returns the canonical lowercase string keys used downstream:
 *   - reputation: "neutral" | "malicious" | "suspicious" | "trusted"
 *   - verdict:    "neutral" | "malicious" | "suspicious" | "clean"
 *
 * Note: verdict uses "clean" (not "trusted") in the positive case
 * because ThreatIntelPage.tsx checks `intel.verdict === "clean"`
 * explicitly. We preserve that contract.
 */
function buildUnifiedVerdict(
  malicious: number,
  suspicious: number,
  total: number
): { reputation: string; verdict: string } {
  if (total === 0) {
    return { reputation: "neutral", verdict: "neutral" };
  }
  if (malicious > 0) {
    return { reputation: "malicious", verdict: "malicious" };
  }
  if (suspicious >= 3) {
    return { reputation: "suspicious", verdict: "suspicious" };
  }
  return { reputation: "trusted", verdict: "clean" };
}

function wrapLrmDigitsLocal(s: string): string {
  return s.replace(/\d+/g, (n) => `\u200e${n}\u200e`);
}

/**
 * Strip hedging language from generated text.
 * Applied to ALL human-readable string fields before they enter the report.
 * Order with Arabic: always `stripHedges(localizedText(raw, locale), locale)` (normalize first).
 */
function stripHedges(text: string, locale: LocaleV5): string {
  if (!text) {
    return text;
  }
  const base = cleanText(text);

  if (locale === "en") {
    return base
      .replace(/\bmay appear\b/gi, "appears")
      .replace(/\bmay reduce\b/gi, "reduces")
      .replace(/\bmay allow\b/gi, "allows")
      .replace(/\bmay expose\b/gi, "exposes")
      .replace(/\bcould allow\b/gi, "allows")
      .replace(/\bcould expose\b/gi, "exposes")
      .replace(/\bmight expose\b/gi, "exposes")
      .replace(/\bpotentially\b/gi, "")
      .replace(/\bappear less\b/gi, "reduces")
      .replace(/\bseems to\b/gi, "")
      .replace(/\bit is recommended\b/gi, "")
      .replace(/\bconsider adding\b/gi, "add")
      .replace(/\bconsider\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  if (locale === "ar") {
    return base
      .replace(
        /قد يبدو الموقع أقل اهتمامًا بالخصوصية/g,
        "يفقد الموقع جزءًا من إشارات احترام الخصوصية",
      )
      .replace(/قد يبدو/g, "يبدو")
      .replace(/قد يؤدي/g, "يؤدي")
      .replace(/قد يحاول/g, "يتيح")
      .replace(/قد تتسرب/g, "تتسرب")
      .replace(/قد يشارك/g, "يُشارك")
      .replace(/قد تتحول/g, "تتحول")
      .replace(/قد يجعل/g, "يجعل")
      .replace(/قد يقلل/g, "يقلل")
      .replace(/يمكن أن/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  return base.trim();
}

/** Normalize encoding (AR) then strip hedges — strict order for narrative fields. */
function narr(s: string, locale: LocaleV5): string {
  return stripHedges(localizedText(s, locale), locale);
}

function str(v: string | undefined | null): string {
  if (v === undefined || v === null) {
    return "-";
  }
  const t = String(v).trim();
  return t === "" ? "-" : t;
}

function domainFromResult(result: ScanResult): string {
  const d = str(result.intelligence.domain);
  if (d !== "-") {
    return d;
  }
  try {
    return new URL(result.meta.finalUrl).hostname;
  } catch {
    return "-";
  }
}

function headerMissingCount(result: ScanResult): number {
  return TRACKED_HEADERS.filter((h) => result.headers[h] !== true).length;
}

function presentHeaderSlugs(result: ScanResult): string[] {
  return TRACKED_HEADERS.filter((h) => result.headers[h] === true);
}

function missingHeaderSlugs(result: ScanResult): string[] {
  return TRACKED_HEADERS.filter((h) => result.headers[h] !== true);
}

function sevRank(s: Severity): number {
  if (s === "critical") {
    return 4;
  }
  if (s === "high") {
    return 3;
  }
  if (s === "medium") {
    return 2;
  }
  if (s === "informational") {
    return 0;
  }
  return 1;
}

function normalizeSeverity(s: Severity): "critical" | "high" | "medium" | "low" {
  if (s === "critical" || s === "high" || s === "medium") {
    return s;
  }
  return "low";
}

function parseEffortMinutes(raw: string | undefined): number {
  if (raw === undefined) {
    return 15;
  }
  const digits = raw.replace(/[^\d]/g, "");
  const n = parseInt(digits, 10);
  return Number.isFinite(n) && n > 0 ? n : 15;
}

function standardsForCategory(cat: RemediationCategory): string[] {
  if (cat === "header-protection") {
    return ["OWASP A05:2021", "CIS Control 4"];
  }
  if (cat === "https-security" || cat === "tls") {
    return ["OWASP A02:2021", "CIS Control 3"];
  }
  if (cat === "infrastructure") {
    return ["OWASP A05:2021", "CIS Control 4"];
  }
  if (cat === "reputation") {
    return ["OWASP A07:2021"];
  }
  return ["OWASP ASVS V14"];
}

function scoreGainForRisk(rr: "high" | "medium" | "low"): number {
  if (rr === "high") {
    return 12;
  }
  if (rr === "medium") {
    return 6;
  }
  return 3;
}

function buildOwnerImpact(
  loc: NonNullable<ReturnType<typeof getLocalizedRemediation>>,
  title: string,
  locale: LocaleV5,
): string {
  const src = narr(loc.explanation.simple, locale);
  if (src.length > 8 && !/^this is/i.test(src)) {
    const capped = src.slice(0, 154);
    const raw = locale === "ar" ? capped : ensureOwnerPrefix(capped);
    return finalizeOwnerImpact(raw, locale);
  }
  const raw =
    locale === "ar"
      ? `غياب هذا الإعداد يضعف حماية المتصفح للزائر أمام ${title.slice(0, 56)}.`
      : `Without this control, visitors lose browser-side protection against ${title.slice(0, 56).toLowerCase()}.`;
  return finalizeOwnerImpact(raw, locale);
}

function ensureOwnerPrefix(s: string): string {
  const t = s.trim();
  if (/^(without|missing|absent|no )/i.test(t)) {
    return t.slice(0, 168);
  }
  return `Without this, ${t.charAt(0).toLowerCase()}${t.slice(1)}`.slice(0, 168);
}

function finalizeOwnerImpact(text: string, locale: LocaleV5): string {
  const o = narr(text, locale).trim();
  if (o === "" || o === "-" || o === "\u2014") {
    return locale === "ar"
      ? "\u0647\u0630\u0627 \u0627\u0644\u0646\u0637\u0627\u0642 \u064a\u0638\u0647\u0631 \u0625\u0634\u0627\u0631\u0627\u062a \u062a\u062e\u0641\u0636 \u062f\u0631\u062c\u0627\u062a \u0627\u0644\u062b\u0642\u0629 \u0627\u0644\u062e\u0627\u0631\u062c\u064a\u0629 \u0648\u062a\u0624\u062b\u0631 \u0639\u0644\u0649 \u0645\u0639\u0627\u0645\u0644\u0629 \u0627\u0644\u0645\u062a\u0635\u0641\u062d\u0627\u062a \u0648\u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0623\u0645\u0627\u0646 \u0644\u0644\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0648\u0627\u0631\u062f\u0629."
      : "This domain shows signals that reduce external trust scores and affect how browsers and security tools treat incoming requests.";
  }
  return o;
}

function buildBusinessLayer(loc: NonNullable<ReturnType<typeof getLocalizedRemediation>>, locale: LocaleV5): string {
  const b = narr(loc.businessImpact, locale);
  if (b.length > 10) {
    return b.slice(0, 182);
  }
  return locale === "ar"
    ? "يضعف ثقة المستخدم ويزيد تعرض الجلسات للتلاعب عبر سلسلة هجمات جانبية."
    : "Weakens user trust. Chained client-side issues let attackers abuse sessions.";
}

function buildTechnicalLayer(loc: NonNullable<ReturnType<typeof getLocalizedRemediation>>, locale: LocaleV5): string {
  const t = narr(loc.explanation.technical, locale);
  const rec = narr(loc.recommendation, locale).slice(0, 70);
  const core = t.length > 12 ? t : rec;
  const tail =
    locale === "ar"
      ? " أضف الإعداد في رؤوس الاستجابة على nginx أو Apache أو طبقة CDN."
      : " Add the control to response headers on nginx, Apache, or your CDN edge.";
  return `${core.slice(0, 140)}${tail}`.slice(0, 224);
}

const HEADER_DISPLAY_EN: Record<string, { name: string; capability: string }> = {
  "missing-csp": {
    name: "Content-Security-Policy",
    capability: "load remote scripts and data from hostile origins without browser-enforced policy boundaries",
  },
  "missing-hsts": {
    name: "Strict-Transport-Security",
    capability: "strip HTTPS upgrades on repeat visits so browsers accept attacker-in-the-middle downgrade paths",
  },
  "missing-x-frame-options": {
    name: "X-Frame-Options",
    capability: "embed this application inside attacker-controlled frames to hijack clicks and credentials",
  },
  "missing-x-content-type-options": {
    name: "X-Content-Type-Options",
    capability: "sniff responses as executable content and exploit MIME confusion in the browser",
  },
  "missing-referrer-policy": {
    name: "Referrer-Policy",
    capability: "leak full URL and token-bearing referrer values to every third-party origin embedded on the page",
  },
  "missing-permissions-policy": {
    name: "Permissions-Policy",
    capability: "access sensitive device APIs from nested frames without a browser-enforced revocation surface",
  },
};

const HEADER_DISPLAY_AR: Record<string, { name: string; capability: string }> = {
  "missing-csp": {
    name: "Content-Security-Policy",
    capability: "تحميل سكربتات وبيانات من أصول عدائية دون حدود سياسة يفرضها المتصفح",
  },
  "missing-hsts": {
    name: "Strict-Transport-Security",
    capability:
      "\u0625\u0632\u0627\u0644\u0629 \u0625\u062c\u0628\u0627\u0631 HTTPS \u0639\u0644\u0649 \u0627\u0644\u0632\u064a\u0627\u0631\u0627\u062a \u0627\u0644\u0644\u0627\u062d\u0642\u0629 \u0648\u064a\u0633\u0645\u062d \u0628\u0645\u0633\u0627\u0631\u0627\u062a \u062e\u0641\u0636 \u0625\u0644\u0649 HTTP",
  },
  "missing-x-frame-options": {
    name: "X-Frame-Options",
    capability: "تضمين هذا التطبيق داخل إطارات يتحكم بها مهاجم لسرقة النقرات والجلسات",
  },
  "missing-x-content-type-options": {
    name: "X-Content-Type-Options",
    capability: "استنتاج نوع الاستجابة كمحتوى قابل للتنفيذ واستغلال لبس MIME في المتصفح",
  },
  "missing-referrer-policy": {
    name: "Referrer-Policy",
    capability: "تسريب عنوان URL كامل وقيم المرسل التي تحمل رموزاً إلى كل أصل طرف ثالث مضمن في الصفحة",
  },
  "missing-permissions-policy": {
    name: "Permissions-Policy",
    capability: "الوصول إلى واجهات أجهزة حساسة من إطارات متداخلة دون سطح إلغاء يفرضه المتصفح",
  },
};

function buildIfIgnored(
  findingId: string,
  f: Finding,
  result: ScanResult,
  loc: NonNullable<ReturnType<typeof getLocalizedRemediation>>,
  locale: LocaleV5,
): string {
  const dom = domainFromResult(result);
  const r = narr(loc.severityReason, locale);
  if (r.length > 40 && !/^the weakness stays/i.test(r)) {
    return r.slice(0, 182);
  }

  const id = findingId;
  const hdrEn = HEADER_DISPLAY_EN[id];
  const hdrAr = HEADER_DISPLAY_AR[id];
  if (hdrEn !== undefined && hdrAr !== undefined) {
    return locale === "ar"
      ? `رأس ${hdrAr.name} لا يُرسل. أي سكربت يُحمّل على هذه الصفحة يمكنه ${hdrAr.capability}.`
      : `The ${hdrEn.name} header is never sent. Any script loaded on this page can ${hdrEn.capability}.`;
  }

  if (id === "infrastructure-exposed") {
    const stack = str(result.meta.server);
    return locale === "ar"
      ? `\u0625\u0635\u062f\u0627\u0631 \u0627\u0644\u062e\u0627\u062f\u0645 \u064a\u0628\u0642\u0649 \u0638\u0627\u0647\u0631\u0627\u064b. \u0627\u0644\u0645\u0647\u0627\u062c\u0645\u0648\u0646 \u064a\u0637\u0627\u0628\u0642\u0648\u0646 ${stack} \u0636\u062f \u0642\u0648\u0627\u0639\u062f \u0628\u064a\u0627\u0646\u0627\u062a CVE \u0627\u0644\u0639\u0627\u0645\u0629.`
      : `Server version stays visible. Attackers match ${stack} against known CVE databases.`;
  }

  if (
    id === "weak-tls" ||
    id === "expired-ssl" ||
    id === "self-signed-ssl" ||
    id === "ssl-expiring-soon"
  ) {
    return locale === "ar"
      ? "\u0627\u0644\u062c\u0644\u0633\u0627\u062a \u062a\u0638\u0644 \u062a\u0641\u0627\u0648\u0636\u0627\u062a \u0636\u0639\u0641 \u0627\u0644\u0646\u0642\u0644 \u0645\u0627 \u062f\u0627\u0645\u062a \u0627\u0644\u0645\u062a\u0635\u0641\u062d \u064a\u0644\u062a\u0632\u0645 \u0628\u0631\u0648\u062a\u0648\u0643\u0648\u0644\u0627\u062a \u0636\u0639\u064a\u0641\u0629 \u0645\u0639 \u0647\u0630\u0627 \u0627\u0644\u0645\u0636\u064a\u0641."
      : "Sessions keep accepting weak transport negotiation while browsers complete handshakes with this host using substandard protocol or certificate material.";
  }

  const msgEn = str(f.message?.en).toLowerCase();
  const msgAr = str(f.message?.ar);
  const typoHit =
    result.intelligence.typosquatting &&
    (msgEn.includes("typosquatting") ||
      msgEn.includes("typo") ||
      msgAr.includes("\u0627\u0646\u062a\u062d\u0627\u0644") ||
      id === "domain-too-new");
  if (typoHit) {
    return locale === "ar"
      ? `\u0627\u0644\u0625\u0634\u0627\u0631\u0629 \u062a\u0628\u0642\u0649 \u0645\u0631\u0641\u0648\u0639\u0629 \u0641\u064a \u0645\u062d\u0631\u0643\u0627\u062a \u0627\u0644\u0633\u0645\u0639\u0629 \u0627\u0644\u062e\u0627\u0631\u062c\u064a\u0629 \u0648\u062a\u062e\u0641\u0636 \u062f\u0631\u062c\u0629 \u062b\u0642\u0629 \u0627\u0644\u0646\u0637\u0627\u0642 \u0644\u0640 ${dom}.`
      : `The typosquatting signal remains flagged in external reputation engines, reducing domain trust score for ${dom}.`;
  }

  const titleFragment = narr(loc.title, locale).replace(/^Missing\s+/i, "").slice(0, 40);
  return locale === "ar"
    ? `\u0627\u0644\u063a\u064a\u0627\u0628 \u0627\u0644\u0645\u0633\u062a\u0645\u0631 \u0644\u0640 "${titleFragment}" \u064a\u0628\u0642\u064a \u0633\u0637\u062d \u0627\u0644\u0647\u062c\u0648\u0645 \u0645\u0643\u0634\u0648\u0641\u0627\u064b \u0641\u064a \u0643\u0644 \u0637\u0644\u0628 \u0625\u0644\u0649 ${dom}.`.slice(0, 182)
    : `The absent ${titleFragment} leaves the exposed surface open on every request to ${dom}.`.slice(0, 182);
}

function buildAfterFixed(loc: NonNullable<ReturnType<typeof getLocalizedRemediation>>, gain: number, locale: LocaleV5): string {
  const rr = loc.riskReduction;
  const boostEn = `Restores browser hardening and supports up to +${gain} points on the overall score.`;
  const boostAr = `\u064a\u0633\u062a\u0639\u064a\u062f \u0637\u0628\u0642\u0629 \u062d\u0645\u0627\u064a\u0629 \u0627\u0644\u0645\u062a\u0635\u0641\u062d \u0648\u064a\u062f\u0639\u0645 \u062d\u062a\u0649 +${gain} \u0646\u0642\u0627\u0637\u064b\u0627 \u0641\u064a \u0627\u0644\u0646\u062a\u064a\u062c\u0629 \u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a\u0629.`;
  if (rr === "high") {
    return locale === "ar"
      ? `\u064a\u0642\u0644\u0644 \u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u0647\u062c\u0648\u0645 \u0628\u0634\u0643\u0644 \u0645\u0644\u062d\u0648\u0638. ${boostAr}`
      : `Materially shrinks attack surface. ${boostEn}`;
  }
  if (rr === "medium") {
    return locale === "ar"
      ? `\u064a\u0642\u0644\u0644 \u0627\u0644\u0645\u062e\u0627\u0637\u0631 \u0627\u0644\u0639\u0645\u0644\u064a\u0629. ${boostAr}`
      : `Cuts practical risk. ${boostEn}`;
  }
  return locale === "ar"
    ? `\u062a\u062d\u0633\u064a\u0646 \u0645\u0633\u062a\u0645\u0631. ${boostAr}`
    : `Incremental hardening. ${boostEn}`;
}

function buildWhyNow(findingId: string, domain: string, severity: string, locale: LocaleV5): string {
  void domain;
  const isHigh = severity === "critical" || severity === "high";

  const map: Record<string, { en: { high: string; low: string }; ar: { high: string; low: string } }> = {
    "missing-csp": {
      en: {
        high: `Every page load without CSP allows injected scripts to run without browser restriction.`,
        low: `Without CSP, the browser has no policy to block unintended resource loading.`,
      },
      ar: {
        high: `\u0643\u0644 \u062a\u062d\u0645\u064a\u0644 \u0628\u062f\u0648\u0646 CSP \u064a\u062a\u064a\u062d \u062a\u0634\u063a\u064a\u0644 \u0633\u0643\u0631\u0628\u062a\u0627\u062a \u0645\u062d\u0642\u0648\u0646\u0629 \u062f\u0648\u0646 \u0642\u064a\u0648\u062f.`,
        low: `\u0628\u062f\u0648\u0646 CSP\u060c \u0644\u0627 \u064a\u0645\u0644\u0643 \u0627\u0644\u0645\u062a\u0635\u0641\u062d \u0633\u064a\u0627\u0633\u0629 \u0644\u062a\u0642\u064a\u064a\u062f \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0648\u0627\u0631\u062f \u063a\u064a\u0631 \u0627\u0644\u0645\u0642\u0635\u0648\u062f\u0629.`,
      },
    },
    "missing-hsts": {
      en: {
        high: `Without HSTS, users on public networks can be silently downgraded to HTTP connections.`,
        low: `Without HSTS, the browser cannot enforce HTTPS on repeat visits without a server redirect.`,
      },
      ar: {
        high: `\u0628\u062f\u0648\u0646 HSTS\u060c \u064a\u0645\u0643\u0646 \u062a\u062e\u0641\u064a\u0636 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646 \u0628\u0635\u0645\u062a \u0625\u0644\u0649 HTTP.`,
        low: `\u0628\u062f\u0648\u0646 HSTS\u060c \u0644\u0627 \u064a\u0633\u062a\u0637\u064a\u0639 \u0627\u0644\u0645\u062a\u0635\u0641\u062d \u0641\u0631\u0636 HTTPS \u0641\u064a \u0627\u0644\u0632\u064a\u0627\u0631\u0627\u062a \u0627\u0644\u0645\u062a\u0643\u0631\u0631\u0629.`,
      },
    },
    "missing-permissions-policy": {
      en: {
        high: `Until this header is set, any script on the page can request camera, microphone, or location access.`,
        low: `Without this header, browser feature restrictions are not enforced at the origin level.`,
      },
      ar: {
        high: `\u062d\u062a\u0649 \u064a\u064f\u0639\u064a\u0651\u0646 \u0647\u0630\u0627 \u0627\u0644\u0631\u0623\u0633\u060c \u064a\u0645\u0643\u0646 \u0644\u0623\u064a \u0633\u0643\u0631\u0628\u062a \u0637\u0644\u0628 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0643\u0627\u0645\u064a\u0631\u0627.`,
        low: `\u0628\u062f\u0648\u0646 \u0647\u0630\u0627 \u0627\u0644\u0631\u0623\u0633\u060c \u0644\u0627 \u062a\u064f\u0641\u0631\u0636 \u0642\u064a\u0648\u062f \u0645\u064a\u0632\u0627\u062a \u0627\u0644\u0645\u062a\u0635\u0641\u062d \u0639\u0644\u0649 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0646\u0637\u0627\u0642.`,
      },
    },
    "missing-x-frame-options": {
      en: {
        high: `Without this header, the site can be embedded in a hidden frame and used in clickjacking attacks.`,
        low: `Without this header, third-party pages can embed this site in a frame without restriction.`,
      },
      ar: {
        high: `\u0628\u062f\u0648\u0646 \u0647\u0630\u0627 \u0627\u0644\u0631\u0623\u0633\u060c \u064a\u0645\u0643\u0646 \u062a\u0636\u0645\u064a\u0646 \u0627\u0644\u0645\u0648\u0642\u0639 \u0641\u064a \u0625\u0637\u0627\u0631 \u062e\u0641\u064a \u0644\u0647\u062c\u0645\u0627\u062a Clickjacking.`,
        low: `\u0628\u062f\u0648\u0646 \u0647\u0630\u0627 \u0627\u0644\u0631\u0623\u0633\u060c \u064a\u0645\u0643\u0646 \u0644\u0635\u0641\u062d\u0627\u062a \u062e\u0627\u0631\u062c\u064a\u0629 \u062a\u0636\u0645\u064a\u0646 \u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0642\u0639 \u062f\u0648\u0646 \u0642\u064a\u0648\u062f.`,
      },
    },
    "infrastructure-exposed": {
      en: {
        high: `Server version data is publicly readable — attackers can match it to known CVEs immediately.`,
        low: `Server identity headers are visible, which reduces reconnaissance effort for targeted attacks.`,
      },
      ar: {
        high: `\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062e\u0627\u062f\u0645 \u0645\u0642\u0631\u0648\u0621\u0629 \u0639\u0644\u0646\u0627\u064b \u2014 \u064a\u0645\u0643\u0646 \u0631\u0628\u0637\u0647\u0627 \u0628\u062b\u063a\u0631\u0627\u062a \u0645\u0639\u0631\u0648\u0641\u0629 \u0641\u0648\u0631\u0627\u064b.`,
        low: `\u0631\u0624\u0648\u0633 \u0647\u0648\u064a\u0629 \u0627\u0644\u062e\u0627\u062f\u0645 \u0638\u0627\u0647\u0631\u0629\u060c \u0645\u0645\u0627 \u064a\u0642\u0644\u0644 \u062c\u0647\u062f \u0627\u0644\u0627\u0633\u062a\u0637\u0644\u0627\u0639 \u0641\u064a \u0627\u0644\u0647\u062c\u0645\u0627\u062a \u0627\u0644\u0645\u0648\u062c\u0647\u0629.`,
      },
    },
  };

  const entry = map[findingId];
  if (entry !== undefined) {
    const tone = isHigh ? "high" : "low";
    return locale === "ar" ? entry.ar[tone] : entry.en[tone];
  }

  const titleFragment = findingId.replace(/-/g, " ").slice(0, 35);
  if (isHigh) {
    return locale === "ar"
      ? `\u0647\u0630\u0647 \u0627\u0644\u062b\u063a\u0631\u0629 \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0627\u0633\u062a\u063a\u0644\u0627\u0644 \u062d\u062a\u0649 \u062a\u064f\u0639\u0627\u0644\u062c.`
      : `The absent ${titleFragment} control is exploitable until addressed.`;
  }
  return locale === "ar"
    ? `\u063a\u064a\u0627\u0628 ${titleFragment} \u064a\u0636\u0639\u0641 \u0645\u0642\u0627\u0648\u0645\u0629 \u0627\u0644\u0645\u062a\u0635\u0641\u062d \u0644\u0644\u0645\u062d\u062a\u0648\u0649 \u063a\u064a\u0631 \u0627\u0644\u0645\u0648\u062b\u0648\u0642.`
    : `The missing ${titleFragment} reduces browser resistance to untrusted content.`;
}

function buildWhereExact(platform: string, locale: LocaleV5): string {
  const p = platform.toLowerCase();
  const isNginx = p.includes("nginx");
  const isApache = p.includes("apache");
  const isCdn = p.includes("cdn");

  if (locale === "ar") {
    if (isNginx) {
      return "nginx.conf \u2190 \u0643\u062a\u0644\u0629 server { }";
    }
    if (isApache) {
      return ".htaccess \u0623\u0648 httpd.conf \u2190 \u0642\u0633\u0645 <VirtualHost>";
    }
    if (isCdn) {
      return "\u0642\u0648\u0627\u0639\u062f \u0627\u0644\u0627\u0633\u062a\u062c\u0627\u0628\u0629 \u0641\u064a \u0644\u0648\u062d\u0629 \u062a\u062d\u0643\u0645 \u0627\u0644\u0634\u0628\u0643\u0629";
    }
    return "\u0645\u0644\u0641 \u0625\u0639\u062f\u0627\u062f \u0627\u0644\u062e\u0627\u062f\u0645 \u2190 \u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u0631\u0624\u0648\u0633";
  }
  if (isNginx) {
    return "nginx.conf → server { } block";
  }
  if (isApache) {
    return ".htaccess or httpd.conf → <VirtualHost> section";
  }
  if (isCdn) {
    return "CDN dashboard → Response headers rules";
  }
  return "Web server config → Response headers section";
}

function buildVerifyHow(findingId: string, locale: LocaleV5, domain: string): string {
  void locale;
  const d = domain !== "-" ? domain : "example.com";
  const headerMap: Record<string, string> = {
    "missing-csp": "Content-Security-Policy",
    "missing-hsts": "Strict-Transport-Security",
    "missing-permissions-policy": "Permissions-Policy",
    "missing-x-frame-options": "X-Frame-Options",
    "missing-x-content-type-options": "X-Content-Type-Options",
    "missing-referrer-policy": "Referrer-Policy",
  };
  const header = headerMap[findingId];
  if (header !== undefined) {
    return `curl -I https://${d} | grep -i "${header}"`;
  }
  if (findingId === "infrastructure-exposed") {
    return `curl -I https://${d} | grep -i "Server:"`;
  }
  return locale === "ar"
    ? "\u0623\u0639\u062f \u0627\u0644\u0641\u062d\u0635 \u0628\u0639\u062f \u0627\u0644\u062a\u0637\u0628\u064a\u0642 \u0648\u062a\u062d\u0642\u0642 \u0645\u0646 \u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0646\u062a\u064a\u062c\u0629"
    : "Re-run the scan after applying the fix and verify the score change.";
}

function buildRollbackRisk(findingId: string): "none" | "low" | "medium" {
  const mediumRisk = ["missing-csp", "missing-hsts"];
  const noRisk = ["infrastructure-exposed", "missing-permissions-policy"];
  if (mediumRisk.includes(findingId)) {
    return "medium";
  }
  if (noRisk.includes(findingId)) {
    return "none";
  }
  return "low";
}

export function buildExecutiveSentence(
  domain: string,
  findings: Array<{ severity: "critical" | "high" | "medium" | "low" }>,
  categoryScores: {
    tls: number;
    headers: number;
    infrastructure: number;
    domainTrust: number;
    redirectSafety: number;
  },
  locale: LocaleV5,
): string {
  void categoryScores;
  const criticalHigh = findings.filter((f) => f.severity === "critical" || f.severity === "high");
  const medium = findings.filter((f) => f.severity === "medium");
  const low = findings.filter((f) => f.severity === "low");
  const total = findings.length;

  if (total === 0) {
    return locale === "ar"
      ? `\u064a\u062d\u0627\u0641\u0638 ${domain} \u0639\u0644\u0649 \u0648\u0636\u0639 \u0623\u0645\u0646\u064a \u0642\u0648\u064a \u0639\u0628\u0631 \u0627\u0644\u0628\u0646\u0648\u062f \u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629. \u0644\u0645 \u0646\u064f\u0631\u0635\u062f \u062b\u063a\u0631\u0627\u062a \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062a\u0646\u0641\u064a\u0630.`
      : `${domain} shows a strong posture across monitored dimensions; no actionable exposures in this scan.`;
  }

  if (criticalHigh.length > 0) {
    const count = criticalHigh.length;
    const arCount = count > 1 ? ` (${count})` : "";
    return locale === "ar"
      ? `${domain} \u064a\u0639\u0631\u0636 \u062b\u063a\u0631\u0629 \u062e\u0637\u064a\u0631\u0629${arCount} \u062a\u064f\u0636\u0639\u0641 \u0639\u0632\u0644 \u0627\u0644\u0645\u062a\u0635\u0641\u062d \u0648\u062a\u0633\u0647\u0651\u0644 \u0627\u0644\u0627\u0633\u062a\u063a\u0644\u0627\u0644.`
      : `${domain} has ${count} critical/high exposure${count > 1 ? "s" : ""} that weaken browser isolation and ease exploitation.`;
  }

  if (medium.length > 0) {
    return locale === "ar"
      ? `\u064a\u062d\u0627\u0641\u0638 ${domain} \u0639\u0644\u0649 \u0623\u0645\u0646 \u0646\u0642\u0644 \u0642\u0648\u064a \u0645\u0639 ${medium.length} \u062d\u0645\u0627\u064a\u0629 \u0645\u0641\u0642\u0648\u062f\u0629 \u062a\u064f\u0648\u0633\u0651\u0639 \u0633\u0637\u062d \u0627\u0644\u0647\u062c\u0648\u0645.`
      : `${domain} keeps solid transport but lacks ${medium.length} browser-side ${medium.length > 1 ? "controls" : "control"}, widening practical attack surface.`;
  }

  return locale === "ar"
    ? `\u064a\u062d\u0627\u0641\u0638 ${domain} \u0639\u0644\u0649 \u0623\u0645\u0646 \u0646\u0642\u0644 \u0642\u0648\u064a \u0645\u0639 ${low.length} \u0641\u062c\u0648\u0629 \u0628\u0633\u064a\u0637\u0629 \u2014 \u0628\u062f\u0648\u0646 \u0625\u062c\u0631\u0627\u0621 \u0639\u0627\u062c\u0644.`
    : `${domain} keeps strong transport with ${low.length} low-severity hardening gap${low.length > 1 ? "s" : ""} — no urgent action.`;
}

export type FindingV5 = {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  ownerImpact: string;
  businessImpact: string;
  technicalDetail: string;
  effortMinutes: number;
  platform: string;
  standards: string[];
  snippet: string;
  expectedScoreGain: number;
  ifIgnored: string;
  afterFixed: string;
};

export type ActionV5 = {
  findingId: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  ifIgnored: string;
  afterFixed: string;
  snippet: string;
  effortMinutes: number;
  platform: string;
  standards: string[];
  expectedScoreGain: number;
  whyNow: string;
  whereExact: string;
  verifyHow: string;
  rollbackRisk: "none" | "low" | "medium";
};

export type PdfReportDataV5 = {
  locale: LocaleV5;
  base: {
    domain: string;
    url: string;
    score: number;
    grade: string;
    threatLevel: string;
    scanId: string;
    timestamp: string;
    duration: number;
    confidence: number;
    version: string;
    verifyUrl: string;
    tokenDisplay: string;
    verifyDisplayLine1: string;
    verifyDisplayLine2: string;
  };
  executiveSentence: string;
  categoryScores: {
    tls: number;
    headers: number;
    infrastructure: number;
    domainTrust: number;
    redirectSafety: number;
  };
  findings: FindingV5[];
  actions: ActionV5[];
  tls: { version: string; cipher: string; issuer: string; daysLeft: number };
  headers: { present: string[]; missing: string[] };
  infrastructure: {
    provider: string;
    cdn: string;
    waf: string;
    asn: string;
    server: string;
    cloudProvider: string;
  };
  intel: {
    reputation: string;
    verdict: string;
    malicious: number;
    suspicious: number;
    total: number;
    phishingKeywords: boolean;
    typosquatting: string;
    entropy: number;
  };
  redirectChain: string;
  hmacToken: string;
  qrDataUrl: string;
  findingsTotal: number;
  enginesFlagged: number;
  /** When findings list is empty but tracked headers are missing — Technical page should show this (Sprint 3 wiring). */
  missingHeadersNote: string | null;
  /** Normalized Arabic category labels for charts/sections (Sprint 3). Empty object when locale is en. */
  categoryLabelsAr: Record<string, string>;
  decisionSignal: {
    label: string;
    labelAr: string;
    tier: "urgent" | "soon" | "none";
  };
  sectionIntros: {
    technical: string;
    technicalAr: string;
    intel: string;
    intelAr: string;
    trust: string;
    trustAr: string;
  };
};

function buildDecisionSignal(
  findings: FindingV5[],
  missingHeadersNote: string | null,
): PdfReportDataV5["decisionSignal"] {
  const hasCriticalOrHigh = findings.some((f) => f.severity === "critical" || f.severity === "high");
  const hasMedium = findings.some((f) => f.severity === "medium");

  if (hasCriticalOrHigh) {
    return {
      label: "Immediate action required",
      labelAr: "\u0625\u062c\u0631\u0627\u0621 \u0639\u0627\u062c\u0644 \u0645\u0637\u0644\u0648\u0628",
      tier: "urgent",
    };
  }
  if (hasMedium) {
    return {
      label: "Fix within this week",
      labelAr: "\u064a\u064f\u0639\u0627\u0644\u062c \u062e\u0644\u0627\u0644 \u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639",
      tier: "soon",
    };
  }
  if (findings.length === 0 && missingHeadersNote !== null) {
    return {
      label: "Hardening improvements available",
      labelAr: "\u062a\u062d\u0633\u064a\u0646\u0627\u062a \u062a\u0635\u0644\u064a\u0628 \u0645\u062a\u0627\u062d\u0629",
      tier: "soon",
    };
  }
  return {
    label: "No urgent remediation required",
    labelAr: "\u0644\u0627 \u062a\u0648\u062c\u062f \u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0639\u0627\u062c\u0644\u0629 \u0645\u0637\u0644\u0648\u0628\u0629",
    tier: "none",
  };
}

function buildSectionIntros(weakCount: number): PdfReportDataV5["sectionIntros"] {
  const technicalEn =
    weakCount > 0
      ? "Transport, headers, and hosting evidence — where controls are missing or weak."
      : "Transport, headers, and hosting evidence captured during this scan.";
  const technicalArRaw =
    weakCount > 0
      ? "\u0623\u062f\u0644\u0629 \u0627\u0644\u0646\u0642\u0644 \u0648\u0627\u0644\u0631\u0624\u0648\u0633 \u0648\u0627\u0644\u0628\u064a\u0626\u0629 \u0627\u0644\u0645\u0633\u062a\u0636\u0627\u0641\u0629 \u2014 \u062d\u064a\u062b \u062a\u064f\u0641\u0642\u062f \u0627\u0644\u0636\u0648\u0627\u0628\u0637 \u0623\u0648 \u062a\u0636\u0639\u0641."
      : "\u0623\u062f\u0644\u0629 \u0627\u0644\u0646\u0642\u0644 \u0648\u0627\u0644\u0631\u0624\u0648\u0633 \u0648\u0627\u0644\u0628\u064a\u0626\u0629 \u0627\u0644\u0645\u0633\u062a\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u064f\u062d\u0627\u0641\u0638\u0629 \u062e\u0644\u0627\u0644 \u0647\u0630\u0627 \u0627\u0644\u0641\u062d\u0635.";
  const intelEn = "External reputation and abuse signals for this hostname — not transport configuration.";
  const intelArRaw =
    "\u0625\u0634\u0627\u0631\u0627\u062a \u0627\u0644\u0633\u0645\u0639\u0629 \u0648\u0627\u0644\u0625\u0633\u0627\u0621 \u0627\u0644\u062e\u0627\u0631\u062c\u064a \u0644\u0647\u0630\u0627 \u0627\u0644\u0627\u0633\u0645 \u2014 \u0644\u064a\u0633 \u0625\u0639\u062f\u0627\u062f \u0627\u0644\u0646\u0642\u0644.";
  const trustEn = "Cryptographic proof of scan origin and time — verification fields below.";
  const trustArRaw =
    "\u062f\u0644\u064a\u0644 \u062a\u0634\u0641\u064a\u0631\u064a \u0639\u0644\u0649 \u0645\u0631\u062c\u0639 \u0627\u0644\u0641\u062d\u0635 \u0648\u0648\u0642\u062a\u0647 \u2014 \u062d\u0642\u0648\u0644 \u0627\u0644\u062a\u062d\u0642\u0642 \u0623\u062f\u0646\u0627\u0647.";
  return {
    technical: narr(technicalEn, "en"),
    technicalAr: narr(technicalArRaw, "ar"),
    intel: narr(intelEn, "en"),
    intelAr: narr(intelArRaw, "ar"),
    trust: narr(trustEn, "en"),
    trustAr: narr(trustArRaw, "ar"),
  };
}

function findingKey(f: Finding, i: number): string {
  return f.id ?? `idx-${i}-${str(f.message?.en).slice(0, 24)}`;
}

function buildIfIgnoredNoRemediation(f: Finding, result: ScanResult, locale: LocaleV5): string {
  const title = narr(locale === "ar" ? str(f.message?.ar) : str(f.message?.en), locale).slice(0, 63);
  const dom = domainFromResult(result);
  const msgEn = str(f.message?.en).toLowerCase();
  const msgAr = str(f.message?.ar);
  if (
    result.intelligence.typosquatting &&
    (msgEn.includes("typo") || msgEn.includes("typosquatting") || msgAr.includes("\u0627\u0646\u062a\u062d\u0627\u0644"))
  ) {
    return locale === "ar"
      ? `\u0627\u0644\u0625\u0634\u0627\u0631\u0629 \u0644\u0640 \"${title}\" \u062a\u0628\u0642\u0649 \u0641\u064a \u0645\u062d\u0631\u0643\u0627\u062a \u0627\u0644\u0633\u0645\u0639\u0629. \u0627\u0644\u0623\u062b\u0631 \u0639\u0644\u0649 \u062b\u0642\u0629 \u0627\u0644\u0646\u0637\u0627\u0642 \u0644\u0640 ${dom}.`
      : `The typosquatting signal for "${title}" remains flagged in external reputation engines, reducing domain trust score for ${dom}.`;
  }
  const stack = str(result.meta.server);
  return locale === "ar"
    ? `\u0627\u0644\u0633\u062c\u0644 \u0627\u0644\u062e\u0627\u0631\u062c\u064a \u064a\u0638\u0644 \u0625\u0634\u0627\u0631\u0629 \"${title}\" \u0639\u0644\u0649 ${dom} \u0645\u0639 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062e\u0627\u062f\u0645 ${stack}.`
    : `External telemetry keeps surfacing "${title}" for ${dom} with stack fingerprint ${stack}.`;
}

function mapFindingToV5(
  f: Finding,
  technologies: string[],
  locale: LocaleV5,
  dedupeKey: string,
  result: ScanResult,
): FindingV5 | null {
  const id = f.id;
  const titleBase =
    locale === "ar" ? narr(str(f.message?.ar), locale) : narr(str(f.message?.en), locale);
  const title = titleBase.slice(0, 84);
  const sev = normalizeSeverity(f.severity ?? "low");

  if (id === undefined) {
    const impact = locale === "ar" ? narr(str(f.impact?.ar), locale) : narr(str(f.impact?.en), locale);
    return {
      id: dedupeKey,
      severity: sev,
      title,
      ownerImpact: finalizeOwnerImpact((impact || title).slice(0, 168), locale),
      businessImpact:
        locale === "ar"
          ? "يقلل ثقة المستخدم عند وجود سلسلة هجومية."
          : "Reduces user trust when chained with client-side abuse.",
      technicalDetail:
        locale === "ar"
          ? "راجع السجل وربطه بسياسة الرؤوس والنقل في البيئة."
          : "Trace the signal to transport and header policy in your environment.",
      effortMinutes: 30,
      platform: "nginx / Apache / CDN edge",
      standards: ["OWASP ASVS"],
      snippet: "# See internal runbook",
      expectedScoreGain: 4,
      ifIgnored: buildIfIgnoredNoRemediation(f, result, locale).slice(0, 182),
      afterFixed:
        locale === "ar"
          ? "يقلل الضوضاء ويحسن اتساق السياسة."
          : "Reduces noise and improves policy consistency.",
    };
  }

  const loc = getLocalizedRemediation(id, locale);
  if (loc === undefined) {
    return null;
  }
  const snippets = getEffectiveSnippetsForFinding(id, loc.codeExamples, technologies);
  const sn = snippets[0];
  const snippet = sn !== undefined && sn.code.length > 0 ? sn.code.slice(0, 336) : "# Configure via hosting control plane";
  const effortRaw = getFixTimeEstimate(id);
  const effortMinutes = parseEffortMinutes(str(effortRaw));
  const gain = scoreGainForRisk(loc.riskReduction);
  const platform =
    locale === "ar"
      ? "nginx / Apache / طبقة CDN"
      : "nginx / Apache / CDN edge";

  return {
    id: dedupeKey,
    severity: sev,
    title: narr(loc.title, locale).slice(0, 84),
    ownerImpact: buildOwnerImpact(loc, title, locale).slice(0, 182),
    businessImpact: buildBusinessLayer(loc, locale).slice(0, 182),
    technicalDetail: buildTechnicalLayer(loc, locale).slice(0, 224),
    effortMinutes,
    platform,
    standards: standardsForCategory(loc.category),
    snippet,
    expectedScoreGain: gain,
    ifIgnored: buildIfIgnored(id, f, result, loc, locale).slice(0, 182),
    afterFixed: buildAfterFixed(loc, gain, locale).slice(0, 182),
  };
}

function mapActions(findings: FindingV5[], domain: string, locale: LocaleV5): ActionV5[] {
  const byId = new Map<string, ActionV5>();
  for (const f of findings) {
    if (byId.has(f.id)) {
      continue;
    }
    byId.set(f.id, {
      findingId: f.id,
      severity: f.severity,
      title: f.title,
      ifIgnored: f.ifIgnored,
      afterFixed: f.afterFixed,
      snippet: f.snippet,
      effortMinutes: f.effortMinutes,
      platform: f.platform,
      standards: f.standards,
      expectedScoreGain: f.expectedScoreGain,
      whyNow: buildWhyNow(f.id, domain, f.severity, locale),
      whereExact: buildWhereExact(f.platform, locale),
      verifyHow: buildVerifyHow(f.id, locale, domain),
      rollbackRisk: buildRollbackRisk(f.id),
    });
  }
  return Array.from(byId.values()).sort((a, b) => sevRank(b.severity) - sevRank(a.severity));
}

function localizeFindingV5(f: FindingV5, locale: LocaleV5): FindingV5 {
  return {
    ...f,
    title: narr(f.title, locale),
    ownerImpact: narr(f.ownerImpact, locale),
    businessImpact: narr(f.businessImpact, locale),
    technicalDetail: narr(f.technicalDetail, locale),
    ifIgnored: narr(f.ifIgnored, locale),
    afterFixed: narr(f.afterFixed, locale),
  };
}

function localizeActionV5(a: ActionV5, locale: LocaleV5): ActionV5 {
  return {
    ...a,
    title: narr(a.title, locale),
    ifIgnored: narr(a.ifIgnored, locale),
    afterFixed: narr(a.afterFixed, locale),
    whyNow: narr(a.whyNow, locale),
    whereExact: narr(a.whereExact, locale),
    verifyHow: narr(a.verifyHow, locale),
  };
}

export async function buildPdfReportDataV5(
  result: ScanResult,
  locale: LocaleV5,
  meta?: PdfExportMeta,
): Promise<PdfReportDataV5> {
  const merged: ScanResultForPdf =
    meta !== undefined
      ? { ...result, pdfScanId: meta.scanId, pdfScanToken: meta.scanToken }
      : result;
  const legacy = mapScanResult(merged);
  const technologies = result.technologies.length > 0 ? result.technologies : ["nginx", "apache"];

  const cats = calculateCategoryScores(result);
  const pick = (id: string) => cats.find((c) => c.id === id)?.score ?? 0;
  const categoryScores = {
    tls: pick("tls"),
    headers: pick("headers"),
    infrastructure: pick("infrastructure"),
    domainTrust: pick("domain"),
    redirectSafety: pick("redirects"),
  };

  const rawFindings = Array.isArray(result.findings) ? [...result.findings] : [];
  rawFindings.sort((a, b) => sevRank(b.severity ?? "low") - sevRank(a.severity ?? "low"));

  const seen = new Set<string>();
  const findings: FindingV5[] = [];
  for (let i = 0; i < rawFindings.length; i += 1) {
    const f = rawFindings[i];
    const key = findingKey(f, i);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const mapped = mapFindingToV5(f, technologies, locale, key, result);
    if (mapped !== null) {
      findings.push(mapped);
    }
  }

  const dom = domainFromResult(result);

  const mh = missingHeaderSlugs(result);
  const missingHeadersNote =
    findings.length === 0 && mh.length > 0
      ? locale === "ar"
        ? "\u0627\u0644\u0631\u0624\u0648\u0633 \u0627\u0644\u0646\u0627\u0642\u0635\u0629 \u0645\u062f\u0631\u062c\u0629 \u0644\u0623\u063a\u0631\u0627\u0636 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0641\u0642\u0637"
        : "Missing headers shown for reference — below severity threshold for findings."
      : null;

  const weakCount = Object.values(categoryScores).filter((v) => v < 70).length;
  const decisionSignal = buildDecisionSignal(findings, missingHeadersNote);
  const sectionIntros = buildSectionIntros(weakCount);

  const actions = mapActions(findings, dom, locale);

  const findingsLocalized = findings.map((x) => localizeFindingV5(x, locale));
  const actionsLocalized = actions.map((x) => localizeActionV5(x, locale));

  const rep = result.reputation;
  const malicious = rep?.malicious ?? 0;
  const suspicious = rep?.suspicious ?? 0;
  const total = rep?.totalVendors ?? 0;

  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(legacy.verifyUrl, {
      width: 72,
      margin: 1,
      color: { dark: "#e8edf5", light: "#050a14" },
    });
  } catch {
    qrDataUrl = "";
  }

  const execRaw = buildExecutiveSentence(dom, findings, categoryScores, locale);
  const executiveSentence =
    locale === "ar" ? wrapLrmDigitsLocal(narr(execRaw, locale)) : narr(execRaw, locale);

  const categoryLabelsAr: Record<string, string> =
    locale === "ar"
      ? Object.fromEntries(
          Object.entries(CATEGORY_LABEL_AR).map(([k, v]) => [k, localizedText(v, locale)]),
        )
      : {};

  const unified = buildUnifiedVerdict(malicious, suspicious, total);

  return {
    locale,
    base: {
      domain: dom,
      url: str(result.meta.finalUrl),
      score: legacy.score,
      grade: str(result.grade),
      threatLevel: (result.threatLevel ?? "low").toUpperCase(),
      scanId: legacy.scanId,
      timestamp: legacy.timestampUtc,
      duration: result.meta.responseTime,
      confidence: 95,
      version: "V1.6",
      verifyUrl: legacy.verifyUrl,
      tokenDisplay: legacy.tokenDisplay,
      verifyDisplayLine1: legacy.verifyDisplayLine1,
      verifyDisplayLine2: legacy.verifyDisplayLine2,
    },
    executiveSentence,
    categoryScores,
    findings: findingsLocalized,
    actions: actionsLocalized,
    tls: {
      version: str(result.ssl.protocol),
      cipher: str(result.ssl.cipher),
      issuer: str(result.ssl.issuer),
      daysLeft: result.ssl.daysLeft,
    },
    headers: {
      present: presentHeaderSlugs(result),
      missing: missingHeaderSlugs(result),
    },
    infrastructure: {
      provider: str(result.infrastructure.hostingProvider),
      cdn: str(result.infrastructure.cdn),
      waf: str(result.infrastructure.waf),
      asn: str(result.infrastructure.asn),
      server: str(result.meta.server),
      cloudProvider: str(result.infrastructure.cloudProvider),
    },
    intel: {
      reputation: unified.reputation,
      verdict: unified.verdict,
      malicious,
      suspicious,
      total,
      phishingKeywords: result.intelligence.activePhishingIndicators,
      typosquatting: result.intelligence.typosquatting ? "detected" : "not detected",
      entropy: Number.isFinite(result.intelligence.entropy) ? result.intelligence.entropy : 0,
    },
    redirectChain: result.redirects.chain.map((s) => s.url).join(" → "),
    hmacToken: legacy.hmacDisplay,
    qrDataUrl,
    findingsTotal: findingsLocalized.length,
    enginesFlagged: malicious + suspicious,
    missingHeadersNote,
    categoryLabelsAr,
    decisionSignal,
    sectionIntros,
  };
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  if (!Array.isArray(arr) || size <= 0) {
    return [];
  }
  const dense = arr.filter((item) => item !== undefined && item !== null) as T[];
  if (dense.length === 0) {
    return [];
  }
  const out: T[][] = [];
  for (let i = 0; i < dense.length; i += size) {
    const chunk = dense.slice(i, i + size);
    if (chunk.length > 0) {
      out.push(chunk);
    }
  }
  return out;
}
