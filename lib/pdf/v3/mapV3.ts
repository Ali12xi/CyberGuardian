import { calculateCategoryScores } from "@/lib/categoryScores";
import { getFixTimeEstimate } from "@/lib/fixSnippets";
import { getLocalizedRemediation } from "@/lib/remediation";
import type { ScanResult } from "@/lib/types";
import {
  mapScanResult,
  type PdfExportMeta,
  type ScanResultForPdf,
} from "@/lib/pdf/phaseB/mapScanResult";
import {
  FINDINGS_PER_PAGE,
  MAX_DESC,
  MAX_META,
  MAX_TITLE,
  RECS_PER_PAGE,
} from "@/lib/pdf/v3/constants";

const LRM = "\u200e";

export const PDF_V3_CATEGORY_AR: Readonly<Record<string, string>> = {
  tls: "TLS والشهادة",
  headers: "رؤوس الأمان",
  infrastructure: "البنية التحتية",
  domain: "ثقة النطاق",
  redirects: "سلامة التوجيه",
};

function str(v: string | undefined | null): string {
  if (v === undefined || v === null) {
    return "-";
  }
  const t = String(v).trim();
  return t === "" ? "-" : t;
}

function sliceMax(s: string, max: number): string {
  if (s.length <= max) {
    return s;
  }
  return `${s.slice(0, max - 1)}…`;
}

/** Leaked prompt / internal copy filter + length cap. */
export function cleanText(text: string): string {
  if (!text) {
    return "-";
  }
  if (text.startsWith("This is")) {
    return "";
  }
  if (text.includes("for scan reporting")) {
    return "";
  }
  if (text.includes("severity for scan")) {
    return "";
  }
  return text.slice(0, MAX_DESC);
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) {
    return [];
  }
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function wrapLrmDigits(s: string): string {
  return s.replace(/[0-9]+(?:[/.:][0-9]+|%)?/g, (chunk) => `${LRM}${chunk}${LRM}`);
}

export type PdfV3ScoreRow = {
  labelEn: string;
  labelAr: string;
  score: number;
  maxScore: number;
  color: string;
};

export type PdfV3AttackBar = { label: string; value: string; color: string };

export type PdfV3Finding = {
  severity: string;
  title: string;
  description: string;
  impactLine: string;
};

export type PdfV3Recommendation = {
  severity: string;
  title: string;
  why: string;
  metaLine: string;
};

export type PdfV3ThreatIntelCard = { label: string; value: string };

export type PdfV3TlsCard = { label: string; value: string };

export type PdfReportDataV3 = ReturnType<typeof buildPdfReportDataV3>;

export function buildPdfReportDataV3(
  result: ScanResult,
  meta?: PdfExportMeta,
  locale: "en" | "ar" = "en",
) {
  const merged: ScanResultForPdf =
    meta !== undefined
      ? { ...result, pdfScanId: meta.scanId, pdfScanToken: meta.scanToken }
      : result;
  const base = mapScanResult(merged);

  const findingsRaw = Array.isArray(result.findings) ? result.findings : [];

  const scoreRows: PdfV3ScoreRow[] = [];
  try {
    const cats = calculateCategoryScores(result);
    for (const c of cats) {
      let color = "#10B981";
      if (c.color === "amber") {
        color = "#F59E0B";
      }
      if (c.color === "red") {
        color = "#EF4444";
      }
      scoreRows.push({
        labelEn: c.labelEn,
        labelAr: PDF_V3_CATEGORY_AR[c.id] ?? c.labelAr,
        score: c.score,
        maxScore: 100,
        color,
      });
    }
  } catch {
    /* keep empty */
  }

  const headerRow = scoreRows.find((r) => r.labelEn.includes("Security Headers")) ?? scoreRows[1];
  const tlsRow = scoreRows.find((r) => r.labelEn.includes("TLS")) ?? scoreRows[0];
  const domainRow = scoreRows.find((r) => r.labelEn.includes("Domain")) ?? scoreRows[3];
  const infraRow = scoreRows.find((r) => r.labelEn.includes("Infrastructure")) ?? scoreRows[2];

  const attackBars: PdfV3AttackBar[] = [
    { label: "Header coverage", value: `${Math.round(headerRow?.score ?? 0)}%`, color: "#06B6D4" },
    { label: "Browser security", value: `${Math.round(tlsRow?.score ?? 0)}%`, color: "#F59E0B" },
    { label: "Domain trust", value: `${Math.round(domainRow?.score ?? 0)}%`, color: "#8B5CF6" },
    { label: "Infrastructure exposure", value: `${Math.round(infraRow?.score ?? 0)}%`, color: "#10B981" },
  ];

  const intel = result.intelligence;
  const rep = result.reputation;
  const pk = Array.isArray(intel.phishingKeywords) ? intel.phishingKeywords.join(", ") : "";

  const threatIntelCards: PdfV3ThreatIntelCard[] = [
    { label: "DOMAIN", value: str(intel.domain) },
    { label: "REPUTATION", value: str(intel.reputation) },
    { label: "SUSPICIOUS TLD", value: intel.suspiciousTld ? "Yes" : "No" },
    { label: "PHISHING KEYWORDS", value: pk === "-" ? "-" : sliceMax(pk, 80) },
    { label: "URL ENTROPY", value: Number.isFinite(intel.entropy) ? intel.entropy.toFixed(2) : "-" },
    { label: "TYPOSQUATTING", value: intel.typosquatting ? "Detected" : "Not detected" },
    { label: "VERDICT", value: rep !== null ? str(rep.verdict) : "-" },
    { label: "MALICIOUS DETECTIONS", value: rep !== null ? String(rep.malicious) : "-" },
  ].slice(0, 8);

  const tlsCards: PdfV3TlsCard[] = [
    { label: "TLS VERSION", value: str(result.ssl.protocol) },
    { label: "CIPHER", value: str(result.ssl.cipher) },
    { label: "ISSUER", value: str(result.ssl.issuer) },
    { label: "DAYS LEFT", value: String(result.ssl.daysLeft) },
    { label: "INFRASTRUCTURE", value: str(base.infraProviderEn) },
    { label: "CDN", value: str(result.infrastructure.cdn) },
  ];

  const TRACKED = [
    "strict-transport-security",
    "content-security-policy",
    "x-frame-options",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy",
  ] as const;
  const present: string[] = [];
  const missing: string[] = [];
  for (const h of TRACKED) {
    if (result.headers[h] === true) {
      present.push(h);
    } else {
      missing.push(h);
    }
  }

  const findings: PdfV3Finding[] = [];
  for (const f of findingsRaw) {
    const sev = (f.severity ?? "low").toUpperCase();
    const titleSrc = locale === "ar" ? str(f.message?.ar) : str(f.message?.en);
    const title = sliceMax(titleSrc, MAX_TITLE);
    let desc = cleanText(locale === "ar" ? str(f.impact?.ar) : str(f.impact?.en));
    if (desc === "" || desc === "-") {
      desc = cleanText(locale === "ar" ? str(f.message?.ar) : str(f.message?.en));
    }
    if (desc === "" || desc === "-") {
      desc = sliceMax(titleSrc, MAX_DESC);
    } else {
      desc = sliceMax(desc, MAX_DESC);
    }
    const id = f.id;
    let impactLine = "-";
    if (id !== undefined) {
      const loc = getLocalizedRemediation(id, locale);
      if (loc !== undefined) {
        const effort = str(getFixTimeEstimate(id) ?? "-");
        const surf = str(loc.category);
        impactLine = sliceMax(
          `Impact: ${sliceMax(loc.businessImpact, 40)} · Surface: ${surf} · Time: ${effort}`,
          MAX_META,
        );
      }
    }
    findings.push({ severity: sev, title, description: desc, impactLine: wrapLrmDigits(impactLine) });
  }

  const findingPages = chunkArray(findings, FINDINGS_PER_PAGE);

  const recommendations: PdfV3Recommendation[] = [];
  let n = 0;
  for (const f of findingsRaw) {
    n += 1;
    const sev = (f.severity ?? "low").toUpperCase();
    const title = sliceMax(`${n}. ${locale === "ar" ? str(f.message?.ar) : str(f.message?.en)}`, MAX_TITLE);
    let why = cleanText(locale === "ar" ? str(f.impact?.ar) : str(f.impact?.en));
    if (why === "" || why === "-") {
      why = cleanText(locale === "ar" ? str(f.remediation?.ar) : str(f.remediation?.en));
    }
    if (why === "" || why === "-") {
      why = sliceMax(locale === "ar" ? str(f.message?.ar) : str(f.message?.en), MAX_DESC);
    } else {
      why = sliceMax(why, MAX_DESC);
    }
    const id = f.id;
    let metaLine = "-";
    if (id !== undefined) {
      const loc = getLocalizedRemediation(id, locale);
      if (loc !== undefined) {
        const effort = str(getFixTimeEstimate(id) ?? "-");
        const complexity = str(loc.difficulty);
        const surface = str(loc.category);
        metaLine = sliceMax(`${effort} · ${complexity} · ${surface}`, MAX_META);
      }
    }
    recommendations.push({
      severity: sev,
      title: wrapLrmDigits(title),
      why: wrapLrmDigits(why),
      metaLine: wrapLrmDigits(metaLine),
    });
  }

  const recommendationPages = chunkArray(recommendations, RECS_PER_PAGE);

  const scanMetaRow1: { label: string; value: string }[] = [
    { label: "SCAN ID", value: base.scanId },
    { label: "GENERATED BY", value: "CyberGurdian AI" },
    { label: "SCANNER ENGINE", value: "CyberGurdian V1.6" },
    { label: "SCAN DURATION", value: `${result.meta.responseTime} ms` },
  ];
  const infraTrustDisplay = (locale === "ar" ? base.exposureAr : base.exposureEn).replace("exposure-:", "exposure:");
  const scanMetaRow2: { label: string; value: string }[] = [
    { label: "INTELLIGENCE ENGINE", value: "Claude + deterministic engines" },
    { label: "SCAN TIMESTAMP", value: base.timestampUtc },
    { label: "CONFIDENCE", value: "95%" },
    { label: "INFRA TRUST", value: infraTrustDisplay },
  ];

  const donutCounts = {
    high: findingsRaw.filter((f) => f.severity === "critical" || f.severity === "high").length,
    medium: findingsRaw.filter((f) => f.severity === "medium").length,
    low: findingsRaw.filter((f) => f.severity === "low" || f.severity === "informational").length,
  };

  return {
    base,
    result,
    scoreRows,
    attackBars,
    threatIntelCards,
    tlsCards,
    presentHeaders: present,
    missingHeaders: missing,
    headersImpactEn:
      present.length >= TRACKED.length
        ? "All tracked headers present."
        : `${TRACKED.length - present.length} header(s) missing.`,
    headersImpactAr:
      present.length >= TRACKED.length
        ? "جميع الرؤوس المتتبعة موجودة."
        : `${TRACKED.length - present.length} رأس مفقود.`,
    findingPages,
    recommendationPages,
    scanMetaRow1,
    scanMetaRow2,
    donutCounts,
    threatAccentColor: base.threatAccentColor,
    threatLabelEn: base.threatPillLabel,
    grade: base.grade,
    score: base.score,
    maxScore: base.maxScore,
    visibilityEn: base.visibilityEn,
    visibilityAr: base.visibilityAr,
    overviewEn: base.overviewSummaryEn,
    overviewAr: base.overviewSummaryAr,
    methodologyEn:
      "Passive TLS, headers, infrastructure signals, and reputation. AI text is advisory.",
    methodologyAr:
      "TLS السلبي والرؤوس والبنية والسمعة. النص الآلي استشاري.",
    threatDisplayAr:
      result.threatLevel === "critical"
        ? "تهديد حرج"
        : result.threatLevel === "high"
          ? "تهديد عالٍ"
          : result.threatLevel === "medium"
            ? "تهديد متوسط"
            : "تهديد منخفض",
  };
}

export type { PdfExportMeta };
