import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import type { ScanResult } from "@/lib/types";
import { ensurePdfFontsRegistered } from "@/lib/pdf/phaseB/pdfFonts";
import type { PdfExportMeta } from "@/lib/pdf/phaseB/mapScanResult";
import { buildPdfReportDataV3 } from "@/lib/pdf/v3/mapV3";
import { PdfDocumentV3 } from "@/lib/pdf/v3/PdfDocumentV3";

export async function generatePDF(
  result: ScanResult,
  locale: "en" | "ar",
  meta?: PdfExportMeta,
): Promise<Blob> {
  if (typeof document === "undefined") {
    throw new Error("PDF export is available only in the browser.");
  }

  ensurePdfFontsRegistered();

  const data = buildPdfReportDataV3(result, meta, locale);

  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(data.base.verifyUrl, {
      width: 64,
      margin: 1,
      color: { dark: "#F8FAFC", light: "#020617" },
    });
  } catch {
    qrDataUrl = null;
  }

  return pdf(<PdfDocumentV3 data={data} locale={locale} qrDataUrl={qrDataUrl} />).toBlob();
}

export { generatePDF as generatePDFV3 };
