/**
 * Sprint 6 Day 1: Correlation Intelligence — pure derivation.
 *
 * Layer-Presence Translator. States that independent semantic layers were
 * observed TOGETHER. Does NOT correlate, count, score, or judge. Reads ONLY
 * two pre-existing booleans — structurally incapable of repeating signal
 * content (Principle 58 co-occurrence, Principle 59 semantic ownership,
 * Principle 60 layer presence before signal detail).
 *
 * PRESENCE Intelligence, NOT Count Intelligence. layers.length is used ONLY
 * inside the gate below; the count is never surfaced.
 */

import { deriveSaudiSignals } from "@/lib/saudiTrustContext";
import type { ScanResult } from "@/lib/types";

export type CorrelationLayer = "email" | "saudi";

export type CorrelationResult = {
  emailLayerPresent: boolean;
  saudiLayerPresent: boolean;
  layers: CorrelationLayer[];
  hasCorrelation: boolean;
};

export function deriveCorrelation(result: ScanResult): CorrelationResult {
  const emailLayerPresent = result.emailTrust?.hasEmailSurface === true;
  const saudiLayerPresent = deriveSaudiSignals({
    domain: result.intelligence.domain,
    emailTrust: result.emailTrust,
  }).hasSaudiContext;

  const layers: CorrelationLayer[] = [];
  if (emailLayerPresent) {
    layers.push("email");
  }
  if (saudiLayerPresent) {
    layers.push("saudi");
  }

  return {
    emailLayerPresent,
    saudiLayerPresent,
    layers,
    hasCorrelation: layers.length >= 2,
  };
}
