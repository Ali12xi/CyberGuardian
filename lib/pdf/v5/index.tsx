import { pdf } from "@react-pdf/renderer";
import type { ScanResult } from "@/lib/types";
import { ensurePdfFontsRegistered } from "@/lib/pdf/phaseB/pdfFonts";
import type { PdfExportMeta } from "@/lib/pdf/phaseB/mapScanResult";
import { buildPdfReportDataV5 } from "@/lib/pdf/v5/mapV5";
import { PdfDocumentV5 } from "@/lib/pdf/v5/PdfDocumentV5";

export async function generatePDF(
  result: ScanResult,
  locale: "en" | "ar" = "en",
  meta?: PdfExportMeta,
): Promise<Blob> {
  if (typeof document === "undefined") {
    throw new Error("PDF export is available only in the browser.");
  }

  ensurePdfFontsRegistered();

  const data = await buildPdfReportDataV5(result, locale, meta);

  return pdf(<PdfDocumentV5 data={data} />).toBlob();
}

export { generatePDF as generatePDFV5 };
