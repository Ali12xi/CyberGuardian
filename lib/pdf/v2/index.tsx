import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import type { ScanResult } from "@/lib/types";
import { ensurePdfFontsRegistered } from "@/lib/pdf/phaseB/pdfFonts";
import type { PdfExportMeta } from "@/lib/pdf/phaseB/mapScanResult";
import { buildPdfReportDataV2 } from "@/lib/pdf/v2/mapV2";
import { PdfDocumentV2 } from "@/lib/pdf/v2/PdfDocumentV2";

export async function generatePDF(
  result: ScanResult,
  locale: "en" | "ar",
  meta?: PdfExportMeta,
): Promise<Blob> {
  console.log("[PDF V2] started", { result, locale });
  try {
    if (typeof document === "undefined") {
      throw new Error("PDF export is available only in the browser.");
    }

    ensurePdfFontsRegistered();

    const data = buildPdfReportDataV2(result, meta);

    let qrDataUrl: string | null = null;
    try {
      qrDataUrl = await QRCode.toDataURL(data.verifyUrl, {
        width: 64,
        margin: 1,
        color: { dark: "#F8FAFC", light: "#020617" },
      });
    } catch {
      qrDataUrl = null;
    }

    return pdf(<PdfDocumentV2 data={data} locale={locale} qrDataUrl={qrDataUrl} />).toBlob();
  } catch (error) {
    console.error("[PDF V2] failed:", error);
    console.error("[PDF V2] stack:", error instanceof Error ? error.stack : undefined);
    throw error;
  }
}
