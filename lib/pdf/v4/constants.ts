/** PDF V4 — layout in pt (inherits V3 geometry). */

export const A4_W = 595;
export const A4_H = 842;
export const MARGIN = 40;
export const CONTENT_W = A4_W - MARGIN * 2;
export const CONTENT_H = A4_H - MARGIN * 2;

export const FOOTER_H = 32;
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
  section: 14,
  sectionMuted: 11,
  cardLabel: 8,
  cardValue: 12,
  body: 9,
  bodyLarge: 10,
  meta: 8,
  badge: 7,
  footer: 7,
  threatHero: 22,
  keyObservation: 10,
  riskTitle: 11,
  micro: 7,
} as const;

export const TOP_RISKS_COUNT = 3;
export const ADDITIONAL_RISKS_PER_PAGE = 4;
export const ACTIONS_PER_PAGE = 3;

export const MAX_SNIPPET = 320;
export const MAX_NARRATIVE = 200;
