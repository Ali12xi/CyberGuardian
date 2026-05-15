import { pdf } from "@react-pdf/renderer";
import { PhaseAMockDocument } from "@/lib/pdf/phaseA/PhaseAMockDocument";

/**
 * Phase A — static mock PDF only (no ScanResult binding).
 * Phase B will introduce `generatePDF(result, locale)` read-only wiring.
 */
export async function generateTrustLayerPdfPhaseA(locale: "en" | "ar"): Promise<Blob> {
  if (typeof document === "undefined") {
    throw new Error("PDF export is available only in the browser.");
  }

  return pdf(<PhaseAMockDocument locale={locale} />).toBlob();
}

export { PhaseAMockDocument } from "@/lib/pdf/phaseA/PhaseAMockDocument";
export { LtrText } from "@/lib/pdf/phaseA/LtrText";
