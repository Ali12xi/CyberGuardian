import { A4 } from "@/lib/pdf/phaseA/constants";

export { A4 };

/** Tighter executive margins (phaseA margin unchanged). */
export const marginV2 = 28;
export const contentWidthV2 = A4.width - marginV2 * 2;

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
  purple: "#8B5CF6",
  footerBar: "#0F172A",
  footerBorder: "#1E293B",
  arcTrack: "#1E293B",
} as const;

export const typo = {
  reportTitle: 22,
  sectionTitle: 13,
  cardLabel: 7,
  cardValue: 11,
  body: 9,
  meta: 8,
  badge: 7,
  threatHero: 28,
  brand: 9,
  version: 7,
} as const;

export const severityStyles = {
  HIGH: {
    bg: "#450A0A",
    text: "#EF4444",
    border: "#EF4444",
  },
  MEDIUM: {
    bg: "#451A03",
    text: "#F59E0B",
    border: "#F59E0B",
  },
  LOW: {
    bg: "#052E16",
    text: "#10B981",
    border: "#10B981",
  },
} as const;
