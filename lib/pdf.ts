import type { Language, Translations } from "@/lib/i18n";
import type { AIExplanation, Finding, ScanResult } from "@/lib/types";

type PdfOptions = {
  result: ScanResult;
  explanation: AIExplanation | null;
  language: Language;
  t: Translations;
};

type PdfPage = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  y: number;
  currentY: number;
  pageHeight: number;
  margins: number;
  sectionSpacing: number;
  addPage: () => PdfPage;
  ensureSpace: (height: number) => PdfPage;
  measureWrappedText: (
    text: string,
    maxWidth: number,
    size: number,
    weight: number,
  ) => number;
};

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const MARGIN = 64;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CARD_RADIUS = 24;
const COMPACT_GAP = 16;
const SCANNER_ENGINE_VERSION = "v1.4";
const INTELLIGENCE_ENGINE_VERSION = "v1.4";
const PDF_METADATA_TITLE = "CyberGuardian Security Report";

type Severity = "critical" | "high" | "medium" | "low" | "informational";

type RemediationItem = {
  severity: Severity;
  title: string;
  why: string;
  impact: string;
  likelihood: string;
  attackSurface: string;
  complexity: string;
  time: string;
  standards: string[];
};

function sanitize(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function getThreatColor(threatLevel: string) {
  if (threatLevel === "low") {
    return "#34d399";
  }

  if (threatLevel === "medium") {
    return "#fbbf24";
  }

  return "#f87171";
}

function getSeverityColor(severity: string) {
  if (severity === "critical") {
    return "#dc2626";
  }

  if (severity === "high") {
    return "#ef4444";
  }

  if (severity === "medium") {
    return "#f59e0b";
  }

  return "#22d3ee";
}

function getInfrastructureTrustLabel(result: ScanResult, t: Translations) {
  if (result.threatLevel === "critical" || result.threatLevel === "high") {
    return t.lowInfrastructureTrust;
  }

  if (
    result.intelligence.reputation === "trusted" &&
    result.ssl.valid &&
    result.confidence >= 80
  ) {
    return t.highInfrastructureTrust;
  }

  return t.moderateInfrastructureTrust;
}

function getThreatLabel(threatLevel: string, t: Translations) {
  if (threatLevel === "low") {
    return t.lowThreat;
  }

  if (threatLevel === "medium") {
    return t.mediumThreat;
  }

  return t.highThreat;
}

function getThreatDetected(threatLevel: string, t: Translations) {
  if (threatLevel === "low") {
    return t.lowThreatDetected;
  }

  if (threatLevel === "medium") {
    return t.mediumThreatDetected;
  }

  return t.highThreatDetected;
}

function getReputationPdfRows(result: ScanResult, language: Language) {
  const reputation = result.reputation;
  const note =
    language === "ar"
      ? "نتائج السمعة هي إشارات استخباراتية وليست حكمًا نهائيًا."
      : "Reputation results are intelligence signals, not deterministic proof.";

  if (!reputation) {
    return [
      [
        language === "ar" ? "سمعة VirusTotal" : "VirusTotal reputation",
        language === "ar" ? "غير متاح" : "Unavailable",
      ],
      [language === "ar" ? "ملاحظة السمعة" : "Reputation note", note],
    ] satisfies Array<[string, string]>;
  }

  return [
    [
      language === "ar" ? "حكم السمعة" : "Reputation verdict",
      reputation.verdict,
    ],
    [
      language === "ar" ? "المؤشرات الخبيثة" : "Malicious detections",
      `${reputation.malicious}/${reputation.totalVendors}`,
    ],
    [
      language === "ar" ? "المؤشرات المشبوهة" : "Suspicious detections",
      `${reputation.suspicious}/${reputation.totalVendors}`,
    ],
    [language === "ar" ? "ملاحظة السمعة" : "Reputation note", note],
  ] satisfies Array<[string, string]>;
}

function getExplanation(options: PdfOptions) {
  return options.explanation?.[options.language];
}

function createPage(language: Language): PdfPage {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_WIDTH;
  canvas.height = PAGE_HEIGHT;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("canvas_context_unavailable");
  }

  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  ctx.direction = language === "ar" ? "rtl" : "ltr";
  ctx.textBaseline = "top";

  const page = {
    canvas,
    ctx,
    y: MARGIN,
    currentY: MARGIN,
    pageHeight: PAGE_HEIGHT,
    margins: MARGIN,
    sectionSpacing: 20,
    addPage: () => createPage(language),
    ensureSpace: (height: number) => {
      if (page.y + height > PAGE_HEIGHT - MARGIN) {
        return createPage(language);
      }

      return page;
    },
    measureWrappedText: (
      text: string,
      maxWidth: number,
      size: number,
      weight: number,
    ) => {
      setFont(ctx, size, weight, language);
      return wrapText(ctx, text, maxWidth).length * size * (language === "ar" ? 1.55 : 1.32);
    },
  };

  return page;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = CARD_RADIUS,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function fillCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  borderColor = "#1e3a5f",
) {
  roundedRect(ctx, x, y, width, height);
  ctx.fillStyle = "#0f172a";
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function setFont(
  ctx: CanvasRenderingContext2D,
  size: number,
  weight: number,
  language: Language,
) {
  const family =
    language === "ar"
      ? "Cairo, Inter, Arial, sans-serif"
      : "Inter, Cairo, Arial, sans-serif";
  ctx.font = `${weight} ${size}px ${family}`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const words = sanitize(text).split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;

    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) {
    lines.push(line);
  }

  return lines;
}

function drawText(
  page: PdfPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  options: {
    size?: number;
    weight?: number;
    color?: string;
    lineHeight?: number;
    language: Language;
    align?: CanvasTextAlign;
  },
) {
  const {
    size = 28,
    weight = 400,
    color = "#cbd5e1",
    lineHeight = size * 1.45,
    language,
    align = language === "ar" ? "right" : "left",
  } = options;

  const { ctx } = page;
  const direction = language === "ar" ? "rtl" : "ltr";
  const drawX =
    align === "right"
      ? x + maxWidth
      : align === "center"
        ? x + maxWidth / 2
        : x;

  ctx.save();
  setFont(ctx, size, weight, language);
  ctx.textAlign = align;
  ctx.direction = direction;
  ctx.textBaseline = "top";

  const lines = wrapText(ctx, text, maxWidth);

  lines.forEach((line, index) => {
    // Canvas state is mutable; set text color immediately before every draw.
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.direction = direction;
    ctx.fillText(line, drawX, y + index * lineHeight, maxWidth);
  });

  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.restore();

  return lines.length * lineHeight;
}

function drawSectionTitle(
  page: PdfPage,
  title: string,
  language: Language,
  accent = "#22d3ee",
) {
  const { ctx } = page;
  ctx.fillStyle = accent;
  roundedRect(ctx, MARGIN, page.y, 10, 36, 5);
  ctx.fill();
  drawText(page, title, MARGIN + 24, page.y - 1, CONTENT_WIDTH - 24, {
    size: 27,
    weight: 800,
    color: "#f8fafc",
    language,
  });
  page.y += 52;
}

function drawSeverityBadge(
  page: PdfPage,
  severity: string,
  x: number,
  y: number,
  language: Language,
) {
  const color = getSeverityColor(severity);
  const width = 138;
  const height = 36;

  roundedRect(page.ctx, x, y, width, height, 18);
  page.ctx.fillStyle = `${color}22`;
  page.ctx.fill();
  page.ctx.strokeStyle = color;
  page.ctx.lineWidth = 2;
  page.ctx.stroke();
  drawText(page, severity.toUpperCase(), x + 16, y + 8, width - 32, {
    size: 15,
    weight: 900,
    color,
    language,
    align: "center",
    lineHeight: 18,
  });
}

function ensureSpace(pages: PdfPage[], language: Language, needed: number) {
  let page = pages[pages.length - 1];

  if (page.y + needed > PAGE_HEIGHT - MARGIN) {
    page = createPage(language);
    pages.push(page);
  }

  return page;
}

function drawKeyValueGrid(
  pages: PdfPage[],
  language: Language,
  rows: Array<[string, string]>,
) {
  let page = ensureSpace(pages, language, 180);
  const columnGap = COMPACT_GAP;
  const columnWidth = (CONTENT_WIDTH - columnGap) / 2;
  const rowGap = COMPACT_GAP;
  let rowHeight = 0;
  let rowStartY = page.y;

  rows.forEach(([label, value], index) => {
    const innerWidth = columnWidth - 40;
    const labelHeight = page.measureWrappedText(label, innerWidth, 15, 700);
    const valueHeight = page.measureWrappedText(value, innerWidth, 19, 700);
    const cardHeight = Math.max(82, 38 + labelHeight + valueHeight);
    page = ensureSpace(pages, language, cardHeight + rowGap);
    const column = index % 2;
    if (column === 0) {
      rowStartY = page.y;
      rowHeight = cardHeight;
    } else {
      rowHeight = Math.max(rowHeight, cardHeight);
    }
    const x = MARGIN + column * (columnWidth + columnGap);
    const y = rowStartY;

    fillCard(page.ctx, x, y, columnWidth, cardHeight, "#1e3a5f");
    drawText(page, label, x + 20, y + 16, innerWidth, {
      size: 15,
      weight: 700,
      color: "#67e8f9",
      language,
    });
    drawText(page, value, x + 20, y + 24 + labelHeight, innerWidth, {
      size: 19,
      weight: 700,
      color: "#f8fafc",
      language,
      lineHeight: language === "ar" ? 28 : 24,
    });

    if (column === 1 || index === rows.length - 1) {
      page.y = rowStartY + rowHeight + rowGap;
      page.currentY = page.y;
    }
  });
}

function drawCompactMetadataRows(
  pages: PdfPage[],
  language: Language,
  rows: Array<[string, string]>,
  columns = 4,
) {
  let page = ensureSpace(pages, language, 130);
  const gap = 12;
  const columnWidth = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
  const innerWidth = columnWidth - 28;
  const rowGap = 12;
  let rowHeight = 0;
  let rowStartY = page.y;

  rows.forEach(([label, value], index) => {
    const column = index % columns;
    const labelHeight = page.measureWrappedText(label, innerWidth, 13, 700);
    const valueHeight = page.measureWrappedText(value, innerWidth, 17, 800);
    const cardHeight = Math.max(72, 32 + labelHeight + valueHeight);

    page = ensureSpace(pages, language, cardHeight + rowGap);

    if (column === 0) {
      rowStartY = page.y;
      rowHeight = cardHeight;
    } else {
      rowHeight = Math.max(rowHeight, cardHeight);
    }

    const x = MARGIN + column * (columnWidth + gap);
    const y = rowStartY;

    fillCard(page.ctx, x, y, columnWidth, cardHeight, "#1e3a5f");
    drawText(page, label, x + 14, y + 12, innerWidth, {
      size: 13,
      weight: 700,
      color: "#67e8f9",
      language,
      lineHeight: 16,
    });
    drawText(page, value, x + 14, y + 26 + labelHeight, innerWidth, {
      size: 17,
      weight: 800,
      color: "#f8fafc",
      language,
      lineHeight: language === "ar" ? 24 : 21,
    });

    if (column === columns - 1 || index === rows.length - 1) {
      page.y = rowStartY + rowHeight + rowGap;
      page.currentY = page.y;
    }
  });
}

function drawGauge(
  page: PdfPage,
  x: number,
  y: number,
  value: number,
  label: string,
  color: string,
  language: Language,
) {
  const cardSize = 240;
  const radius = 84;
  const centerX = x + cardSize / 2;
  const centerY = y + 118;
  const start = Math.PI * 0.8;
  const end = Math.PI * 2.2;
  const progress = start + (end - start) * Math.max(0, Math.min(100, value)) / 100;

  fillCard(page.ctx, x, y, cardSize, cardSize, color);
  page.ctx.lineCap = "round";
  page.ctx.lineWidth = 18;
  page.ctx.strokeStyle = "#1e293b";
  page.ctx.beginPath();
  page.ctx.arc(centerX, centerY, radius, start, end);
  page.ctx.stroke();
  page.ctx.strokeStyle = color;
  page.ctx.beginPath();
  page.ctx.arc(centerX, centerY, radius, start, progress);
  page.ctx.stroke();
  page.ctx.lineCap = "butt";
  drawText(page, `${value}%`, x + 30, y + 78, cardSize - 60, {
    size: 38,
    weight: 900,
    color: "#f8fafc",
    language,
    align: "center",
  });
  drawText(page, label, x + 24, y + 160, cardSize - 48, {
    size: 16,
    weight: 700,
    color: "#cbd5e1",
    language,
    align: "center",
    lineHeight: 21,
  });
}

function drawBarChart(
  page: PdfPage,
  x: number,
  y: number,
  width: number,
  title: string,
  rows: Array<{ label: string; value: number; color: string }>,
  language: Language,
) {
  const height = 78 + rows.length * 50;

  fillCard(page.ctx, x, y, width, height, "#1e3a5f");
  drawText(page, title, x + 24, y + 20, width - 48, {
    size: 22,
    weight: 900,
    color: "#f8fafc",
    language,
  });

  rows.forEach((row, index) => {
    const rowY = y + 64 + index * 50;
    drawText(page, row.label, x + 24, rowY, width - 48, {
      size: 15,
      weight: 700,
      color: "#cbd5e1",
      language,
      lineHeight: 22,
    });
    page.ctx.fillStyle = "#1e293b";
    roundedRect(page.ctx, x + 24, rowY + 24, width - 92, 12, 6);
    page.ctx.fill();
    page.ctx.fillStyle = row.color;
    roundedRect(
      page.ctx,
      x + 24,
      rowY + 24,
      Math.max(8, (width - 92) * Math.min(100, row.value) / 100),
      12,
      6,
    );
    page.ctx.fill();
    drawText(page, `${row.value}%`, x + width - 58, rowY + 16, 38, {
      size: 15,
      weight: 800,
      color: row.color,
      language,
      align: "right",
    });
  });
}

function drawDonutChart(
  page: PdfPage,
  x: number,
  y: number,
  title: string,
  segments: Array<{ label: string; value: number; color: string }>,
  language: Language,
) {
  fillCard(page.ctx, x, y, 340, 260, "#1e3a5f");
  drawText(page, title, x + 24, y + 18, 292, {
    size: 21,
    weight: 900,
    color: "#f8fafc",
    language,
  });

  const total = Math.max(1, segments.reduce((sum, segment) => sum + segment.value, 0));
  let angle = -Math.PI / 2;
  const centerX = x + 108;
  const centerY = y + 152;

  segments.forEach((segment) => {
    const slice = (segment.value / total) * Math.PI * 2;
    page.ctx.beginPath();
    page.ctx.moveTo(centerX, centerY);
    page.ctx.fillStyle = segment.color;
    page.ctx.arc(centerX, centerY, 68, angle, angle + slice);
    page.ctx.closePath();
    page.ctx.fill();
    angle += slice;
  });

  page.ctx.fillStyle = "#0f172a";
  page.ctx.beginPath();
  page.ctx.arc(centerX, centerY, 38, 0, Math.PI * 2);
  page.ctx.fill();

  segments.forEach((segment, index) => {
    const legendY = y + 92 + index * 36;
    page.ctx.fillStyle = segment.color;
    roundedRect(page.ctx, x + 204, legendY + 4, 16, 16, 5);
    page.ctx.fill();
    drawText(page, `${segment.label}: ${segment.value}`, x + 228, legendY, 88, {
      size: 14,
      weight: 700,
      color: "#cbd5e1",
      language,
      lineHeight: 20,
    });
  });
}

function drawParagraphCard(
  pages: PdfPage[],
  language: Language,
  title: string,
  body: string,
  accent = "#22d3ee",
) {
  let page = ensureSpace(pages, language, 150);
  const innerWidth = CONTENT_WIDTH - 52;
  const titleHeight = page.measureWrappedText(title, innerWidth, 21, 800);
  const bodyLines = wrapText(page.ctx, body, innerWidth);
  const bodyLineHeight = language === "ar" ? 32 : 27;
  const height = Math.max(128, 58 + titleHeight + bodyLines.length * bodyLineHeight);

  page = ensureSpace(pages, language, height + COMPACT_GAP);
  fillCard(page.ctx, MARGIN, page.y, CONTENT_WIDTH, height, "#1e3a5f");
  drawText(page, title, MARGIN + 26, page.y + 20, innerWidth, {
    size: 21,
    weight: 800,
    color: accent,
    language,
  });
  drawText(page, body, MARGIN + 26, page.y + 36 + titleHeight, innerWidth, {
    size: 19,
    weight: 400,
    color: "#dbeafe",
    language,
    lineHeight: bodyLineHeight,
  });
  page.y += height + COMPACT_GAP;
  page.currentY = page.y;
}

function buildComplianceMap(issue: string) {
  const normalized = issue.toLowerCase();
  const standards = new Set<string>();

  if (
    normalized.includes("header") ||
    normalized.includes("content-security-policy") ||
    normalized.includes("x-frame-options")
  ) {
    standards.add("OWASP A05:2021");
    standards.add("OWASP ASVS V14");
    standards.add("CIS Control 4");
  }

  if (normalized.includes("tls") || normalized.includes("certificate")) {
    standards.add("OWASP ASVS V9");
    standards.add("NIST SC-13");
    standards.add("ISO 27001 A.8.24");
  }

  if (
    normalized.includes("domain") ||
    normalized.includes("phishing") ||
    normalized.includes("typosquatting")
  ) {
    standards.add("OWASP A06:2021");
    standards.add("CIS Control 9");
  }

  if (normalized.includes("redirect")) {
    standards.add("OWASP A01:2021");
    standards.add("CIS Control 16");
  }

  if (standards.size === 0) {
    standards.add("NIST RA-5");
    standards.add("ISO 27001 A.8.8");
  }

  return Array.from(standards);
}

function recommendationText(
  language: Language,
  en: string,
  ar: string,
) {
  return language === "ar" ? ar : en;
}

function buildRemediationItems(
  result: ScanResult,
  language: Language,
  t: Translations,
): RemediationItem[] {
  const items: RemediationItem[] = [];
  const missingHeaders = Object.entries(result.headers)
    .filter(([, present]) => !present)
    .map(([header]) => header);

  function add(item: Omit<RemediationItem, "standards"> & { standards?: string[] }) {
    items.push({
      ...item,
      standards: item.standards ?? buildComplianceMap(item.title),
    });
  }

  if (missingHeaders.includes("strict-transport-security")) {
    add({
      severity: "high",
      title: "Enable Strict-Transport-Security immediately",
      why: recommendationText(
        language,
        "Transport-security enforcement reduces downgrade and interception risk on hostile or public networks.",
        "يساعد فرض Strict-Transport-Security على تقليل مخاطر خفض مستوى الاتصال والاعتراض على الشبكات العامة أو العدائية.",
      ),
      impact: "High",
      likelihood: "Medium",
      attackSurface: t.transportSecurity,
      complexity: t.easy,
      time: t.fiveMinutes,
      standards: ["OWASP ASVS V9", "NIST SC-13", "CIS Control 4"],
    });
  }

  if (missingHeaders.includes("content-security-policy")) {
    add({
      severity: "high",
      title: "Add Content-Security-Policy",
      why: recommendationText(
        language,
        "CSP limits script execution paths and reduces the impact of client-side injection conditions.",
        "يساعد CSP على تقليل مسارات تنفيذ السكربت والحد من أثر ظروف الحقن من جهة العميل.",
      ),
      impact: "High",
      likelihood: "Medium",
      attackSurface: t.browserSecurity,
      complexity: t.moderate,
      time: t.twoHours,
      standards: ["OWASP A05:2021", "OWASP ASVS V14", "CIS Control 4"],
    });
  }

  if (missingHeaders.includes("x-frame-options")) {
    add({
      severity: "medium",
      title: "Enforce anti-clickjacking protection",
      why: recommendationText(
        language,
        "X-Frame-Options reduces framing abuse and clickjacking opportunities for sensitive workflows.",
        "يساعد X-Frame-Options على تقليل إساءة تضمين الصفحات وفرص Clickjacking في التدفقات الحساسة.",
      ),
      impact: "Medium",
      likelihood: "Medium",
      attackSurface: t.browserSecurity,
      complexity: t.easy,
      time: t.fiveMinutes,
      standards: ["OWASP ASVS V14", "CIS Control 4"],
    });
  }

  if (!result.ssl.valid || result.ssl.weakProtocol || result.ssl.weakCipher) {
    add({
      severity: "high",
      title: "Harden TLS configuration",
      why: recommendationText(
        language,
        "Weak or invalid TLS posture can undermine confidentiality and trust during transport.",
        "قد تؤدي وضعية TLS الضعيفة أو غير الصالحة إلى إضعاف السرية والثقة أثناء النقل.",
      ),
      impact: "High",
      likelihood: "Medium",
      attackSurface: t.transportSecurity,
      complexity: t.moderate,
      time: t.thirtyMinutes,
      standards: ["OWASP ASVS V9", "NIST SC-13", "ISO 27001 A.8.24"],
    });
  }

  if (result.intelligence.reputation === "suspicious") {
    add({
      severity: "high",
      title: "Investigate Domain trust indicators",
      why: recommendationText(
        language,
        "Suspicious Domain traits can indicate phishing infrastructure, deceptive branding, or low-trust hosting patterns.",
        "قد تشير خصائص Domain المشبوهة إلى Infrastructure تصيد أو انتحال علامة أو أنماط استضافة منخفضة الثقة.",
      ),
      impact: "High",
      likelihood: "Medium",
      attackSurface: t.domainTrust,
      complexity: t.advanced,
      time: t.oneDay,
      standards: ["OWASP A06:2021", "CIS Control 9", "NIST RA-5"],
    });
  }

  if (result.redirects.suspicious) {
    add({
      severity: "medium",
      title: "Review Redirects and cross-Domain flows",
      why: recommendationText(
        language,
        "Unexpected Redirects can route users through lower-trust infrastructure or hide final destinations.",
        "قد توجه Redirects غير المتوقعة المستخدمين عبر Infrastructure أقل ثقة أو تخفي الوجهات النهائية.",
      ),
      impact: "Medium",
      likelihood: "Medium",
      attackSurface: t.redirectsSurface,
      complexity: t.moderate,
      time: t.thirtyMinutes,
      standards: ["OWASP A01:2021", "CIS Control 16"],
    });
  }

  if (result.technologies.length > 0 || result.meta.server) {
    add({
      severity: "low",
      title: "Reduce Infrastructure fingerprint exposure",
      why: recommendationText(
        language,
        "Visible platform and server metadata helps attackers tune reconnaissance and technology-specific probing.",
        "تساعد بيانات المنصة وServer الظاهرة المهاجمين على تحسين الاستطلاع والفحص المخصص للتقنيات.",
      ),
      impact: "Low",
      likelihood: "Medium",
      attackSurface: t.metadataExposure,
      complexity: t.easy,
      time: t.fiveMinutes,
      standards: ["CIS Control 4", "NIST CM-7"],
    });
  }

  result.findings.slice(0, 4).forEach((finding) => {
    if (items.some((item) => finding.message.en.toLowerCase().includes(item.title.toLowerCase().slice(0, 12)))) {
      return;
    }

    add({
      severity: finding.severity,
      title: finding.message.en,
      why: finding.message[language],
      impact: finding.severity === "high" ? "High" : finding.severity === "medium" ? "Medium" : "Low",
      likelihood: finding.severity === "high" ? "Medium" : "Low",
      attackSurface: t.pdfAttackSurface,
      complexity: finding.severity === "high" ? t.moderate : t.easy,
      time: finding.severity === "high" ? t.thirtyMinutes : t.fiveMinutes,
    });
  });

  const severityWeight: Record<Severity, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    informational: 0,
  };

  return items
    .sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity])
    .slice(0, 8);
}

function drawCover(pages: PdfPage[], options: PdfOptions) {
  const { result, language, t } = options;
  let page = pages[0];
  const threatColor = getThreatColor(result.threatLevel);
  const explanation = getExplanation(options);

  page.ctx.fillStyle = "#020617";
  page.ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  page.ctx.fillStyle = "rgba(34, 211, 238, 0.10)";
  page.ctx.beginPath();
  page.ctx.arc(PAGE_WIDTH - 120, 120, 360, 0, Math.PI * 2);
  page.ctx.fill();

  drawText(page, t.brand, MARGIN, 76, CONTENT_WIDTH, {
    size: 32,
    weight: 900,
    color: "#67e8f9",
    language,
  });
  drawText(page, t.pdfCoverTitle, MARGIN, 126, CONTENT_WIDTH, {
    size: 52,
    weight: 900,
    color: "#f8fafc",
    language,
    lineHeight: 62,
  });

  fillCard(page.ctx, MARGIN, 266, CONTENT_WIDTH, 238, threatColor);
  drawText(page, getThreatDetected(result.threatLevel, t), MARGIN + 32, 298, CONTENT_WIDTH - 64, {
    size: 24,
    weight: 900,
    color: threatColor,
    language,
  });
  drawText(page, getThreatLabel(result.threatLevel, t), MARGIN + 32, 340, CONTENT_WIDTH - 64, {
    size: 54,
    weight: 900,
    color: "#ffffff",
    language,
    lineHeight: 60,
  });
  drawText(page, result.meta.finalUrl, MARGIN + 32, 436, CONTENT_WIDTH - 64, {
    size: 19,
    weight: 400,
    color: "#94a3b8",
    language,
    lineHeight: 26,
  });

  page.y = 542;
  drawParagraphCard(pages, language, t.pdfDisclaimer, t.pdfDisclaimer, "#64748b");
  drawCompactMetadataRows(pages, language, [
    [t.pdfSecurityScore, `${result.score}/100`],
    [t.grade, result.grade],
    [t.confidence, `${result.confidence}%`],
    [t.scanTimestamp, new Date(result.meta.scanTimestamp).toLocaleString(language)],
    [t.pdfScannerEngine, SCANNER_ENGINE_VERSION],
    [t.pdfIntelligenceEngine, INTELLIGENCE_ENGINE_VERSION],
    [t.pdfThreatClassification, getThreatLabel(result.threatLevel, t)],
    [t.pdfInfrastructureTrust, getInfrastructureTrustLabel(result, t)],
  ]);

  page = ensureSpace(pages, language, 80);
  drawSectionTitle(page, t.pdfExecutiveSummary, language, threatColor);
  drawParagraphCard(
    pages,
    language,
    t.executiveRiskOverview,
    explanation?.executiveRiskOverview ?? t.defaultExecutiveLine,
    threatColor,
  );
}

function drawFindings(pages: PdfPage[], options: PdfOptions) {
  const { result, language, t } = options;
  let page = ensureSpace(pages, language, 100);
  drawSectionTitle(page, t.pdfCriticalFindings, language, "#f87171");

  if (result.findings.length === 0) {
    drawParagraphCard(pages, language, t.pdfCriticalFindings, t.noHighPriorityFindings, "#34d399");
    return;
  }

  result.findings.forEach((finding) => {
    const body = finding.impact?.[language] ?? finding.message[language];
    const standards = buildComplianceMap(finding.message.en);
    const accent = getSeverityColor(finding.severity);
    const bodyHeight = page.measureWrappedText(body, CONTENT_WIDTH - 56, 18, 500);
    const standardsHeight = page.measureWrappedText(
      `${t.pdfAffectedStandards}: ${standards.join(", ")}`,
      CONTENT_WIDTH - 56,
      15,
      700,
    );
    const height = Math.max(228, 166 + bodyHeight + standardsHeight);

    page = ensureSpace(pages, language, height + COMPACT_GAP);
    const cardY = page.y;

    fillCard(page.ctx, MARGIN, cardY, CONTENT_WIDTH, height, accent);
    drawSeverityBadge(page, finding.severity, MARGIN + 26, cardY + 22, language);
    drawText(page, `${t.pdfTechnicalIssue}`, MARGIN + 184, cardY + 23, CONTENT_WIDTH - 210, {
      size: 16,
      weight: 800,
      color: accent,
      language,
    });
    drawText(page, finding.message.en, MARGIN + 184, cardY + 48, CONTENT_WIDTH - 210, {
      size: 21,
      weight: 900,
      color: "#f8fafc",
      language,
      lineHeight: 26,
    });
    drawText(page, `${t.pdfImpact}: ${body}`, MARGIN + 28, cardY + 100, CONTENT_WIDTH - 56, {
      size: 18,
      weight: 500,
      color: "#dbeafe",
      language,
      lineHeight: language === "ar" ? 28 : 24,
    });
    drawText(
      page,
      `${t.pdfExploitLikelihood}: ${finding.severity === "high" ? "Medium" : "Low"}  •  ${t.pdfAttackSurfaceAffected}: ${t.pdfAttackSurface}  •  ${t.pdfFixComplexity}: ${finding.severity === "high" ? t.moderate : t.easy}  •  ${t.pdfEstimatedFixTime}: ${finding.severity === "high" ? t.thirtyMinutes : t.fiveMinutes}`,
      MARGIN + 28,
      cardY + 116 + bodyHeight,
      CONTENT_WIDTH - 56,
      {
        size: 15,
        weight: 700,
        color: "#94a3b8",
        language,
        lineHeight: language === "ar" ? 24 : 20,
      },
    );
    drawText(page, `${t.pdfAffectedStandards}: ${standards.join(", ")}`, MARGIN + 28, cardY + height - standardsHeight - 22, CONTENT_WIDTH - 56, {
      size: 15,
      weight: 700,
      color: "#67e8f9",
      language,
      lineHeight: language === "ar" ? 24 : 20,
    });
    page.y = cardY + height + COMPACT_GAP;
  });
}

function drawThreatIntelligence(pages: PdfPage[], options: PdfOptions) {
  const { result, language, t } = options;
  let page = ensureSpace(pages, language, 100);
  drawSectionTitle(page, t.pdfThreatIntelligence, language, "#22d3ee");
  drawKeyValueGrid(pages, language, [
    [t.domain, result.intelligence.domain],
    [t.reputation, result.intelligence.reputation],
    [t.suspiciousTld, result.intelligence.suspiciousTld ? t.yes : t.no],
    [t.phishingKeywords, result.intelligence.phishingKeywords.join(", ") || t.no],
    [t.urlEntropy, String(result.intelligence.entropy)],
    [t.typosquatting, result.intelligence.typosquatting ? t.likely : t.no],
    ...getReputationPdfRows(result, language),
  ]);
}

function drawSecurityAnalytics(pages: PdfPage[], options: PdfOptions) {
  const { result, language, t } = options;
  const page = ensureSpace(pages, language, 640);
  const presentHeaders = Object.values(result.headers).filter(Boolean).length;
  const totalHeaders = Object.values(result.headers).length || 1;
  const headerCoverage = Math.round((presentHeaders / totalHeaders) * 100);
  const highCount = result.findings.filter(
    (finding) => finding.severity === "critical" || finding.severity === "high",
  ).length;
  const mediumCount = result.findings.filter((finding) => finding.severity === "medium").length;
  const lowCount = result.findings.filter((finding) => finding.severity === "low").length;
  const browserExposure = Math.round(((totalHeaders - presentHeaders) / totalHeaders) * 100);
  const domainExposure = result.intelligence.reputation === "suspicious" ? 85 : result.intelligence.reputation === "neutral" ? 45 : 18;
  const infraExposure = Math.min(100, result.technologies.length * 18 + (result.meta.server ? 22 : 0));

  drawSectionTitle(page, t.pdfSecurityAnalytics, language, "#22d3ee");
  drawGauge(page, MARGIN, page.y, result.score, t.score, getThreatColor(result.threatLevel), language);
  drawGauge(page, MARGIN + 264, page.y, result.confidence, t.confidence, "#22d3ee", language);
  drawDonutChart(
    page,
    MARGIN + CONTENT_WIDTH - 340,
    page.y,
    t.pdfRiskDistribution,
    [
      { label: "HIGH+", value: highCount, color: "#ef4444" },
      { label: "MEDIUM", value: mediumCount, color: "#f59e0b" },
      { label: "LOW", value: lowCount, color: "#22d3ee" },
    ],
    language,
  );
  page.y += 284;
  drawBarChart(
    page,
    MARGIN,
    page.y,
    CONTENT_WIDTH,
    t.pdfAttackSurface,
    [
      { label: t.pdfHeaderCoverage, value: headerCoverage, color: "#34d399" },
      { label: t.browserSecurity, value: browserExposure, color: "#f59e0b" },
      { label: t.domainTrust, value: domainExposure, color: "#a78bfa" },
      { label: t.pdfInfrastructureExposure, value: infraExposure, color: "#22d3ee" },
    ],
    language,
  );
  page.y += 292;
}

function drawTlsInfrastructure(pages: PdfPage[], options: PdfOptions) {
  const { result, language, t } = options;
  let page = ensureSpace(pages, language, 100);
  drawSectionTitle(page, t.pdfTlsInfrastructure, language, "#a78bfa");
  drawKeyValueGrid(pages, language, [
    [t.tlsVersion, result.ssl.protocol || t.unknown],
    [t.cipher, result.ssl.cipher || t.unknown],
    [t.issuer, result.ssl.issuer || t.unknown],
    [t.daysLeft, String(result.ssl.daysLeft)],
    [t.infrastructure, result.technologies.join(", ") || t.noFingerprint],
    ["CDN", result.infrastructure.cdn || t.notDisclosed],
    ["WAF", result.infrastructure.waf || t.notDisclosed],
    ["Cloud Provider", result.infrastructure.cloudProvider || t.notDisclosed],
    ["Hosting Provider", result.infrastructure.hostingProvider || t.notDisclosed],
    ["ASN", result.infrastructure.asn || t.notDisclosed],
    [t.server, result.meta.server || t.notDisclosed],
  ]);
}

function drawHeaders(pages: PdfPage[], options: PdfOptions) {
  const { result, language, t } = options;
  let page = ensureSpace(pages, language, 100);
  drawSectionTitle(page, t.pdfSecurityHeaders, language, "#34d399");
  const present = Object.entries(result.headers)
    .filter(([, value]) => value)
    .map(([header]) => header)
    .join(", ");
  const missing = Object.entries(result.headers)
    .filter(([, value]) => !value)
    .map(([header]) => header)
    .join(", ");

  drawParagraphCard(
    pages,
    language,
    t.present,
    present || t.no,
    "#34d399",
  );
  drawParagraphCard(
    pages,
    language,
    t.missing,
    missing || t.no,
    "#f87171",
  );
  drawParagraphCard(
    pages,
    language,
    t.pdfImpact,
    options.explanation?.[language].attackSurfaceAnalysis ?? t.defaultExecutiveLine,
    "#fbbf24",
  );
}

function drawMetadata(pages: PdfPage[], options: PdfOptions) {
  const { result, language, t } = options;
  let page = ensureSpace(pages, language, 100);
  const scanId = `CG-${new Date(result.meta.scanTimestamp).getTime().toString(36).toUpperCase()}-${Math.abs(result.meta.finalUrl.length * 97)}`;

  drawSectionTitle(page, t.pdfScanMetadata, language, "#67e8f9");
  drawCompactMetadataRows(pages, language, [
    [t.pdfScanId, scanId],
    [t.pdfGeneratedBy, `${INTELLIGENCE_ENGINE_VERSION}`],
    [t.pdfScannerEngine, SCANNER_ENGINE_VERSION],
    [t.pdfIntelligenceEngine, INTELLIGENCE_ENGINE_VERSION],
    [t.scanTimestamp, new Date(result.meta.scanTimestamp).toLocaleString(language)],
    [t.confidence, `${result.confidence}%`],
    [t.pdfThreatClassification, getThreatLabel(result.threatLevel, t)],
    [t.pdfInfrastructureTrust, getInfrastructureTrustLabel(result, t)],
    [t.runtime, `${result.meta.responseTime}ms`],
  ]);
  drawKeyValueGrid(pages, language, [
    [t.pdfFinalUrl, result.meta.finalUrl],
    [
      t.pdfRedirectChainSummary,
      result.redirects.chain
        .map((step) => `${step.statusCode} ${step.url}`)
        .join(" | ") || t.no,
    ],
  ]);
}

function drawExecutiveRecommendations(pages: PdfPage[], options: PdfOptions) {
  const { result, language, t } = options;
  let page = createPage(language);
  pages.push(page);
  const recommendations = buildRemediationItems(result, language, t);

  drawSectionTitle(page, t.pdfExecutiveRecommendations, language, "#67e8f9");
  drawParagraphCard(
    pages,
    language,
    t.executiveBrief,
    recommendationText(
      language,
      "The following actions are prioritized by severity, exploitability, and expected security impact. They are deterministic recommendations based only on observed scan evidence.",
      "تم ترتيب الإجراءات التالية حسب الخطورة وقابلية الاستغلال والأثر الأمني المتوقع. هذه توصيات حتمية تعتمد فقط على أدلة الفحص المرصودة.",
    ),
    "#67e8f9",
  );

  recommendations.forEach((item, index) => {
    const accent = getSeverityColor(item.severity);
    const titleHeight = page.measureWrappedText(`${index + 1}. ${item.title}`, CONTENT_WIDTH - 210, 22, 900);
    const whyHeight = page.measureWrappedText(`${t.pdfWhyItMatters}: ${item.why}`, CONTENT_WIDTH - 56, 18, 500);
    const detailLineHeight = language === "ar" ? 24 : 20;
    const height = Math.max(276, 168 + titleHeight + whyHeight + detailLineHeight * 3);

    page = ensureSpace(pages, language, height + COMPACT_GAP);
    const cardY = page.y;

    fillCard(page.ctx, MARGIN, cardY, CONTENT_WIDTH, height, accent);
    drawSeverityBadge(page, item.severity, MARGIN + 26, cardY + 22, language);
    drawText(page, `${index + 1}. ${item.title}`, MARGIN + 184, cardY + 22, CONTENT_WIDTH - 210, {
      size: 22,
      weight: 900,
      color: "#f8fafc",
      language,
      lineHeight: language === "ar" ? 30 : 26,
    });
    const whyY = cardY + 52 + titleHeight;
    drawText(page, `${t.pdfWhyItMatters}: ${item.why}`, MARGIN + 28, whyY, CONTENT_WIDTH - 56, {
      size: 18,
      weight: 500,
      color: "#dbeafe",
      language,
      lineHeight: language === "ar" ? 28 : 24,
    });
    drawText(
      page,
      `${t.pdfEstimatedImpact}: ${item.impact}  •  ${t.pdfExploitLikelihood}: ${item.likelihood}  •  ${t.pdfAttackSurfaceAffected}: ${item.attackSurface}`,
      MARGIN + 28,
      whyY + whyHeight + 18,
      CONTENT_WIDTH - 56,
      {
        size: 15,
        weight: 800,
        color: "#cbd5e1",
        language,
        lineHeight: detailLineHeight,
      },
    );
    drawText(
      page,
      `${t.pdfFixComplexity}: ${item.complexity}  •  ${t.pdfEstimatedFixTime}: ${item.time}  •  ${t.pdfAffectedStandards}: ${item.standards.join(", ")}`,
      MARGIN + 28,
      whyY + whyHeight + 62,
      CONTENT_WIDTH - 56,
      {
        size: 15,
        weight: 800,
        color: "#67e8f9",
        language,
        lineHeight: detailLineHeight,
      },
    );
    page.y = cardY + height + COMPACT_GAP;
  });
}

async function renderPages(options: PdfOptions) {
  if ("fonts" in document) {
    await document.fonts.ready;
  }

  const pages =
    options.language === "ar" ? renderArabicPDF(options) : renderEnglishPDF(options);

  const canvases = pages.map((page) => page.canvas);

  validateCanvases(canvases);

  return canvases;
}

function renderEnglishPDF(options: PdfOptions) {
  const pages = [createPage("en")];

  drawCover(pages, options);
  drawSecurityAnalytics(pages, options);
  drawFindings(pages, options);
  drawThreatIntelligence(pages, options);
  drawTlsInfrastructure(pages, options);
  drawHeaders(pages, options);
  drawMetadata(pages, options);
  drawExecutiveRecommendations(pages, options);

  return pages;
}

function renderArabicPDF(options: PdfOptions) {
  const pages = [createPage("ar")];

  drawCover(pages, options);
  drawSecurityAnalytics(pages, options);
  drawFindings(pages, options);
  drawThreatIntelligence(pages, options);
  drawTlsInfrastructure(pages, options);
  drawHeaders(pages, options);
  drawMetadata(pages, options);
  drawExecutiveRecommendations(pages, options);

  return pages;
}

function validateCanvases(canvases: HTMLCanvasElement[]) {
  if (canvases.length === 0) {
    throw new Error("pdf_no_pages");
  }

  for (let index = 0; index < canvases.length; index += 1) {
    const canvas = canvases[index];

    if (
      canvas.width !== PAGE_WIDTH ||
      canvas.height !== PAGE_HEIGHT ||
      canvas.width <= 0 ||
      canvas.height <= 0
    ) {
      throw new Error(`pdf_invalid_page_dimensions_${index}`);
    }
  }
}

function base64ToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function canvasToJpegBytes(canvas: HTMLCanvasElement) {
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.92);
  });

  if (blob && blob.size > 0) {
    return new Uint8Array(await blob.arrayBuffer());
  }

  const fallbackBytes = base64ToBytes(canvas.toDataURL("image/jpeg", 0.92));

  if (fallbackBytes.length === 0) {
    throw new Error("pdf_empty_canvas_image");
  }

  return fallbackBytes;
}

const textEncoder = new TextEncoder();

function encodeAscii(value: string) {
  return textEncoder.encode(value);
}

function byteLength(parts: Uint8Array[]) {
  return parts.reduce((total, part) => total + part.byteLength, 0);
}

function toArrayBuffer(part: Uint8Array) {
  const copy = new Uint8Array(part.byteLength);
  copy.set(part);

  return copy.buffer;
}

function sanitizePdfInfo(value: string) {
  return sanitize(value).replace(/[^\x20-\x7e]/g, "?");
}

type PdfObject = {
  id: number;
  parts: Uint8Array[];
};

async function buildPdfFromCanvases(canvases: HTMLCanvasElement[], title: string) {
  validateCanvases(canvases);

  const objects: PdfObject[] = [];
  const pageObjectIds: number[] = [];

  function addObject(parts: Uint8Array[]) {
    const id = objects.length + 1;
    objects.push({ id, parts });
    return id;
  }

  const catalogId = addObject([encodeAscii("<< /Type /Catalog /Pages 2 0 R >>")]);
  const pagesPlaceholderId = addObject([encodeAscii("<<>>")]);

  for (let index = 0; index < canvases.length; index += 1) {
    const canvas = canvases[index];
    const imageBytes = await canvasToJpegBytes(canvas);

    if (imageBytes.byteLength === 0) {
      throw new Error(`pdf_empty_image_stream_${index}`);
    }

    const imageObjectId = objects.length + 1;
    const contentObjectId = imageObjectId + 1;
    const pageObjectId = imageObjectId + 2;
    const content = encodeAscii(
      `q\n${PAGE_WIDTH} 0 0 ${PAGE_HEIGHT} 0 0 cm\n/Im${imageObjectId} Do\nQ\n`,
    );

    addObject([
      encodeAscii(
        `<< /Type /XObject /Subtype /Image /Width ${PAGE_WIDTH} /Height ${PAGE_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.byteLength} >>\nstream\n`,
      ),
      imageBytes,
      encodeAscii("\nendstream"),
    ]);
    addObject([
      encodeAscii(`<< /Length ${content.byteLength} >>\nstream\n`),
      content,
      encodeAscii("endstream"),
    ]);
    addObject([
      encodeAscii(
        `<< /Type /Page /Parent ${pagesPlaceholderId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /XObject << /Im${imageObjectId} ${imageObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
      ),
    ]);

    pageObjectIds.push(pageObjectId);
  }

  objects[pagesPlaceholderId - 1] = {
    id: pagesPlaceholderId,
    parts: [
      encodeAscii(
        `<< /Type /Pages /Kids [${pageObjectIds
          .map((id) => `${id} 0 R`)
          .join(" ")}] /Count ${pageObjectIds.length} >>`,
      ),
    ],
  };

  const infoObjectId = addObject([
    encodeAscii(
      `<< /Title (${escapePdfString(sanitizePdfInfo(PDF_METADATA_TITLE))}) /Producer (CyberGuardian) >>`,
    ),
  ]);
  const outputParts: Uint8Array[] = [
    encodeAscii("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"),
  ];
  const offsets = [0];

  for (const object of objects) {
    offsets[object.id] = byteLength(outputParts);
    outputParts.push(encodeAscii(`${object.id} 0 obj\n`), ...object.parts, encodeAscii("\nendobj\n"));
  }

  const xrefOffset = byteLength(outputParts);
  const xrefRows = [
    `xref\n0 ${objects.length + 1}\n`,
    "0000000000 65535 f \n",
    ...objects.map((object) => {
      const offset = offsets[object.id];

      return `${String(offset).padStart(10, "0")} 00000 n \n`;
    }),
  ];
  outputParts.push(
    encodeAscii(
      `${xrefRows.join("")}trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info ${infoObjectId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
    ),
  );

  const blob = new Blob(outputParts.map(toArrayBuffer), { type: "application/pdf" });

  await validatePdfBlob(blob, canvases.length);

  return blob;
}

async function validatePdfBlob(blob: Blob, expectedPages: number) {
  if (blob.size < 1024) {
    throw new Error("pdf_blob_too_small");
  }

  const buffer = await blob.arrayBuffer();
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const header = decoder.decode(buffer.slice(0, 8));
  const tail = decoder.decode(buffer.slice(Math.max(0, buffer.byteLength - 32)));

  if (!header.startsWith("%PDF-")) {
    throw new Error("pdf_invalid_header");
  }

  if (!tail.includes("%%EOF")) {
    throw new Error("pdf_missing_eof");
  }

  if (expectedPages <= 0) {
    throw new Error("pdf_expected_pages_invalid");
  }

  const pdfText = decoder.decode(buffer);
  const pageCount = pdfText.match(/\/Type \/Page\b/g)?.length ?? 0;

  if (pageCount !== expectedPages) {
    throw new Error(`pdf_page_count_mismatch_${pageCount}_${expectedPages}`);
  }
}

function sanitizeFilenamePart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getSafeReportFilename(finalUrl: string, scanTimestamp: string) {
  try {
    const hostname = new URL(finalUrl).hostname;
    const domain = sanitizeFilenamePart(hostname.replace(/\./g, "-"));
    const date = new Date(scanTimestamp).toISOString().slice(0, 10);

    if (!domain || !date) {
      return "cyberguardian-security-report.pdf";
    }

    return `cyberguardian-security-report-${domain}-${date}.pdf`;
  } catch {
    return "cyberguardian-security-report.pdf";
  }
}

export async function generateCyberGuardianPdf(options: PdfOptions) {
  try {
    const canvases = await renderPages(options);
    const blob = await buildPdfFromCanvases(canvases, options.t.pdfCoverTitle);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const filename = getSafeReportFilename(
      options.result.meta.finalUrl,
      options.result.meta.scanTimestamp,
    );

    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch (error) {
    throw error;
  }
}
