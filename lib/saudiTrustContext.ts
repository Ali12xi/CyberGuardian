/**
 * Sprint 5 Day 1: Saudi Trust Context — pure derivation.
 *
 * Context layer (NOT inventory). Builds on EXISTING data only — no fetch,
 * no new source (Principle 55). Signals indicate observed ASSOCIATION with
 * Saudi-specific trust infrastructure, NEVER ownership, nationality, or
 * legal status (Principle 54).
 *
 * Sealed constraints:
 * - NO security.txt logic (RFC 9116 global signal — category error here)
 * - NO compliance / verdict / ownership logic
 * - Haseen via the reused detectHaseenPattern only (no reimplementation)
 */

import { detectHaseenPattern } from "@/lib/emailTrustInterpretation";
import type { EmailTrustIntelligence } from "@/lib/types";

export type SaudiTld = "gov.sa" | "edu.sa" | "com.sa" | "sa" | "none";

export type SaudiSignals = {
  tld: SaudiTld;
  isGovernment: boolean;
  hasHaseenSignal: boolean; // context builder, NOT displayed standalone
  hasSaudiContext: boolean; // the gate
};

export function detectSaudiTld(domain: string): SaudiTld {
  const d = domain.toLowerCase();
  // Order matters: specific before general.
  // endsWith handles both collapsed ("com.sa") and preserved ("x.com.sa") forms.
  if (d === "gov.sa" || d.endsWith(".gov.sa")) return "gov.sa";
  if (d === "edu.sa" || d.endsWith(".edu.sa")) return "edu.sa";
  if (d === "com.sa" || d.endsWith(".com.sa")) return "com.sa";
  if (d === "sa" || d.endsWith(".sa")) return "sa";
  return "none";
}

export function deriveSaudiSignals(args: {
  domain: string;
  emailTrust?: EmailTrustIntelligence;
}): SaudiSignals {
  const tld = detectSaudiTld(args.domain);
  const isGovernment = tld === "gov.sa";
  const hasHaseenSignal = args.emailTrust?.dmarc
    ? detectHaseenPattern(args.emailTrust.dmarc)
    : false;
  const hasSaudiContext = tld !== "none" || hasHaseenSignal;
  return { tld, isGovernment, hasHaseenSignal, hasSaudiContext };
}
