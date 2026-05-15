import { calculateCategoryScores } from "@/lib/categoryScores";
import { getFixTimeEstimate } from "@/lib/fixSnippets";
import { getLocalizedRemediation } from "@/lib/remediation";
import type { Finding, ScanResult } from "@/lib/types";
import {
  mapScanResult,
  type PdfExportMeta,
  type PdfReportData,
  type ScanResultForPdf,
} from "@/lib/pdf/phaseB/mapScanResult";
import { PDF_V2_SCORE_CATEGORY_AR_BY_ID, type DonutCounts } from "@/lib/pdf/v2/charts";
import { dark } from "@/lib/pdf/v2/constants";

const TRACKED_HEADERS = [
  "strict-transport-security",
  "content-security-policy",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
] as const;

const LRM = "\u200e";

function str(v: string | undefined | null): string {
  if (v === undefined || v === null) {
    return "-";
  }
  const t = String(v).trim();
  return t === "" ? "-" : t;
}

function wrapLatinDigitRunsWithLrm(s: string): string {
  return s.replace(/[0-9]+(?:[/.:][0-9]+)*/g, (chunk) => `${LRM}${chunk}${LRM}`);
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

function severityUpper(sev: Finding["severity"]): string {
  return sev.toUpperCase();
}

function findingCounts(findings: Finding[]): DonutCounts {
  let high = 0;
  let medium = 0;
  let low = 0;
  for (const f of findings) {
    const s = f.severity ?? "low";
    if (s === "critical" || s === "high") {
      high += 1;
    } else if (s === "medium") {
      medium += 1;
    } else {
      low += 1;
    }
  }
  return { high, medium, low };
}

function colorForCategory(c: "green" | "amber" | "red"): string {
  if (c === "green") {
    return dark.green;
  }
  if (c === "amber") {
    return dark.amber;
  }
  return dark.red;
}

export type PdfScoreBreakdownRowV2 = {
  labelEn: string;
  labelAr: string;
  score: number;
  maxScore: number;
  color: string;
};

export type PdfAttackSurfaceBarV2 = {
  label: string;
  value: string;
  color: string;
};

export type PdfIntelligenceV2 = {
  domain: string;
  reputation: string;
  suspiciousTld: string;
  phishingKeywords: string;
  urlEntropy: string;
  typosquatting: string;
  reputationVerdict: string;
  maliciousDetections: string;
  suspiciousDetections: string;
  reputationNote: string;
};

export type PdfFindingCardV2 = {
  severity: string;
  titleEn: string;
  titleAr: string;
  impactEn: string;
  impactAr: string;
  metaEn: string;
  metaAr: string;
  standardsEn: string;
  standardsAr: string;
};

export type PdfRecommendationCardV2 = {
  severity: string;
  titleEn: string;
  titleAr: string;
  whyEn: string;
  whyAr: string;
  metaEn: string;
  metaAr: string;
  fixEn: string;
  fixAr: string;
};

export type PdfScanMetaV2 = {
  scanId: string;
  generatedBy: string;
  scannerEngine: string;
  scanDuration: string;
  intelligenceEngine: string;
  timestamp: string;
  confidence: string;
  threatClassification: string;
  infraTrust: string;
};

export type PdfTlsInfraV2 = {
  tlsVersion: string;
  cipher: string;
  issuer: string;
  daysLeft: string;
  infrastructure: string;
  cdn: string;
  waf: string;
  cloudProvider: string;
  hostingProvider: string;
  asn: string;
  server: string;
};

export type PdfReportDataV2 = PdfReportData & {
  confidence: number;
  findingCounts: DonutCounts;
  scoreBreakdownRows: PdfScoreBreakdownRowV2[];
  attackSurfaceBars: PdfAttackSurfaceBarV2[];
  intelligenceV2: PdfIntelligenceV2;
  presentHeaders: string[];
  missingHeaders: string[];
  headersImpactEn: string;
  headersImpactAr: string;
  scanMeta: PdfScanMetaV2;
  tlsInfra: PdfTlsInfraV2;
  findingCards: PdfFindingCardV2[];
  recommendationCards: PdfRecommendationCardV2[];
  findingChunks: PdfFindingCardV2[][];
  recommendationChunks: PdfRecommendationCardV2[][];
  totalPages: number;
  threatDisplayEn: string;
  threatDisplayAr: string;
  methodologyItalicEn: string;
  methodologyItalicAr: string;
  methodologyBodyEn: string;
  methodologyBodyAr: string;
  infraTrustEn: string;
  infraTrustAr: string;
};

function headersLists(result: ScanResult): { present: string[]; missing: string[] } {
  const present: string[] = [];
  const missing: string[] = [];
  for (const h of TRACKED_HEADERS) {
    if (result.headers[h] === true) {
      present.push(h);
    } else {
      missing.push(h);
    }
  }
  return { present, missing };
}

function buildHeadersImpact(present: number, total: number): { en: string; ar: string } {
  const m = total - present;
  if (m <= 0) {
    return {
      en: "Security headers meet baseline expectations for browser-side protections.",
      ar: "\u0631\u0624\u0648\u0633 \u0627\u0644\u0623\u0645\u0627\u0646 \u062a\u0633\u062a\u0648\u0641\u064a \u0627\u0644\u0642\u0627\u0639\u062f\u0629 \u0644\u062d\u0645\u0627\u064a\u0627\u062a \u0627\u0644\u0645\u062a\u0635\u0641\u062d.",
    };
  }
  return {
    en: `${m} tracked header${m > 1 ? "s" : ""} missing — increases XSS, clickjacking, and MIME-sniffing risk for visitors.`,
    ar: `${LRM}${m}${LRM} \u0631\u0623\u0633 \u0623\u0645\u0627\u0646 \u0645\u062a\u062a\u0628\u0639 \u0645\u0641\u0642\u0648\u062f \u2014 \u064a\u0632\u064a\u062f \u0645\u062e\u0627\u0637\u0631 XSS \u0648\u0627\u0644\u0636\u063a\u0637 \u0639\u0644\u0649 \u0625\u0637\u0627\u0631\u0627\u062a \u0627\u0644\u0632\u0648\u0627\u0631.`,
  };
}

function mapFindingCards(result: ScanResult): PdfFindingCardV2[] {
  const findings = Array.isArray(result.findings) ? result.findings : [];
  const out: PdfFindingCardV2[] = [];
  for (const f of findings) {
    const sev = f.severity ?? "low";
    const id = f.id;
    let standardsEn = "-";
    let standardsAr = "-";
    let exploit = "-";
    let surface = "-";
    let complexity = "-";
    let time = "-";
    if (id !== undefined) {
      const locEn = getLocalizedRemediation(id, "en");
      const locAr = getLocalizedRemediation(id, "ar");
      if (locEn !== undefined) {
        standardsEn = str(locEn.recommendation).slice(0, 220);
        exploit = str(locEn.severityReason).slice(0, 80);
        surface = str(locEn.category);
        complexity = str(locEn.difficulty);
        time = str(locEn.estimatedFixTime);
      }
      if (locAr !== undefined) {
        standardsAr = wrapLatinDigitRunsWithLrm(str(locAr.recommendation).slice(0, 220));
        if (exploit === "-") {
          exploit = wrapLatinDigitRunsWithLrm(str(locAr.severityReason).slice(0, 80));
        }
      }
      if (time === "-") {
        time = str(getFixTimeEstimate(id) ?? "-");
      }
    }
    const impactEn = f.impact !== undefined ? str(f.impact.en) : str(f.message?.en);
    const impactAr =
      f.impact !== undefined ? wrapLatinDigitRunsWithLrm(str(f.impact.ar)) : wrapLatinDigitRunsWithLrm(str(f.message?.ar));
    out.push({
      severity: severityUpper(sev),
      titleEn: str(f.message?.en),
      titleAr: wrapLatinDigitRunsWithLrm(str(f.message?.ar)),
      impactEn: impactEn.slice(0, 400),
      impactAr: impactAr.slice(0, 400),
      metaEn: `Exploit ${exploit} · Surface ${surface} · Complexity ${complexity} · Time ${time}`,
      metaAr: `Exploit ${exploit} · Surface ${surface} · Complexity ${complexity} · Time ${time}`,
      standardsEn,
      standardsAr,
    });
  }
  return out;
}

function mapRecommendationCards(result: ScanResult): PdfRecommendationCardV2[] {
  const findings = Array.isArray(result.findings) ? result.findings : [];
  const out: PdfRecommendationCardV2[] = [];
  let n = 0;
  for (const f of findings) {
    n += 1;
    const sev = f.severity ?? "low";
    const id = f.id;
    const titleEn = str(f.message?.en);
    const titleAr = wrapLatinDigitRunsWithLrm(str(f.message?.ar));
    let whyEn = str(f.impact?.en);
    let whyAr = wrapLatinDigitRunsWithLrm(str(f.impact?.ar));
    let impact = "-";
    let likelihood = "-";
    let surface = "-";
    let complexity = "-";
    let time = "-";
    let standardsEn = "-";
    let standardsAr = "-";
    if (id !== undefined) {
      const locEn = getLocalizedRemediation(id, "en");
      const locAr = getLocalizedRemediation(id, "ar");
      if (locEn !== undefined) {
        if (whyEn === "-") {
          whyEn = str(locEn.businessImpact).slice(0, 360);
        }
        impact = str(locEn.businessImpact).slice(0, 120);
        likelihood = str(locEn.severityReason).slice(0, 120);
        surface = str(locEn.category);
        complexity = str(locEn.difficulty);
        time = str(locEn.estimatedFixTime);
        standardsEn = str(locEn.recommendation).slice(0, 200);
      }
      if (locAr !== undefined) {
        if (whyAr === "-") {
          whyAr = wrapLatinDigitRunsWithLrm(str(locAr.businessImpact).slice(0, 360));
        }
        standardsAr = wrapLatinDigitRunsWithLrm(str(locAr.recommendation).slice(0, 200));
      }
      if (time === "-") {
        time = str(getFixTimeEstimate(id) ?? "-");
      }
    }
    if (whyEn === "-") {
      whyEn = str(f.remediation?.en).slice(0, 360);
    }
    if (whyAr === "-") {
      whyAr = wrapLatinDigitRunsWithLrm(str(f.remediation?.ar).slice(0, 360));
    }
    out.push({
      severity: severityUpper(sev),
      titleEn: `${n}. ${titleEn}`,
      titleAr: `${LRM}${n}.${LRM} ${titleAr}`,
      whyEn: whyEn.slice(0, 400),
      whyAr: whyAr.slice(0, 400),
      metaEn: `Impact ${impact} · Likelihood ${likelihood} · Surface ${surface}`,
      metaAr: `Impact ${impact} · Likelihood ${likelihood} · Surface ${surface}`,
      fixEn: `Complexity ${complexity} · Time ${time} · Standards ${standardsEn}`,
      fixAr: `Complexity ${complexity} · Time ${time} · Standards ${standardsAr}`,
    });
  }
  return out;
}

export function mapScanResultToV2(input: ScanResultForPdf, result: ScanResult): PdfReportDataV2 {
  const base = mapScanResult(input);
  const { present, missing } = headersLists(result);
  const hi = buildHeadersImpact(present.length, TRACKED_HEADERS.length);
  const findings = Array.isArray(result.findings) ? result.findings : [];
  const fc = findingCounts(findings);
  const findingCards = mapFindingCards(result);
  const recommendationCards = mapRecommendationCards(result);

  let scoreBreakdownRows: PdfScoreBreakdownRowV2[] = [];
  try {
    const cats = calculateCategoryScores(result);
    scoreBreakdownRows = cats.map((c) => ({
      labelEn: c.labelEn,
      labelAr: PDF_V2_SCORE_CATEGORY_AR_BY_ID[c.id] ?? c.labelAr,
      score: c.score,
      maxScore: 100,
      color: colorForCategory(c.color),
    }));
  } catch {
    scoreBreakdownRows = [];
  }

  const headerRow = scoreBreakdownRows.find((r) => r.labelEn.includes("Security Headers")) ?? scoreBreakdownRows[1];
  const tlsRow = scoreBreakdownRows.find((r) => r.labelEn.includes("TLS")) ?? scoreBreakdownRows[0];
  const domainRow = scoreBreakdownRows.find((r) => r.labelEn.includes("Domain")) ?? scoreBreakdownRows[3];
  const infraRow = scoreBreakdownRows.find((r) => r.labelEn.includes("Infrastructure")) ?? scoreBreakdownRows[2];

  const attackSurfaceBars: PdfAttackSurfaceBarV2[] = [
    {
      label: "Header coverage",
      value: `${Math.round(headerRow?.score ?? 0)}%`,
      color: "#06B6D4",
    },
    {
      label: "Browser security",
      value: `${Math.round(tlsRow?.score ?? 0)}%`,
      color: "#F59E0B",
    },
    {
      label: "Domain trust",
      value: `${Math.round(domainRow?.score ?? 0)}%`,
      color: "#8B5CF6",
    },
    {
      label: "Infrastructure exposure",
      value: `${Math.round(infraRow?.score ?? 0)}%`,
      color: "#10B981",
    },
  ];

  const rep = result.reputation;
  const intel = result.intelligence;
  const pk = Array.isArray(intel.phishingKeywords) ? intel.phishingKeywords.join(", ") : "";
  const intelligenceV2: PdfIntelligenceV2 = {
    domain: str(intel.domain),
    reputation: str(intel.reputation),
    suspiciousTld: intel.suspiciousTld ? "Yes" : "No",
    phishingKeywords: pk === "" ? "-" : pk.slice(0, 120),
    urlEntropy: Number.isFinite(intel.entropy) ? intel.entropy.toFixed(2) : "-",
    typosquatting: intel.typosquatting ? "Detected" : "Not detected",
    reputationVerdict: rep !== null ? str(rep.verdict) : "-",
    maliciousDetections: rep !== null ? String(rep.malicious) : "-",
    suspiciousDetections: rep !== null ? String(rep.suspicious) : "-",
    reputationNote:
      rep !== null
        ? `Vendors ${rep.totalVendors} · Harmless ${rep.harmless} · Undetected ${rep.undetected}`
        : "-",
  };

  const scanMeta: PdfScanMetaV2 = {
    scanId: base.scanId,
    generatedBy: "CyberGurdian AI",
    scannerEngine: "CyberGurdian V1.6",
    scanDuration: `${result.meta.responseTime} ms`,
    intelligenceEngine: "Claude + deterministic engines",
    timestamp: base.timestampUtc,
    confidence: "95",
    threatClassification: str(result.threatLevel).toUpperCase(),
    infraTrust: base.exposureEn.replace("exposure-:", "exposure:"),
  };

  function totalFor(findC: number, recC: number): number {
    const fp = findingCards.length === 0 ? 1 : Math.ceil(findingCards.length / findC);
    const rp = recommendationCards.length === 0 ? 1 : Math.ceil(recommendationCards.length / recC);
    return 3 + fp + rp;
  }

  let findChunk = 3;
  let recChunk = 2;
  for (let c = 1; c <= 80; c += 1) {
    if (totalFor(c, recChunk) <= 6) {
      findChunk = c;
    }
  }
  for (let c = 1; c <= 40; c += 1) {
    if (totalFor(findChunk, c) <= 6) {
      recChunk = c;
    }
  }

  const fChunks =
    findingCards.length === 0 ? [[] as PdfFindingCardV2[]] : chunkArray(findingCards, findChunk);
  const rChunks =
    recommendationCards.length === 0
      ? [[] as PdfRecommendationCardV2[]]
      : chunkArray(recommendationCards, recChunk);

  const totalPages = 1 + fChunks.length + 1 + rChunks.length + 1;

  const threatDisplayEn =
    result.threatLevel === "critical"
      ? "CRITICAL THREAT"
      : result.threatLevel === "high"
        ? "HIGH THREAT"
        : result.threatLevel === "medium"
          ? "MEDIUM THREAT"
          : "LOW THREAT";
  const threatDisplayAr =
    result.threatLevel === "critical"
      ? "\u062a\u0647\u062f\u064a\u062f \u062d\u0631\u062c\u064a"
      : result.threatLevel === "high"
        ? "\u062a\u0647\u062f\u064a\u062f \u0639\u0627\u0644\u064a"
        : result.threatLevel === "medium"
          ? "\u062a\u0647\u062f\u064a\u062f \u0645\u062a\u0648\u0633\u0637"
          : "\u062a\u0647\u062f\u064a\u062f \u0645\u0646\u062e\u0641\u0636";

  const tlsInfra: PdfTlsInfraV2 = {
    tlsVersion: str(result.ssl.protocol),
    cipher: str(result.ssl.cipher),
    issuer: str(result.ssl.issuer),
    daysLeft: String(result.ssl.daysLeft),
    infrastructure: base.infraProviderEn,
    cdn: str(result.infrastructure.cdn),
    waf: str(result.infrastructure.waf),
    cloudProvider: str(result.infrastructure.cloudProvider),
    hostingProvider: str(result.infrastructure.hostingProvider),
    asn: str(result.infrastructure.asn),
    server: str(result.meta.server),
  };

  return {
    ...base,
    confidence: 95,
    findingCounts: fc,
    scoreBreakdownRows,
    attackSurfaceBars,
    intelligenceV2,
    presentHeaders: present,
    missingHeaders: missing,
    headersImpactEn: hi.en,
    headersImpactAr: hi.ar,
    scanMeta,
    tlsInfra,
    findingCards,
    recommendationCards,
    findingChunks: fChunks,
    recommendationChunks: rChunks,
    totalPages,
    threatDisplayEn,
    threatDisplayAr,
    methodologyItalicEn: "Methodology",
    methodologyItalicAr: "\u0645\u0646\u0647\u062c\u064a\u0629 \u0627\u0644\u0641\u062d\u0635",
    methodologyBodyEn:
      "This report combines passive TLS, HTTP header, infrastructure fingerprinting, and reputation signals. AI narrative is advisory and must be validated against your internal security controls.",
    methodologyBodyAr:
      "\u064a\u062f\u0645\u062c \u0647\u0630\u0627 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0628\u064a\u0646 TLS \u0627\u0644\u0633\u0644\u0628\u064a \u0648\u0631\u0624\u0648\u0633 HTTP \u0648\u0628\u0635\u0645\u0627\u062a \u0627\u0644\u0628\u0646\u064a\u0629 \u0627\u0644\u062a\u062d\u062a\u064a\u0629 \u0648\u0625\u0634\u0627\u0631\u0627\u062a \u0627\u0644\u0633\u0645\u0639\u0629. \u0627\u0644\u0646\u0635 \u0627\u0644\u0630\u0643\u0627\u0621\u064a \u0627\u0633\u062a\u0634\u0627\u0631\u064a \u0648\u064a\u062c\u0628 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0636\u0648\u0627\u0628\u0637 \u0627\u0644\u0623\u0645\u0627\u0646 \u0627\u0644\u062f\u0627\u062e\u0644\u064a\u0629.",
    infraTrustEn: base.exposureEn.replace("exposure-:", "exposure:"),
    infraTrustAr: base.exposureAr.replace("exposure-:", "exposure:"),
  };
}

export function buildPdfReportDataV2(result: ScanResult, meta?: PdfExportMeta): PdfReportDataV2 {
  const merged: ScanResultForPdf =
    meta !== undefined
      ? { ...result, pdfScanId: meta.scanId, pdfScanToken: meta.scanToken }
      : result;
  return mapScanResultToV2(merged, result);
}

export type { PdfExportMeta };
