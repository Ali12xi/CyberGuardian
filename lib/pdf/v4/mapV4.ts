import { calculateCategoryScores } from "@/lib/categoryScores";
import { getEffectiveSnippetsForFinding, getFixTimeEstimate } from "@/lib/fixSnippets";
import { getLocalizedRemediation } from "@/lib/remediation";
import type { ScanResult } from "@/lib/types";
import {
  mapScanResult,
  type PdfExportMeta,
  type ScanResultForPdf,
} from "@/lib/pdf/phaseB/mapScanResult";
import {
  ACTIONS_PER_PAGE,
  ADDITIONAL_RISKS_PER_PAGE,
  MAX_NARRATIVE,
  MAX_SNIPPET,
  TOP_RISKS_COUNT,
} from "@/lib/pdf/v4/constants";

const LRM = "\u200e";

export const PDF_V4_CATEGORY_AR: Readonly<Record<string, string>> = {
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
  return text.slice(0, 160);
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

function sevRank(s: string): number {
  const u = s.toLowerCase();
  if (u === "critical") {
    return 4;
  }
  if (u === "high") {
    return 3;
  }
  if (u === "medium") {
    return 2;
  }
  return 1;
}

function priorityFromRisk(rr: string, sev: string, locale: "en" | "ar"): string {
  const s = sev.toUpperCase();
  if (s === "CRITICAL" || (rr === "high" && (s === "HIGH" || s === "CRITICAL"))) {
    return locale === "ar" ? "إصلاح فوري" : "Fix now";
  }
  if (rr === "high" || s === "HIGH" || s === "MEDIUM") {
    return locale === "ar" ? "إصلاح هذا الأسبوع" : "Fix this week";
  }
  return locale === "ar" ? "تحسين لاحقاً" : "Improve later";
}

function attackFeasibility(sev: string, locale: "en" | "ar"): string {
  const u = sev.toUpperCase();
  if (u === "CRITICAL" || u === "HIGH") {
    return locale === "ar" ? "مرتفع" : "High";
  }
  if (u === "MEDIUM") {
    return locale === "ar" ? "متوسط" : "Medium";
  }
  return locale === "ar" ? "منخفض" : "Low";
}

function buildKeyObservation(
  result: ScanResult,
  rows: { labelEn: string; score: number }[],
  locale: "en" | "ar",
): string {
  const headers = rows.find((r) => r.labelEn.includes("Security Headers"));
  const tls = rows.find((r) => r.labelEn.includes("TLS"));
  const h = headers?.score ?? 72;
  const t = tls?.score ?? 72;
  if (locale === "ar") {
    if (t >= 78 && h < 68) {
      return "TLS قوي مع فجوات في رؤوس الأمان.";
    }
    if (t < 68) {
      return "شهادة أو بروتوكول TLS يحتاج مراجعة.";
    }
    if (h >= 72 && t >= 72) {
      return "موازنة جيدة بين التشفير وضوابط المتصفح.";
    }
    return "راجع النتائج لتحديد الأولويات.";
  }
  if (t >= 78 && h < 68) {
    return "Strong TLS posture with minor header gaps.";
  }
  if (t < 68) {
    return "Certificate or TLS protocol posture should be reviewed.";
  }
  if (h >= 72 && t >= 72) {
    return "Balanced encryption and browser-side controls.";
  }
  return "Review prioritized items to focus remediation.";
}

export type PdfV4ScoreRow = {
  labelEn: string;
  labelAr: string;
  score: number;
  maxScore: number;
  color: string;
};

export type PdfV4TopRisk = {
  severity: string;
  title: string;
  owner: string;
  manager: string;
  developer: string;
  effort: string;
  attackFeasibility: string;
  priority: string;
};

export type PdfV4CompactRisk = {
  severity: string;
  title: string;
  blurb: string;
};

export type PdfV4ActionItem = {
  severity: string;
  problem: string;
  whyItMatters: string;
  technicalFix: string;
  snippet: string;
  snippetPlatform: string;
  effort: string;
  platformHint: string;
  expectedImprovement: string;
};

export type PdfV4IntelRow = { labelEn: string; labelAr: string; value: string };

export function buildPdfReportDataV4(result: ScanResult, meta?: PdfExportMeta, locale: "en" | "ar" = "en") {
  const merged: ScanResultForPdf =
    meta !== undefined
      ? { ...result, pdfScanId: meta.scanId, pdfScanToken: meta.scanToken }
      : result;
  const base = mapScanResult(merged);
  const findingsRaw = Array.isArray(result.findings) ? result.findings : [];
  const technologies = result.technologies.length > 0 ? result.technologies : ["nginx", "apache"];

  const scoreRows: PdfV4ScoreRow[] = [];
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
        labelAr: PDF_V4_CATEGORY_AR[c.id] ?? c.labelAr,
        score: c.score,
        maxScore: 100,
        color,
      });
    }
  } catch {
    /* empty */
  }

  const headerRow = scoreRows.find((r) => r.labelEn.includes("Security Headers")) ?? scoreRows[1];
  const tlsRow = scoreRows.find((r) => r.labelEn.includes("TLS")) ?? scoreRows[0];
  const domainRow = scoreRows.find((r) => r.labelEn.includes("Domain")) ?? scoreRows[3];
  const infraRow = scoreRows.find((r) => r.labelEn.includes("Infrastructure")) ?? scoreRows[2];

  const attackBars = [
    { labelEn: "Header coverage", labelAr: "تغطية الرؤوس", value: `${Math.round(headerRow?.score ?? 0)}%`, color: "#06B6D4" },
    { labelEn: "Browser security", labelAr: "أمان المتصفح", value: `${Math.round(tlsRow?.score ?? 0)}%`, color: "#F59E0B" },
    { labelEn: "Domain trust", labelAr: "ثقة النطاق", value: `${Math.round(domainRow?.score ?? 0)}%`, color: "#8B5CF6" },
    {
      labelEn: "Infrastructure exposure",
      labelAr: "تعرض البنية",
      value: `${Math.round(infraRow?.score ?? 0)}%`,
      color: "#10B981",
    },
  ];

  const intel = result.intelligence;
  const rep = result.reputation;
  const pk = Array.isArray(intel.phishingKeywords) ? intel.phishingKeywords.join(", ") : "";

  const threatInfraRows: PdfV4IntelRow[] = [
    { labelEn: "Domain", labelAr: "النطاق", value: str(intel.domain) },
    { labelEn: "Reputation", labelAr: "السمعة", value: str(intel.reputation) },
    { labelEn: "TLS version", labelAr: "إصدار TLS", value: str(result.ssl.protocol) },
    { labelEn: "Issuer", labelAr: "جهة الإصدار", value: str(result.ssl.issuer) },
    { labelEn: "CDN / edge", labelAr: "CDN", value: str(result.infrastructure.cdn) },
    { labelEn: "Vendor verdict", labelAr: "حكم المحركات", value: rep !== null ? str(rep.verdict) : "-" },
    { labelEn: "Malicious signals", labelAr: "إشارات خبيثة", value: rep !== null ? String(rep.malicious) : "-" },
    {
      labelEn: "Phishing indicators",
      labelAr: "مؤشرات تصيد",
      value:
        locale === "ar"
          ? intel.activePhishingIndicators
            ? "موجودة"
            : "لا يوجد"
          : intel.activePhishingIndicators
            ? "Present"
            : "None",
    },
    {
      labelEn: "Typosquatting",
      labelAr: "انتحال النطاق",
      value:
        locale === "ar"
          ? intel.typosquatting
            ? "مكتشف"
            : "غير مكتشف"
          : intel.typosquatting
            ? "Detected"
            : "Not detected",
    },
    { labelEn: "Entropy", labelAr: "الانتروبيا", value: Number.isFinite(intel.entropy) ? intel.entropy.toFixed(2) : "-" },
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

  const sorted = [...findingsRaw].sort((a, b) => sevRank(b.severity ?? "low") - sevRank(a.severity ?? "low"));

  const topRisks: PdfV4TopRisk[] = [];
  for (let i = 0; i < Math.min(TOP_RISKS_COUNT, sorted.length); i += 1) {
    const f = sorted[i];
    const id = f.id;
    const titleSrc = locale === "ar" ? str(f.message?.ar) : str(f.message?.en);
    const title = sliceMax(titleSrc, 88);
    let owner = "-";
    let manager = "-";
    let developer = "-";
    let effort = "-";
    let rr = "low";
    if (id !== undefined) {
      const loc = getLocalizedRemediation(id, locale);
      if (loc !== undefined) {
        let owner = sliceMax(loc.explanation.simple, MAX_NARRATIVE);
        const ownerClean = cleanText(owner);
        if (ownerClean === "" || ownerClean === "-") {
          owner = sliceMax(titleSrc, MAX_NARRATIVE);
        } else {
          owner = sliceMax(ownerClean, MAX_NARRATIVE);
        }
        manager = sliceMax(loc.businessImpact, MAX_NARRATIVE);
        developer = sliceMax(loc.explanation.technical, MAX_NARRATIVE);
        effort = str(getFixTimeEstimate(id) ?? "-");
        rr = loc.riskReduction;
      }
    }
    const sev = (f.severity ?? "low").toUpperCase();
    topRisks.push({
      severity: sev,
      title,
      owner: wrapLrmDigits(owner),
      manager: wrapLrmDigits(manager),
      developer: wrapLrmDigits(developer),
      effort: wrapLrmDigits(effort),
      attackFeasibility: attackFeasibility(f.severity ?? "low", locale),
      priority: priorityFromRisk(rr, sev, locale),
    });
  }

  const restFindings = sorted.slice(TOP_RISKS_COUNT);
  const compact: PdfV4CompactRisk[] = restFindings.map((f) => {
    const titleSrc = locale === "ar" ? str(f.message?.ar) : str(f.message?.en);
    let bl = cleanText(locale === "ar" ? str(f.impact?.ar) : str(f.impact?.en));
    if (!bl || bl === "-" || bl === "") {
      bl = sliceMax(titleSrc, 100);
    } else {
      bl = sliceMax(bl, 100);
    }
    return {
      severity: (f.severity ?? "low").toUpperCase(),
      title: sliceMax(titleSrc, 72),
      blurb: bl,
    };
  });
  const additionalRiskPages = chunkArray(compact, ADDITIONAL_RISKS_PER_PAGE);

  const actionItems: PdfV4ActionItem[] = [];
  const seen = new Set<string>();
  for (const f of findingsRaw) {
    const id = f.id;
    if (id === undefined || seen.has(id)) {
      continue;
    }
    seen.add(id);
    const loc = getLocalizedRemediation(id, locale);
    if (loc === undefined) {
      continue;
    }
    const snippets = getEffectiveSnippetsForFinding(id, loc.codeExamples, technologies);
    const sn = snippets.length > 0 ? snippets[0] : { platform: "general" as const, label: "General", code: "" };
    const problem = sliceMax(locale === "ar" ? str(f.message?.ar) : str(f.message?.en), 90);
    const whyItMatters = sliceMax(loc.businessImpact, MAX_NARRATIVE);
    const technicalFix = sliceMax(loc.recommendation, MAX_NARRATIVE);
    const snippet = sliceMax(sn.code || "-", MAX_SNIPPET);
    const effort = str(getFixTimeEstimate(id) ?? "-");
    const platformHint = sn.label;
    const exp =
      loc.riskReduction === "high"
        ? locale === "ar"
          ? "تقليل مخاطر ملحوظ"
          : "Meaningful risk reduction"
        : loc.riskReduction === "medium"
          ? locale === "ar"
            ? "تحسين ملموس"
            : "Tangible hardening"
          : locale === "ar"
            ? "تحسين تدريجي"
            : "Incremental improvement";
    actionItems.push({
      severity: (f.severity ?? "low").toUpperCase(),
      problem: wrapLrmDigits(problem),
      whyItMatters: wrapLrmDigits(whyItMatters),
      technicalFix: wrapLrmDigits(technicalFix),
      snippet: wrapLrmDigits(snippet),
      snippetPlatform: sn.platform,
      effort: wrapLrmDigits(effort),
      platformHint: `${platformHint} · ${loc.category}`,
      expectedImprovement: exp,
    });
  }
  actionItems.sort((a, b) => sevRank(b.severity) - sevRank(a.severity));
  const actionPlanPages = chunkArray(actionItems, ACTIONS_PER_PAGE);

  const keyObservationEn = buildKeyObservation(result, scoreRows, "en");
  const keyObservationAr = buildKeyObservation(result, scoreRows, "ar");
  const keyObservation = locale === "ar" ? keyObservationAr : keyObservationEn;

  const executiveNarrative = sliceMax(locale === "ar" ? base.overviewSummaryAr : base.overviewSummaryEn, 420);
  const businessRiskNarrative = sliceMax(
    locale === "ar"
      ? "يُقيّم هذا التقرير المخاطر الظاهرة خارجياً ولا يغني عن اختبار داخلي أو سياسات أمنية."
      : "This assessment reflects externally visible risk; it does not replace internal testing or policy controls.",
    280,
  );

  const donutCounts = {
    high: findingsRaw.filter((x) => x.severity === "critical" || x.severity === "high").length,
    medium: findingsRaw.filter((x) => x.severity === "medium").length,
    low: findingsRaw.filter((x) => x.severity === "low" || x.severity === "informational").length,
  };

  const infraTrustDisplay = (locale === "ar" ? base.exposureAr : base.exposureEn).replace("exposure-:", "exposure:");

  return {
    base,
    result,
    locale,
    scoreRows,
    attackBars,
    threatInfraRows,
    presentHeaders: present,
    missingHeaders: missing,
    headersImpactEn:
      present.length >= TRACKED.length
        ? "All tracked headers present."
        : `${TRACKED.length - present.length} header(s) missing.`,
    headersImpactAr:
      present.length >= TRACKED.length
        ? "جميع الرؤوس المتتبعة موجودة."
        : `${LRM}${TRACKED.length - present.length}${LRM} رأس مفقود.`,
    topRisks,
    additionalRiskPages,
    actionPlanPages,
    donutCounts,
    keyObservation,
    executiveNarrative,
    businessRiskNarrative,
    threatAccentColor: base.threatAccentColor,
    threatHeroLabel:
      locale === "ar"
        ? result.threatLevel === "critical"
          ? "تهديد حرج"
          : result.threatLevel === "high"
            ? "تهديد عالٍ"
            : result.threatLevel === "medium"
              ? "تهديد متوسط"
              : "تهديد منخفض"
        : base.threatPillLabel,
    threatDisplayAr:
      result.threatLevel === "critical"
        ? "تهديد حرج"
        : result.threatLevel === "high"
          ? "تهديد عالٍ"
          : result.threatLevel === "medium"
            ? "تهديد متوسط"
            : "تهديد منخفض",
    grade: base.grade,
    score: base.score,
    maxScore: base.maxScore,
    visibilityEn: base.visibilityEn,
    visibilityAr: base.visibilityAr,
    tlsCards: [
      { labelEn: "TLS version", labelAr: "إصدار TLS", value: str(result.ssl.protocol) },
      { labelEn: "Cipher", labelAr: "الخوارزمية", value: str(result.ssl.cipher) },
      { labelEn: "Issuer", labelAr: "المصدر", value: str(result.ssl.issuer) },
      { labelEn: "Days remaining", labelAr: "الأيام المتبقية", value: String(result.ssl.daysLeft) },
      { labelEn: "Infrastructure", labelAr: "البنية", value: str(base.infraProviderEn) },
      { labelEn: "CDN", labelAr: "CDN", value: str(result.infrastructure.cdn) },
    ],
    scanMetaRows: [
      [
        { labelEn: "Scan ID", labelAr: "معرف الفحص", value: base.scanId },
        { labelEn: "Generated by", labelAr: "أنشئ بواسطة", value: "CyberGurdian AI" },
        { labelEn: "Scanner", labelAr: "الماسح", value: "CyberGurdian V1.6" },
        { labelEn: "Duration", labelAr: "المدة", value: `${result.meta.responseTime} ms` },
      ],
      [
        { labelEn: "Intelligence engine", labelAr: "محرك الذكاء", value: "Claude + deterministic engines" },
        { labelEn: "Scan timestamp", labelAr: "وقت الفحص", value: base.timestampUtc },
        { labelEn: "Confidence", labelAr: "الثقة", value: "95%" },
        { labelEn: "Infrastructure trust", labelAr: "ثقة البنية", value: infraTrustDisplay },
      ],
    ],
  };
}

export type PdfReportDataV4 = ReturnType<typeof buildPdfReportDataV4>;

export type { PdfExportMeta };
