/** Denominator for UI (e.g. x/95); not an achievable raw score. */
export const MAX_SCORE = 95;
/** Deterministic scores are clamped here so no target reaches MAX_SCORE. */
export const MAX_ACHIEVABLE_SCORE = MAX_SCORE - 1;
export const MIN_SCORE = 0;
export const PASSING_SCORE = 50;

/** Combined cap for observability / edge coverage credits (see applyCoverageCreditCap). */
export const MAX_COVERAGE_CREDIT = 16;

export const COVERAGE_CREDIT_IDS = [
  "observabilityAwareTransportCredit",
  "observableEdgeHardening",
  "edgeManagedHeaderSurface",
] as const;

export const POSITIVE_SIGNALS = {
  httpsEnabled: 12,
  validCertificate: 18,
  modernTlsVersion: 12,
  modernCipherSuite: 6,
  hstsEnabled: 8,
  cspPresent: 8,
  xFrameOptions: 5,
  xContentTypeOptions: 4,
  noRedirectChain: 6,
  cleanInfrastructure: 6,
  /**
   * TLS identity was fully observed while browser policy headers were not on a fully trustworthy surface.
   * Reflects limited observability in coverage — not proof headers are absent site-wide.
   */
  observabilityAwareTransportCredit: 18,
  /** When header policy cannot be fully observed, credit observable CDN/WAF/edge signals (evidence-based). */
  observableEdgeHardening: 8,
  /**
   * Full header observability on this response, but no tracked security headers while CDN/WAF signals exist.
   * Credits likely edge-managed policy rather than treating absence as unmitigated risk.
   */
  edgeManagedHeaderSurface: 24,
} as const;

export const NEGATIVE_PENALTIES = {
  noHttps: -30,
  invalidCertificate: -25,
  selfSignedCert: -15,
  weakTlsVersion: -10,
  weakCipherSuite: -8,
  /** Applied only when browser headers were fully observed (absence is evidence). */
  missingHsts: -5,
  missingCsp: -5,
  missingXFrame: -3,
  missingXContentType: -2,
  suspiciousRedirect: -10,
  longRedirectChain: -5,
  suspiciousDomain: -12,
  maliciousReputation: -25,
  /** Applied only with full infrastructure observability; magnitude scales with exposure score. */
  serverExposure: -4,
} as const;

export const SCORE_CEILINGS = {
  invalidCertificate: 45,
  noHttps: 30,
  maliciousReputation: 20,
  criticalFinding: 60,
  highFinding: 75,
} as const;
