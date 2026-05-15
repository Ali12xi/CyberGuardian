/** PDF V5 — A4 pt, dark palette, TTF-backed typography scale. */

export const A4_W = 595;
export const A4_H = 842;
export const MARGIN = 40;
export const CONTENT_W = A4_W - MARGIN * 2;

export const FOOTER_H = 30;
export const FOOTER_RESERVE = FOOTER_H + 10;

export const colors = {
  pageBg: "#050a14",
  cardBg: "#0d1625",
  deepBg: "#060b14",
  border: "#1e2a3a",
  brandCyan: "#00d4b4",
  muted: "#6b7a8d",
  body: "#b0bec5",
  white: "#e8edf5",
  barGood: "#00d4b4",
  barMid: "#f59e0b",
  barBad: "#ef4444",
  critical: "#ef4444",
  criticalBg: "#2a0f0f",
  medium: "#f59e0b",
  mediumBg: "#2a1a06",
  low: "#3b82f6",
  lowBg: "#0a1530",
  clean: "#22c55e",
  cleanBg: "#0f2918",
} as const;

export const typo = {
  brand: 8,
  heroDomain: 22,
  section: 13,
  body: 9,
  bodyLg: 10,
  meta: 7,
  badge: 8,
  scoreHuge: 28,
  footer: 7,
} as const;

/** Fresh UTF-8 — category labels for charts (do not refactor through Windows paths). */
export const CATEGORY_LABEL_EN: Record<string, string> = {
  tls: "TLS & certificate",
  headers: "Security headers",
  infrastructure: "Infrastructure",
  domain: "Domain trust",
  redirects: "Redirect safety",
};

export const CATEGORY_LABEL_AR: Record<string, string> = {
  tls: "TLS والشهادة",
  headers: "رؤوس الأمان",
  infrastructure: "البنية التحتية",
  domain: "ثقة النطاق",
  redirects: "سلامة التوجيه",
};

/** Calmer page rhythm — fewer cards per sheet (reference pacing). */
export const FINDINGS_PER_PAGE = 2;
export const ACTIONS_PER_PAGE = 2;

export const TRACKED_HEADERS = [
  "strict-transport-security",
  "content-security-policy",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
] as const;

export const BRAND_NAME = "CyberGurdian AI";
export const BRAND_TAGLINE_EN = "Security Intelligence Report";
export const BRAND_TAGLINE_AR = "\u062a\u0642\u0631\u064a\u0631 \u0630\u0643\u0627\u0621 \u0623\u0645\u0646\u064a";
export const BRAND_FOOTER_EN = "CyberGurdian AI \u00a9 2026 \u00b7 V1.6";
export const BRAND_FOOTER_AR = "CyberGurdian AI \u00a9 2026 \u00b7 V1.6";

export const SEVERITY_STYLES = {
  critical: {
    borderColor: "#ef4444",
    badgeBg: "#2a0f0f",
    badgeColor: "#ef4444",
    cardBorderWidth: 4,
    titleSize: 14,
    titleWeight: 700,
    cardPaddingV: 20,
    cardPaddingH: 20,
    layerOpacity: 1,
    badgeFontSize: 9,
  },
  high: {
    borderColor: "#ef4444",
    badgeBg: "#2a0f0f",
    badgeColor: "#ef4444",
    cardBorderWidth: 3,
    titleSize: 13,
    titleWeight: 600,
    cardPaddingV: 18,
    cardPaddingH: 18,
    layerOpacity: 1,
    badgeFontSize: 9,
  },
  medium: {
    borderColor: "#f59e0b",
    badgeBg: "#2a1a06",
    badgeColor: "#f59e0b",
    cardBorderWidth: 2,
    titleSize: 12,
    titleWeight: 500,
    cardPaddingV: 14,
    cardPaddingH: 16,
    layerOpacity: 0.9,
    badgeFontSize: 9,
  },
  low: {
    borderColor: "#3b82f6",
    badgeBg: "#0a1530",
    badgeColor: "#3b82f6",
    cardBorderWidth: 1,
    titleSize: 11,
    titleWeight: 400,
    cardPaddingV: 10,
    cardPaddingH: 14,
    layerOpacity: 0.75,
    badgeFontSize: 9,
  },
} as const;
