/**
 * Sprint 6 Day 1: Correlation Intelligence copy — bilingual, Option A.
 *
 * Layer-NAME language only. No signal names, no routes, no counts. Mirrors
 * the shape/tone of lib/saudiTrustCopy.ts. Vocabulary discipline:
 * - "observed" / "detected together" only
 * - NO verdict words (trusted/secure/mature/compliant/good/strong)
 * - NO causation ("because"/"therefore"/"this means")
 * - NO count language (never surface how many layers)
 */

import type { CorrelationLayer } from "@/lib/correlation";

export const CORRELATION_SECTION = {
  kicker: { en: "🔗 CORRELATION", ar: "🔗 الترابط" },
  title: {
    en: "Correlation Intelligence",
    ar: "ذكاء الترابط",
  },
  // Intro line — leads the section (the "why it matters").
  intro: {
    en: "Independent observation layers were detected together for this domain.",
    ar: "رُصدت طبقات ملاحظة مستقلة معاً لهذا النطاق.",
  },
} as const;

// Layer-name observations (supporting lines, after the intro).
export const LAYER_LABELS: Record<
  CorrelationLayer,
  { en: string; ar: string }
> = {
  email: {
    en: "Email Identity observations detected",
    ar: "تم رصد ملاحظات هوية البريد",
  },
  saudi: {
    en: "Saudi Context observations detected",
    ar: "تم رصد ملاحظات السياق السعودي",
  },
};
