import { Font } from "@react-pdf/renderer";

export type PdfRegisteredLatinFont = "Inter" | "Helvetica";
export type PdfRegisteredArabicFont = "NotoSansArabic" | "Helvetica";

let pdfLatinFont: PdfRegisteredLatinFont = "Helvetica";
let pdfArabicFont: PdfRegisteredArabicFont = "Helvetica";
let ensured = false;

/**
 * Runs synchronously once before `pdf()` render (browser only).
 * Uses TTF only (@react-pdf/renderer does not support woff2). On any failure, skips registration and keeps Helvetica.
 */
export function ensurePdfFontsRegistered(): void {
  if (ensured) {
    return;
  }
  ensured = true;
  if (typeof window === "undefined" || typeof window.location?.origin !== "string") {
    return;
  }
  const base = `${window.location.origin}/fonts`;
  const interRegular = `${base}/Inter-Regular.ttf`;
  const interBold = `${base}/Inter-Bold.ttf`;
  const notoArabic = `${base}/NotoSansArabic-Regular.ttf`;

  try {
    Font.register({
      family: "Inter",
      fonts: [
        { src: interRegular, fontWeight: "normal", fontStyle: "normal" },
        { src: interRegular, fontWeight: "normal", fontStyle: "italic" },
        { src: interBold, fontWeight: "bold", fontStyle: "normal" },
        { src: interBold, fontWeight: "bold", fontStyle: "italic" },
      ],
    });
    pdfLatinFont = "Inter";
  } catch {
    pdfLatinFont = "Helvetica";
  }

  try {
    Font.register({
      family: "NotoSansArabic",
      fonts: [
        { src: notoArabic, fontWeight: "normal", fontStyle: "normal" },
        { src: notoArabic, fontWeight: "normal", fontStyle: "italic" },
        { src: notoArabic, fontWeight: "bold", fontStyle: "normal" },
        { src: notoArabic, fontWeight: "bold", fontStyle: "italic" },
      ],
    });
    pdfArabicFont = "NotoSansArabic";
  } catch {
    pdfArabicFont = "Helvetica";
  }
}

export function getPdfBodyFont(locale: "en" | "ar"): PdfRegisteredLatinFont | PdfRegisteredArabicFont {
  return locale === "ar" ? pdfArabicFont : pdfLatinFont;
}

if (typeof window !== "undefined") {
  ensurePdfFontsRegistered();
}
