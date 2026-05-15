import type { ScanResult, ThreatLevel } from "@/lib/types";

/**
 * Maintainer note — threat vs score:
 * Threat level represents exploitability and attacker-relevant risk, not merely incomplete
 * browser hardening visibility. Missing standard security headers alone are NEVER sufficient
 * for HIGH threat: HIGH requires at least one hard-risk transport, identity,
 * or phishing signal defined in `hasHardRiskForHighThreatTier` (redirect intent alone is capped at MEDIUM).
 */

/**
 * Hard-risk signals that justify HIGH threat. Deliberately excludes:
 * - missing browser security headers without transport/phishing/redirect failure
 * - generic high-severity findings without the above (those affect score / ceilings, not tier)
 * - redirect chains alone (even when marked suspicious for scoring) — never HIGH; see `calculateThreatLevel`.
 */
function hasHardRiskForHighThreatTier(result: ScanResult): boolean {
  const isHttps = result.meta.finalUrl.toLowerCase().startsWith("https://");

  if (!isHttps) {
    return true;
  }

  if (!result.ssl.valid) {
    return true;
  }

  if (result.ssl.selfSigned) {
    return true;
  }

  if (result.ssl.weakProtocol || result.ssl.weakCipher) {
    return true;
  }

  if (result.intelligence.activePhishingIndicators) {
    return true;
  }

  return false;
}

export function calculateThreatLevel(result: ScanResult, score: number): ThreatLevel {
  if (result.reputation?.verdict === "malicious") {
    return "critical";
  }

  if (result.findings.some((finding) => finding.severity === "critical")) {
    return "critical";
  }

  if (hasHardRiskForHighThreatTier(result)) {
    return "high";
  }

  if (score < 40) {
    return "medium";
  }

  if (score < 70 || result.reputation?.verdict === "suspicious") {
    return "medium";
  }

  const redirectIntent = result.redirects.analysis?.intent;
  const redirectSuspicious =
    redirectIntent === "suspicious" || (redirectIntent === undefined && result.redirects.suspicious);
  if (redirectSuspicious) {
    return "medium";
  }

  return "low";
}
