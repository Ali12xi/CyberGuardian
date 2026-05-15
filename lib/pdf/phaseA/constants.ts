/** A4 portrait — print-first (pt). */
export const A4 = { width: 595, height: 842 } as const;

export const pageCount = 5;

export const margin = 40;

export const contentWidth = A4.width - margin * 2;

export const palette = {
  white: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecond: "#64748B",
  textMuted: "#94A3B8",
  separator: "#E2E8F0",
  surface: "#F8FAFC",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  /** Low-threat pill (cover / assessment). */
  pillLowBg: "#DCFCE7",
  pillLowText: "#15803D",
} as const;
