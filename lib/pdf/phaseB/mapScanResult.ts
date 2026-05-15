import { calculateCategoryScores } from "@/lib/categoryScores";
import { getEffectiveSnippetsForFinding, getFixTimeEstimate } from "@/lib/fixSnippets";
import { getLocalizedRemediation, getRemediationById } from "@/lib/remediation";
import type { Finding, ScanResult } from "@/lib/types";

/** Left-to-right mark — keeps digit order correct next to Arabic in PDF text runs. */
const LRM = "\u200e";

/** Wrap Latin digit runs (e.g. 77/95, TLS 1.3, day counts) so they stay LTR inside Arabic PDF lines. */
function wrapLatinDigitRunsWithLrm(s: string): string {
  return s.replace(/[0-9]+(?:[/.:][0-9]+)*/g, (chunk) => `${LRM}${chunk}${LRM}`);
}

/** API fields not on `ScanResult` — pass at export time without changing the type definition. */
export type PdfExportMeta = {
  scanId: string;
  scanToken: string;
};

export type PdfScoreRow = {
  labelEn: string;
  labelAr: string;
  score: number;
  noteEn: string;
  noteAr: string;
};

export type PdfAttackLine = {
  severityLabel: string;
  lineEn: string;
  lineAr: string;
  dotColor: string;
};

export type PdfActionLine = {
  lineEn: string;
  lineAr: string;
};

export type PdfPlanFinding = {
  severityLabel: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  businessImpactEn: string;
  businessImpactAr: string;
  codeSnippet: string;
  effortLabel: string;
  stripeColor: string;
  pillBg: string;
  pillText: string;
};

export type PdfReportData = {
  domain: string;
  finalUrl: string;
  grade: string;
  score: number;
  maxScore: number;
  visibilityEn: string;
  visibilityAr: string;
  scanId: string;
  scanToken: string;
  tokenDisplay: string;
  timestampUtc: string;
  hmacDisplay: string;
  verifyUrl: string;
  verifyDisplayLine1: string;
  verifyDisplayLine2: string;
  scoreRows: PdfScoreRow[];
  overviewSummaryEn: string;
  overviewSummaryAr: string;
  attackLines: PdfAttackLine[];
  infraProviderEn: string;
  infraProviderAr: string;
  infraTlsLine: string;
  infraCdnEn: string;
  infraCdnAr: string;
  exposureEn: string;
  exposureAr: string;
  exposureColor: string;
  actionLines: PdfActionLine[];
  compactPlanOnPage3: boolean;
  compactPlanRows: PdfPlanFinding[];
  planChunks: PdfPlanFinding[][];
  planPageSubtitlesEn: string[];
  planPageSubtitlesAr: string[];
  pdfPageCount: number;
  threatAccentColor: string;
  threatPillBg: string;
  threatPillText: string;
  threatPillLabel: string;
};

function str(v: string | undefined | null): string {
  if (v === undefined || v === null) {
    return "-";
  }
  const t = String(v).trim();
  return t === "" ? "-" : t;
}

function safeNum(n: number | undefined | null, fallback: number): number {
  if (n === undefined || n === null || Number.isNaN(n)) {
    return fallback;
  }
  return n;
}

function formatUtcTimestamp(iso: string): string {
  if (iso === "-") {
    return "-";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "-";
  }
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}/${mo}/${da} ${h}:${mi} UTC`;
}

function domainFromResult(result: ScanResult): string {
  const d = str(result.intelligence.domain);
  if (d !== "-") {
    return d;
  }
  const url = result.meta.finalUrl;
  if (url === "" || url === "-") {
    return "-";
  }
  try {
    return str(new URL(url).hostname);
  } catch {
    return "-";
  }
}

function visibilityStrings(overall: ScanResult["observableCoverage"]["overall"]): { en: string; ar: string } {
  if (overall === "full") {
    return { en: "High", ar: "\u0645\u0631\u062a\u0641\u0639" };
  }
  if (overall === "partial") {
    return { en: "Partial", ar: "\u062c\u0632\u0626\u064a" };
  }
  return { en: "Limited", ar: "\u0645\u062d\u062f\u0648\u062f" };
}

function threatVisuals(level: ScanResult["threatLevel"]): {
  accent: string;
  pillBg: string;
  pillText: string;
  label: string;
} {
  if (level === "low") {
    return {
      accent: "#10B981",
      pillBg: "#DCFCE7",
      pillText: "#15803D",
      label: "LOW THREAT",
    };
  }
  if (level === "medium") {
    return {
      accent: "#F59E0B",
      pillBg: "#FEF3C7",
      pillText: "#B45309",
      label: "MEDIUM THREAT",
    };
  }
  return {
    accent: "#EF4444",
    pillBg: "#FEE2E2",
    pillText: "#B91C1C",
    label: level === "critical" ? "CRITICAL THREAT" : "HIGH THREAT",
  };
}

function severityUpper(sev: Finding["severity"]): string {
  return sev.toUpperCase();
}

function severityStripeAndPill(sev: Finding["severity"]): { stripe: string; bg: string; text: string } {
  if (sev === "critical" || sev === "high") {
    return { stripe: "#EF4444", bg: "#FEE2E2", text: "#B91C1C" };
  }
  if (sev === "medium") {
    return { stripe: "#F59E0B", bg: "#FEF3C7", text: "#B45309" };
  }
  return { stripe: "#10B981", bg: "#DCFCE7", text: "#15803D" };
}

function dotColorForSeverity(sev: Finding["severity"]): string {
  if (sev === "critical" || sev === "high") {
    return "#EF4444";
  }
  if (sev === "medium") {
    return "#F59E0B";
  }
  return "#10B981";
}

function slice120(text: string): string {
  if (text.length <= 120) {
    return text;
  }
  return text.slice(0, 117) + "...";
}

/** Display-only truncation for long JWTs / hashes (full value stays in `verifyUrl` / `scanToken`). */
function truncateDisplay(s: string): string {
  if (s.length <= 40) {
    return s;
  }
  return `${s.slice(0, 20)}…${s.slice(-8)}`;
}

function normalizeFindingsList(result: ScanResult): Finding[] {
  const raw = result.findings;
  return Array.isArray(raw) ? raw : [];
}

function pickInfrastructureProvider(infra: ScanResult["infrastructure"]): string {
  const ordered = [
    infra.hostingProvider,
    infra.cloudProvider,
    infra.reverseProxy,
    infra.framework,
    infra.waf,
    infra.cdn,
  ];
  for (let i = 0; i < ordered.length; i += 1) {
    const v = ordered[i];
    const t = typeof v === "string" ? v.trim() : "";
    if (t !== "") {
      return t;
    }
  }
  const dets = infra.detections;
  if (Array.isArray(dets)) {
    for (let j = 0; j < dets.length; j += 1) {
      const n = dets[j]?.name;
      const tn = typeof n === "string" ? n.trim() : "";
      if (tn !== "") {
        return tn;
      }
    }
  }
  return "";
}

function estimateMinutesFromFindings(findings: Finding[]): number {
  let total = 0;
  for (let i = 0; i < findings.length; i += 1) {
    const f = findings[i];
    const id = f.id;
    if (id === undefined) {
      continue;
    }
    const est = getFixTimeEstimate(id);
    if (est === undefined) {
      continue;
    }
    const digits = est.replace(/[^\d]/g, "");
    const n = parseInt(digits, 10);
    if (!Number.isNaN(n)) {
      total += n;
    }
  }
  return total > 0 ? total : 20;
}

function buildPlanSubtitleEn(findings: Finding[]): string {
  const n = findings.length;
  const m = estimateMinutesFromFindings(findings);
  return `${n} findings · ~${m} min total`;
}

function buildPlanSubtitleAr(findings: Finding[]): string {
  const n = findings.length;
  const m = estimateMinutesFromFindings(findings);
  return `${LRM}${n}${LRM} \u0646\u062a\u064a\u062c\u0629 \u00b7 ~${LRM}${m}${LRM} \u062f \u0625\u062c\u0645\u0627\u0644\u064a`;
}

function mapFindingToPlan(f: Finding, technologies: string[]): PdfPlanFinding {
  const sev: Finding["severity"] = f.severity ?? "low";
  const sp = severityStripeAndPill(sev);
  const id = f.id;
  const rem = id !== undefined ? getRemediationById(id) : undefined;
  const snippets = getEffectiveSnippetsForFinding(
    id,
    rem !== undefined ? rem.codeExamples : undefined,
    technologies,
  );
  let code = "-";
  if (snippets.length > 0) {
    const c = snippets[0].code;
    if (c.length > 0) {
      code = c.slice(0, 600);
    }
  }
  const titleEn = str(f.message?.en);
  const titleArRaw = str(f.message?.ar);
  const impactEn = f.impact !== undefined ? str(f.impact.en) : "";
  const impactAr = f.impact !== undefined ? str(f.impact.ar) : "";
  const descSrcEn = impactEn !== "" ? impactEn : titleEn;
  const descSrcAr = impactAr !== "" ? impactAr : titleArRaw;
  let businessImpactEn = "-";
  let businessImpactAr = "-";
  if (id !== undefined) {
    const locEn = getLocalizedRemediation(id, "en");
    const locAr = getLocalizedRemediation(id, "ar");
    if (locEn !== undefined) {
      businessImpactEn = str(locEn.businessImpact);
    }
    if (locAr !== undefined) {
      businessImpactAr = str(locAr.businessImpact);
    }
  }
  const effort = id !== undefined ? str(getFixTimeEstimate(id) ?? "-") : "-";

  return {
    severityLabel: severityUpper(sev),
    titleEn,
    titleAr: wrapLatinDigitRunsWithLrm(titleArRaw),
    descriptionEn: slice120(descSrcEn),
    descriptionAr: wrapLatinDigitRunsWithLrm(slice120(descSrcAr)),
    businessImpactEn,
    businessImpactAr: wrapLatinDigitRunsWithLrm(businessImpactAr),
    codeSnippet: code,
    effortLabel: wrapLatinDigitRunsWithLrm(effort),
    stripeColor: sp.stripe,
    pillBg: sp.bg,
    pillText: sp.text,
  };
}

function resolveOverviewSummary(result: ScanResult): { en: string; ar: string } {
  const positives = result.scoreBreakdown.positives;
  if (positives.length > 0) {
    const r = positives[0].reason;
    if (r.trim() !== "") {
      return { en: slice120(r), ar: wrapLatinDigitRunsWithLrm(slice120(r)) };
    }
  }
  const findings = normalizeFindingsList(result);
  if (findings.length > 0) {
    const m = findings[0].message;
    const en = str(m?.en);
    const ar = str(m?.ar);
    return { en: slice120(en), ar: wrapLatinDigitRunsWithLrm(slice120(ar)) };
  }
  return {
    en: "External security analysis completed. Review findings for prioritized remediation.",
    ar: "\u0627\u0643\u062a\u0645\u0644 \u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0623\u0645\u0646\u064a \u0627\u0644\u062e\u0627\u0631\u062c\u064a. \u0631\u0627\u062c\u0639 \u0627\u0644\u0646\u062a\u0627\u0626\u062c \u0644\u0644\u0625\u0635\u0644\u0627\u062d\u0627\u062a \u0630\u0627\u062a \u0627\u0644\u0623\u0648\u0644\u0648\u064a\u0629.",
  };
}

export type ScanResultForPdf = ScanResult & {
  pdfScanId?: string;
  pdfScanToken?: string;
};

export function mapScanResult(input: ScanResultForPdf): PdfReportData {
  const result: ScanResult = input;
  const metaScanId = input.pdfScanId;
  const metaToken = input.pdfScanToken;
  const scanId = metaScanId !== undefined && metaScanId !== "" ? str(metaScanId) : "-";
  const scanToken = metaToken !== undefined && metaToken !== "" ? str(metaToken) : "-";
  const technologies = result.technologies.length > 0 ? result.technologies : ["nginx", "apache"];

  let scoreRows: PdfScoreRow[] = [];
  try {
    const cats = calculateCategoryScores(result);
    scoreRows = cats.map((c) => ({
      labelEn: c.labelEn,
      labelAr: wrapLatinDigitRunsWithLrm(c.labelAr),
      score: safeNum(c.score, 0),
      noteEn: c.noteEn,
      noteAr: wrapLatinDigitRunsWithLrm(c.noteAr),
    }));
  } catch {
    scoreRows = [];
  }

  const findings = normalizeFindingsList(result);
  const attackSlice = findings.slice(0, 4);
  const attackLines: PdfAttackLine[] = [];
  for (let i = 0; i < attackSlice.length; i += 1) {
    const f = attackSlice[i];
    const sev: Finding["severity"] = f.severity ?? "low";
    attackLines.push({
      severityLabel: severityUpper(sev),
      lineEn: `${severityUpper(sev)}  ${str(f.message?.en)}`,
      lineAr: `${LRM}${severityUpper(sev)}  ${wrapLatinDigitRunsWithLrm(str(f.message?.ar))}`,
      dotColor: dotColorForSeverity(sev),
    });
  }

  const actionSlice = findings.slice(0, 4);
  const actionLines: PdfActionLine[] = [];
  for (let i = 0; i < actionSlice.length; i += 1) {
    const f = actionSlice[i];
    const idx = i + 1;
    const id = f.id;
    const effort = id !== undefined ? str(getFixTimeEstimate(id) ?? "-") : "-";
    actionLines.push({
      lineEn: `${idx}. ${str(f.message?.en)}  (${effort})`,
      lineAr: `${LRM}${idx}.${LRM} ${wrapLatinDigitRunsWithLrm(str(f.message?.ar))}  (${LRM}${effort}${LRM})`,
    });
  }

  const planSource = findings;
  const planMapped: PdfPlanFinding[] = [];
  for (let i = 0; i < planSource.length; i += 1) {
    try {
      planMapped.push(mapFindingToPlan(planSource[i], technologies));
    } catch {
      const fb: Finding["severity"] = planSource[i].severity ?? "low";
      const sp = severityStripeAndPill(fb);
      planMapped.push({
        severityLabel: severityUpper(fb),
        titleEn: str(planSource[i].message?.en),
        titleAr: wrapLatinDigitRunsWithLrm(str(planSource[i].message?.ar)),
        descriptionEn: "-",
        descriptionAr: "-",
        businessImpactEn: "-",
        businessImpactAr: "-",
        codeSnippet: "-",
        effortLabel: "-",
        stripeColor: sp.stripe,
        pillBg: sp.bg,
        pillText: sp.text,
      });
    }
  }

  const compact = findings.length <= 3;
  const compactPlanRows = compact ? planMapped.slice(0, 3) : [];

  const planChunks: PdfPlanFinding[][] = [];
  const CHUNK = 6;
  if (!compact) {
    for (let i = 0; i < planMapped.length; i += CHUNK) {
      planChunks.push(planMapped.slice(i, i + CHUNK));
    }
  }

  const planPageSubtitlesEn: string[] = [];
  const planPageSubtitlesAr: string[] = [];
  if (!compact) {
    for (let p = 0; p < planChunks.length; p += 1) {
      void p;
      planPageSubtitlesEn.push(buildPlanSubtitleEn(findings));
      planPageSubtitlesAr.push(buildPlanSubtitleAr(findings));
    }
  }

  const pdfPageCount = compact ? 4 : 3 + planChunks.length + 1;

  const providerRaw = pickInfrastructureProvider(result.infrastructure);
  const providerEn = str(providerRaw);
  const providerAr = providerEn;

  const tlsProto = str(result.ssl.protocol);
  const infraTlsLine =
    tlsProto !== "-" ? `TLS: ${tlsProto}` : "TLS: -";

  const cdnRaw = result.infrastructure.cdn;
  const cdnTrim = typeof cdnRaw === "string" ? cdnRaw.trim() : "";
  const cdnYes = cdnTrim !== "";
  const infraCdnEn = cdnYes ? "Yes" : "None";
  const infraCdnAr = cdnYes ? "\u0646\u0639\u0645" : "\u0644\u0627";

  const expScore = result.infrastructure.serverExposureScore;
  let exposureEn = "Server exposure: Low";
  let exposureAr = "\u062a\u0639\u0631\u0636 \u0627\u0644\u062e\u0627\u062f\u0645: \u0645\u0646\u062e\u0641\u0636";
  let exposureColor = "#10B981";
  if (expScore > 48) {
    exposureEn = "Server exposure: Elevated";
    exposureAr = "\u062a\u0639\u0631\u0636 \u0627\u0644\u062e\u0627\u062f\u0645: \u0645\u0631\u062a\u0641\u0639";
    exposureColor = "#F59E0B";
  } else if (expScore > 35) {
    exposureEn = "Server exposure: Moderate";
    exposureAr = "\u062a\u0639\u0631\u0636 \u0627\u0644\u062e\u0627\u062f\u0645: \u0645\u062a\u0648\u0633\u0637";
    exposureColor = "#F59E0B";
  }

  const vis = visibilityStrings(result.observableCoverage.overall);
  const tv = threatVisuals(result.threatLevel);

  const finalUrl = str(result.meta.finalUrl);
  const ts = formatUtcTimestamp(result.meta.scanTimestamp);

  const verifyUrl =
    scanToken !== "-" ? `https://cyberguardianai.com/verify/${scanToken}` : "https://cyberguardianai.com";

  const tokenDisplay = scanToken !== "-" ? truncateDisplay(scanToken) : "-";
  const hmacDisplay =
    scanToken !== "-" ? truncateDisplay(scanToken) : truncateDisplay(str(result.deterministicHash));

  const verifyDisplayLine1 = "cyberguardianai.com/verify/";
  const verifyDisplayLine2 =
    scanToken !== "-"
      ? scanToken.length > 24
        ? `${scanToken.slice(0, 24)}...`
        : scanToken
      : "-";

  const overview = resolveOverviewSummary(result);

  return {
    domain: domainFromResult(result),
    finalUrl,
    grade: str(result.grade),
    score: safeNum(result.score, 0),
    maxScore: 95,
    visibilityEn: vis.en,
    visibilityAr: vis.ar,
    scanId,
    scanToken,
    tokenDisplay,
    timestampUtc: ts,
    hmacDisplay,
    verifyUrl,
    verifyDisplayLine1,
    verifyDisplayLine2,
    scoreRows,
    overviewSummaryEn: overview.en,
    overviewSummaryAr: overview.ar,
    attackLines,
    infraProviderEn: providerEn,
    infraProviderAr: providerAr,
    infraTlsLine,
    infraCdnEn,
    infraCdnAr,
    exposureEn,
    exposureAr,
    exposureColor,
    actionLines,
    compactPlanOnPage3: compact,
    compactPlanRows,
    planChunks,
    planPageSubtitlesEn,
    planPageSubtitlesAr,
    pdfPageCount,
    threatAccentColor: tv.accent,
    threatPillBg: tv.pillBg,
    threatPillText: tv.pillText,
    threatPillLabel: tv.label,
  };
}
