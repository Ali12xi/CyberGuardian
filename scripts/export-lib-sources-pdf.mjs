/**
 * Bundles lib/pdf.ts, lib/scanner.ts, lib/remediation.ts into one printable PDF.
 * Run: node scripts/export-lib-sources-pdf.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "exports");
const outPath = path.join(outDir, "cyberguardian-lib-sources.pdf");

const FILES = ["lib/remediation.ts", "lib/pdf.ts", "lib/scanner.ts"];

const PAGE_HEIGHT = 841.89;
const MARGIN_TOP = 40;
const MARGIN_BOTTOM = 40;
const FONT_SIZE = 6;
const LINE_GAP = 0;
const MAX_CHARS_PER_LINE = 106;

function sanitizeLine(line) {
  return Array.from(line)
    .map((ch) => {
      const code = ch.codePointAt(0);
      if (code === undefined || code === 9 || code === 10 || code === 13) {
        return ch;
      }
      if (code >= 32 && code <= 126) {
        return ch;
      }
      return "?";
    })
    .join("");
}

function wrapLine(line) {
  if (line.length <= MAX_CHARS_PER_LINE) {
    return [line];
  }
  const chunks = [];
  let rest = line;
  while (rest.length > 0) {
    chunks.push(rest.slice(0, MAX_CHARS_PER_LINE));
    rest = rest.slice(MAX_CHARS_PER_LINE);
  }
  return chunks;
}

fs.mkdirSync(outDir, { recursive: true });

const doc = new PDFDocument({
  size: "A4",
  margin: 42,
  bufferPages: true,
});
const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

let startedFile = false;

for (const rel of FILES) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error("Missing:", full);
    process.exit(1);
  }
  const raw = fs.readFileSync(full, "utf8");
  const lines = raw.split(/\r?\n/);

  if (startedFile) {
    doc.addPage();
  }
  startedFile = true;

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text(rel, {
    underline: true,
  });
  doc.moveDown(0.35);
  doc.font("Courier").fontSize(FONT_SIZE).fillColor("#1e293b");

  const flattened = lines.flatMap((line) => wrapLine(line));

  for (const rawLine of flattened) {
    const line = sanitizeLine(rawLine.length ? rawLine : " ");
    const bottomLimit = PAGE_HEIGHT - doc.page.margins.bottom - FONT_SIZE - 4;

    if (doc.y > bottomLimit) {
      doc.addPage();
      doc.font("Courier").fontSize(FONT_SIZE).fillColor("#1e293b");
    }

    doc.text(line, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      align: "left",
      lineGap: LINE_GAP,
    });
  }
}

doc.end();

stream.on("finish", () => {
  console.log(`Wrote ${outPath}`);
});
