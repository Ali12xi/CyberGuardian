/** PDF V3 layout — all dimensions in pt (points). A4 = 595 × 842 pt. */

export const A4_W = 595;
export const A4_H = 842;
export const MARGIN = 40;
export const CONTENT_W = A4_W - MARGIN * 2;
export const CONTENT_H = A4_H - MARGIN * 2;

export const FOOTER_H = 32;
export const FOOTER_BOTTOM = 0;

/** Vertical space reserved above footer inside content flow. */
export const FOOTER_RESERVE = FOOTER_H + 8;

export const dark = {
  pageBg: "#020617",
  cardBg: "#0F172A",
  cardBorder: "#1E293B",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#475569",
  metaText: "#64748B",
  accentCyan: "#06B6D4",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  arcTrack: "#1E293B",
} as const;

export const typo = {
  brand: 9,
  reportTitle: 22,
  section: 13,
  cardLabel: 7,
  cardValue: 11,
  body: 9,
  meta: 8,
  badge: 7,
  footer: 7,
  threatHero: 24,
} as const;

/** Cover section height budgets (pt). */
export const COVER_HERO_H = 100;
export const COVER_METHOD_H = 60;
export const COVER_META_GRID_H = 110;
export const COVER_SUMMARY_H = 70;

/** Analytics page budgets (pt). */
export const ANALYTICS_ROW_H = 180;
export const ANALYTICS_ATTACK_H = 120;

/** Card fixed heights (pt). */
export const FINDING_CARD_H = 110;
export const REC_CARD_H = 90;

export const MAX_TITLE = 80;
export const MAX_DESC = 120;
export const MAX_META = 100;

export const FINDINGS_PER_PAGE = 4;
export const RECS_PER_PAGE = 5;
export const THREAT_INTEL_MAX_CARDS = 8;
