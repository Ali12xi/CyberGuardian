import type { Language, Translations } from "@/lib/i18n";
import type { AIExplanation, Finding, ScanResult } from "@/lib/types";

type GenerateCyberGuardianPdfArgs = {
  result: ScanResult;
  explanation: AIExplanation | null;
  language: Language;
  t: Translations;
};

type PdfPageImage = {
  width: number;
  height: number;
  data: Uint8Array;
};

type DrawState = {
  ctx: CanvasRenderingContext2D;
  y: number;
  language: Language;
  direction: CanvasDirection;
};

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const PAGE_PADDING = 74;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_PADDING * 2;
const BRAND = "CyberGurdian AI";

function getFont(language: Language, weight = 500, size = 28) {
  const family =
    language === "ar"
      ? "Cairo, Arial, sans-serif"
      : "Inter, Arial, sans-serif";

  return `${weight} ${size}px ${family}`;
}

function escapePdfString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function sanitizeFilenamePart(value: string) {
  const sanitized = value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return sanitized || "target";
}

function getSafeReportFilename(result: ScanResult) {
  const target = sanitizeFilenamePart(
    result.intelligence.domain || result.meta.finalUrl,
  );
  const date = new Date(result.meta.scanTimestamp)
    .toISOString()
    .slice(0, 10);

  return `cybergurdian-ai-security-report-${target}-${date}.pdf`;
}

function getTextAlign(language: Language): CanvasTextAlign {
  return language === "ar" ? "right" : "left";
}

function getTextX(language: Language) {
  return language === "ar" ? PAGE_WIDTH - PAGE_PADDING : PAGE_PADDING;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function drawWrappedText(
  state: DrawState,
  text: string,
  options: {
    color?: string;
    font?: string;
    lineHeight?: number;
    maxWidth?: number;
    x?: number;
  } = {},
) {
  const {
    color = "#cbd5e1",
    font = getFont(state.language, 500, 28),
    lineHeight = 42,
    maxWidth = CONTENT_WIDTH,
    x = getTextX(state.language),
  } = options;
  const ctx = state.ctx;
  const paragraphs = text.split("\n");

  ctx.save();
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = getTextAlign(state.language);
  ctx.textBaseline = "top";
  ctx.direction = state.direction;

  paragraphs.forEach((paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";

    if (words.length === 0) {
      state.y += lineHeight;
      return;
    }

    words.forEach((word) => {
      const testLine = line ? `${line} ${word}` : word;

      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, state.y);
        state.y += lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    });

    if (line) {
      ctx.fillText(line, x, state.y);
      state.y += lineHeight;
    }
  });

  ctx.restore();
}

function drawCard(
  state: DrawState,
  title: string,
  body: string,
  options: {
    accent?: string;
    minHeight?: number;
  } = {},
) {
  const { accent = "#22d3ee", minHeight = 150 } = options;
  const startY = state.y;
  const ctx = state.ctx;
  const accentX =
    state.language === "ar" ? PAGE_WIDTH - PAGE_PADDING - 8 : PAGE_PADDING;
  const textX =
    state.language === "ar"
      ? PAGE_WIDTH - PAGE_PADDING - 32
      : PAGE_PADDING + 32;

  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
  ctx.strokeStyle = "rgba(34, 211, 238, 0.18)";
  ctx.lineWidth = 2;
  roundedRect(ctx, PAGE_PADDING, state.y, CONTENT_WIDTH, minHeight, 28);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = accent;
  roundedRect(ctx, accentX, state.y + 24, 8, minHeight - 48, 8);
  ctx.fill();
  ctx.restore();

  state.y += 24;
  drawWrappedText(state, title, {
    color: "#f8fafc",
    font: getFont(state.language, 800, 28),
    lineHeight: 40,
    maxWidth: CONTENT_WIDTH - 64,
    x: textX,
  });
  state.y += 8;
  drawWrappedText(state, body, {
    color: "#cbd5e1",
    font: getFont(state.language, 500, 24),
    lineHeight: 36,
    maxWidth: CONTENT_WIDTH - 64,
    x: textX,
  });

  state.y = Math.max(startY + minHeight + 24, state.y + 24);
}

function drawHeader(state: DrawState, title: string) {
  const ctx = state.ctx;

  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);

  const gradient = ctx.createRadialGradient(
    PAGE_WIDTH / 2,
    100,
    80,
    PAGE_WIDTH / 2,
    100,
    700,
  );
  gradient.addColorStop(0, "rgba(34, 211, 238, 0.22)");
  gradient.addColorStop(1, "rgba(2, 6, 23, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, PAGE_WIDTH, 520);

  ctx.fillStyle = "#22d3ee";
  ctx.font = getFont(state.language, 800, 24);
  ctx.textAlign = getTextAlign(state.language);
  ctx.direction = state.direction;
  ctx.fillText(BRAND, getTextX(state.language), 58);

  state.y = 130;
  drawWrappedText(state, title, {
    color: "#f8fafc",
    font: getFont(state.language, 900, 48),
    lineHeight: 62,
  });
  state.y += 16;
}

function formatDate(value: string, language: Language) {
  try {
    return new Intl.DateTimeFormat(language === "ar" ? "ar" : "en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getFindingText(finding: Finding, language: Language) {
  const impact = finding.impact?.[language];
  const remediation = finding.remediation?.[language];

  return [
    finding.message[language],
    impact ? `${language === "ar" ? "الأثر" : "Impact"}: ${impact}` : "",
    remediation
      ? `${language === "ar" ? "التوصية" : "Recommendation"}: ${remediation}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function createCanvasPage(
  draw: (state: DrawState) => void,
  language: Language,
) {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_WIDTH;
  canvas.height = PAGE_HEIGHT;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create PDF rendering context.");
  }

  draw({
    ctx,
    y: PAGE_PADDING,
    language,
    direction: language === "ar" ? "rtl" : "ltr",
  });

  return canvas;
}

function canvasToJpegBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("Unable to encode PDF page."));
          return;
        }

        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      "image/jpeg",
      0.92,
    );
  });
}

function createReportCanvases({
  result,
  explanation,
  language,
  t,
}: GenerateCyberGuardianPdfArgs) {
  const summary = explanation?.[language].executiveRiskOverview;
  const findings = result.findings.slice(0, 8);

  return [
    createCanvasPage((state) => {
      drawHeader(state, t.pdfCoverTitle || "Cybersecurity Intelligence Report");
      drawCard(
        state,
        t.pdfExecutiveSummary,
        [
          `${t.domain}: ${result.intelligence.domain}`,
          `${t.pdfFinalUrl}: ${result.meta.finalUrl}`,
          `${t.pdfSecurityScore}: ${result.score}/100 (${result.grade})`,
          `${t.risk}: ${result.threatLevel}`,
          `${t.confidence}: ${result.confidence}%`,
          `${t.scanTimestamp}: ${formatDate(result.meta.scanTimestamp, language)}`,
        ].join("\n"),
        { minHeight: 330 },
      );

      drawCard(state, t.aiSummary, summary || t.defaultExecutiveLine, {
        minHeight: 230,
      });

      drawCard(state, t.pdfDisclaimerTitle, t.pdfDisclaimer, {
        accent: "#94a3b8",
        minHeight: 190,
      });
    }, language),
    createCanvasPage((state) => {
      drawHeader(state, t.pdfCriticalFindings);

      if (findings.length === 0) {
        drawCard(state, t.noHighPriorityFindings, t.defaultExecutiveLine, {
          accent: "#34d399",
          minHeight: 220,
        });
        return;
      }

      findings.forEach((finding) => {
        drawCard(
          state,
          `${finding.severity.toUpperCase()} · ${t.pdfTechnicalIssue}`,
          getFindingText(finding, language),
          {
            accent:
              finding.severity === "critical" || finding.severity === "high"
                ? "#f87171"
                : finding.severity === "medium"
                  ? "#fbbf24"
                  : "#22d3ee",
            minHeight: 220,
          },
        );
      });
    }, language),
    createCanvasPage((state) => {
      drawHeader(state, t.pdfTlsInfrastructure);
      drawCard(
        state,
        t.tlsAndRedirects,
        [
          `${t.valid}: ${result.ssl.valid ? t.yes : t.no}`,
          `${t.selfSigned}: ${result.ssl.selfSigned ? t.yes : t.no}`,
          `${t.issuer}: ${result.ssl.issuer || t.unknown}`,
          `${t.daysLeft}: ${result.ssl.daysLeft}`,
          `${t.tlsVersion}: ${result.ssl.protocol || t.unknown}`,
          `${t.cipher}: ${result.ssl.cipher || t.unknown}`,
          `${t.suspiciousRedirects}: ${result.redirects.suspicious ? t.yes : t.no}`,
        ].join("\n"),
        { minHeight: 390 },
      );

      drawCard(
        state,
        t.infrastructure,
        [
          `${t.server}: ${result.meta.server || t.notDisclosed}`,
          `CDN: ${result.infrastructure.cdn || t.unknown}`,
          `WAF: ${result.infrastructure.waf || t.unknown}`,
          `Cloud: ${result.infrastructure.cloudProvider || t.unknown}`,
          `ASN: ${result.infrastructure.asn || t.unknown}`,
        ].join("\n"),
        { minHeight: 320 },
      );
    }, language),
  ];
}

function buildPdf(images: PdfPageImage[]) {
  const parts: Array<string | Uint8Array> = [];
  const offsets: number[] = [];
  let offset = 0;

  function writeText(text: string) {
    parts.push(text);
    offset += text.length;
  }

  function writeBinary(data: Uint8Array) {
    parts.push(data);
    offset += data.length;
  }

  function object(id: number, content: () => void) {
    offsets[id] = offset;
    writeText(`${id} 0 obj\n`);
    content();
    writeText("\nendobj\n");
  }

  writeText("%PDF-1.4\n");

  object(1, () => {
    writeText("<< /Type /Catalog /Pages 2 0 R >>");
  });

  object(2, () => {
    const kids = images.map((_, index) => `${3 + index * 3} 0 R`).join(" ");
    writeText(`<< /Type /Pages /Kids [${kids}] /Count ${images.length} >>`);
  });

  images.forEach((image, index) => {
    const pageId = 3 + index * 3;
    const imageId = pageId + 1;
    const contentId = pageId + 2;

    object(pageId, () => {
      writeText(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${image.width} ${image.height}] /Resources << /XObject << /Im${index} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
      );
    });

    object(imageId, () => {
      writeText(
        `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.data.length} >>\nstream\n`,
      );
      writeBinary(image.data);
      writeText("\nendstream");
    });

    const stream = `q\n${image.width} 0 0 ${image.height} 0 0 cm\n/Im${index} Do\nQ`;

    object(contentId, () => {
      writeText(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    });
  });

  const infoId = 3 + images.length * 3;

  object(infoId, () => {
    writeText(
      `<< /Title (${escapePdfString(BRAND)} Security Report) /Producer (${escapePdfString(BRAND)}) >>`,
    );
  });

  const xrefOffset = offset;
  const objectCount = infoId + 1;
  writeText(`xref\n0 ${objectCount}\n`);
  writeText("0000000000 65535 f \n");

  for (let id = 1; id < objectCount; id += 1) {
    writeText(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }

  writeText(
    `trailer\n<< /Size ${objectCount} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  );

  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  const textEncoder = new TextEncoder();
  let cursor = 0;

  parts.forEach((part) => {
    if (typeof part === "string") {
      const encoded = textEncoder.encode(part);
      output.set(encoded, cursor);
      cursor += encoded.length;
      return;
    }

    output.set(part, cursor);
    cursor += part.length;
  });

  return output.buffer;
}

function downloadPdf(data: ArrayBuffer, filename: string) {
  const blob = new Blob([data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function generateCyberGuardianPdf(
  args: GenerateCyberGuardianPdfArgs,
) {
  if (typeof document === "undefined") {
    throw new Error("PDF export is available only in the browser.");
  }

  const canvases = createReportCanvases(args);
  const images = await Promise.all(
    canvases.map(async (canvas) => ({
      width: canvas.width,
      height: canvas.height,
      data: await canvasToJpegBytes(canvas),
    })),
  );

  downloadPdf(buildPdf(images), getSafeReportFilename(args.result));
}
