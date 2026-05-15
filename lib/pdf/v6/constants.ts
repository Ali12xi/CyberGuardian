/** PDF V6 executive cover — tokens aligned with V5 identity; spacing tuned for cover-only rhythm. */

export const A4_W = 595;
export const A4_H = 842;
export const MARGIN = 40;
export const CONTENT_W = A4_W - MARGIN * 2;

export const FOOTER_H = 30;
export const FOOTER_RESERVE = FOOTER_H + 12;

/** Vertical rhythm between major cover blocks (pt). */
export const coverSpacing = {
  afterTopRow: 22,
  afterBanner: 26,
  afterDomain: 10,
  afterMeta: 20,
  afterExec: 28,
  afterCards: 28,
  beforeBreakdown: 6,
  barGap: 12,
} as const;

export const colors = {
  pageBg: "#050a14",
  cardBg: "#0b1220",
  deepBg: "#060b14",
  border: "#1e2a3a",
  brandCyan: "#00d4b4",
  muted: "#6b7a8d",
  body: "#9fb0c2",
  white: "#e8edf5",
  barGood: "#00d4b4",
  barMid: "#f59e0b",
  barBad: "#ef4444",
  bannerUrgentBg: "#2a0f0f",
  bannerUrgentBorder: "#ef4444",
  bannerUrgentText: "#fecaca",
  bannerSoonBg: "#2a1a06",
  bannerSoonBorder: "#f59e0b",
  bannerSoonText: "#fde68a",
  bannerCalmBg: "#0f2918",
  bannerCalmBorder: "#22c55e",
  bannerCalmText: "#bbf7d0",
} as const;

export const typo = {
  brandCaps: 7.5,
  scoreHero: 34,
  scoreFrac: 11,
  gradeHero: 30,
  gradeLabel: 6.5,
  decisionBanner: 11,
  domain: 24,
  meta: 7,
  exec: 10,
  cardLabel: 6.5,
  cardValue: 15,
  cardSub: 7,
  breakdownTitle: 7,
  barLabel: 7,
  footer: 7,
} as const;

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

export const BRAND_FOOTER_EN = "CyberGurdian AI \u00a9 2026 \u00b7 V1.6";
export const BRAND_FOOTER_AR = "CyberGurdian AI \u00a9 2026 \u00b7 V1.6";
export const BRAND_TAGLINE_AR = "\u062a\u0642\u0631\u064a\u0631 \u0630\u0643\u0627\u0621 \u0623\u0645\u0646\u064a";
