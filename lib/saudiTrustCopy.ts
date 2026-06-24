/**
 * Sprint 5 Day 1: Saudi Trust Context copy — bilingual, context-style.
 *
 * Context layer phrasing: leads with WHY it matters, then supporting
 * observations. Vocabulary discipline (Principle 54):
 * - "observed" / "association" / "indicate" only
 * - NO compliance/certification (compliant/certified/approved)
 * - NO PDPL / NCA / SAMA
 * - NO ownership/verdict ("is Saudi" / "Saudi-owned" / "belongs to" /
 *   "Saudi company/organization")
 */

import type { SaudiTld } from "@/lib/saudiTrustContext";

export const SAUDI_CONTEXT_SECTION = {
  kicker: { en: "🇸🇦 SAUDI CONTEXT", ar: "🇸🇦 السياق السعودي" },
  title: {
    en: "Saudi Trust Context",
    ar: "السياق السعودي للموثوقية",
  },
  // Context line — leads the section (the "why it matters").
  // "association" (not "participation") — cleaner epistemically.
  contextLine: {
    en: "Observed signals indicate association with Saudi-specific trust infrastructure.",
    ar: "تشير الإشارات الملحوظة إلى ارتباط بالبنية التحتية السعودية للموثوقية.",
  },
} as const;

// TLD observations (supporting details, after the context line).
export const SAUDI_TLD_COPY: Record<
  Exclude<SaudiTld, "none">,
  { en: string; ar: string }
> = {
  "gov.sa": {
    en: "Government domain (.gov.sa) observed.",
    ar: "نطاق حكومي (.gov.sa) ملحوظ.",
  },
  "edu.sa": {
    en: "Saudi education domain (.edu.sa) observed.",
    ar: "نطاق تعليمي سعودي (.edu.sa) ملحوظ.",
  },
  "com.sa": {
    en: "Saudi commercial domain (.com.sa) observed.",
    ar: "نطاق تجاري سعودي (.com.sa) ملحوظ.",
  },
  "sa": {
    en: "Saudi domain (.sa) observed.",
    ar: "نطاق سعودي (.sa) ملحوظ.",
  },
};

// Haseen reference line (context builder, NOT the Email section's chip).
export const SAUDI_REPORTING_LINE = {
  en: "Saudi reporting infrastructure observed.",
  ar: "بنية تحتية سعودية للإبلاغ ملحوظة.",
} as const;
