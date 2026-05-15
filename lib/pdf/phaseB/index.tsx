import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import type { ScanResult } from "@/lib/types";
import { mapScanResult, type PdfExportMeta, type ScanResultForPdf } from "@/lib/pdf/phaseB/mapScanResult";
import { PdfDocument } from "@/lib/pdf/phaseB/PdfDocument";
import { ensurePdfFontsRegistered } from "@/lib/pdf/phaseB/pdfFonts";

export async function generatePDF(
  result: ScanResult,
  locale: "en" | "ar",
  meta?: PdfExportMeta,
): Promise<Blob> {
  console.log("[PDF] generatePDF called", { result, locale });
  try {
    if (typeof document === "undefined") {
      throw new Error("PDF export is available only in the browser.");
    }

    ensurePdfFontsRegistered();

    const merged: ScanResultForPdf =
      meta !== undefined
        ? { ...result, pdfScanId: meta.scanId, pdfScanToken: meta.scanToken }
        : result;

    const data = mapScanResult(merged);

    let qrDataUrl: string | null = null;
    try {
      qrDataUrl = await QRCode.toDataURL(data.verifyUrl, {
        width: 80,
        margin: 1,
        color: { dark: "#0F172A", light: "#FFFFFF" },
      });
    } catch (error) {
      console.error("[PDF] error:", error);
      qrDataUrl = null;
    }

    return pdf(<PdfDocument data={data} locale={locale} qrDataUrl={qrDataUrl} />).toBlob();
  } catch (error) {
    console.error("[PDF] generatePDF failed:", error);
    console.error(
      "[PDF] stack:",
      error instanceof Error ? error.stack : "(no stack)",
    );
    throw error;
  }
}

export { mapScanResult, type PdfExportMeta, type PdfReportData, type ScanResultForPdf } from "@/lib/pdf/phaseB/mapScanResult";
export { PdfDocument } from "@/lib/pdf/phaseB/PdfDocument";
