import { StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { LtrText } from "@/lib/pdf/phaseA/LtrText";
import { getPdfBodyFont } from "@/lib/pdf/phaseB/pdfFonts";
import {
  A4_H,
  A4_W,
  CONTENT_W,
  dark,
  FOOTER_H,
  FOOTER_RESERVE,
  typo,
} from "@/lib/pdf/v3/constants";

export type LocaleV3 = "en" | "ar";

export function bf(locale: LocaleV3): Style {
  return { fontFamily: getPdfBodyFont(locale) };
}

const s = StyleSheet.create({
  sectionRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  stripe: { width: 3, height: 14, backgroundColor: dark.accentCyan, marginRight: 8 },
  sectionText: { fontSize: typo.section, fontWeight: 700, color: dark.textPrimary },
  infoCard: {
    backgroundColor: dark.cardBg,
    borderWidth: 1,
    borderColor: dark.cardBorder,
    borderRadius: 8,
    padding: 10,
  },
  infoLabel: {
    fontSize: typo.cardLabel,
    color: dark.accentCyan,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  infoValue: { fontSize: typo.cardValue, fontWeight: 700, color: dark.textPrimary },
  badge: { borderRadius: 4, paddingVertical: 3, paddingHorizontal: 8, alignSelf: "flex-start", borderWidth: 1 },
  badgeText: { fontSize: typo.badge, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" },
  footerBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: A4_W,
    height: FOOTER_H,
    backgroundColor: dark.cardBg,
    borderTopWidth: 1,
    borderTopColor: dark.cardBorder,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  footerLeft: { fontSize: typo.footer, color: dark.textMuted, maxWidth: CONTENT_W * 0.62 },
  footerRight: { fontSize: typo.footer, color: dark.textMuted },
});

export function SectionTitleV3({ title, locale }: { title: string; locale: LocaleV3 }) {
  return (
    <View style={s.sectionRow} wrap>
      <View style={s.stripe} />
      <Text style={[s.sectionText, bf(locale)]}>{title}</Text>
    </View>
  );
}

export function InfoCardV3({
  label,
  value,
  locale,
  width,
  valueFontSize,
}: {
  label: string;
  value: string;
  locale: LocaleV3;
  width: number;
  valueFontSize?: number;
}) {
  const vs =
    valueFontSize !== undefined
      ? [s.infoValue, bf(locale), { fontSize: valueFontSize }]
      : [s.infoValue, bf(locale)];
  return (
    <View style={[s.infoCard, { width }]} wrap>
      <Text style={[s.infoLabel, bf(locale)]}>{label}</Text>
      <LtrText value={value} style={vs} />
    </View>
  );
}

function severityPal(level: string): { bg: string; text: string; border: string } {
  const u = level.toUpperCase();
  if (u === "CRITICAL" || u === "HIGH") {
    return { bg: "#450A0A", text: "#EF4444", border: "#EF4444" };
  }
  if (u === "MEDIUM") {
    return { bg: "#451A03", text: "#F59E0B", border: "#F59E0B" };
  }
  return { bg: "#052E16", text: "#10B981", border: "#10B981" };
}

export function SeverityBadgeV3({ level, locale }: { level: string; locale: LocaleV3 }) {
  const pal = severityPal(level);
  return (
    <View style={[s.badge, { backgroundColor: pal.bg, borderColor: pal.border }]} wrap={false}>
      <Text style={[s.badgeText, { color: pal.text }, bf(locale)]}>{level}</Text>
    </View>
  );
}

/** Fixed footer; page numbers from react-pdf Text render (totalPages correct). */
export function FixedPageFooterV3({ locale }: { locale: LocaleV3 }) {
  const left =
    locale === "ar"
      ? "CyberGurdian AI — تقرير أمني خارجي"
      : "CyberGurdian AI — External Security Report";
  return (
    <View style={s.footerBar} fixed>
      <Text style={[s.footerLeft, bf(locale)]}>{left}</Text>
      <Text
        style={[s.footerRight, bf(locale)]}
        render={({ pageNumber, totalPages }) =>
          `\u200ePage ${pageNumber} of ${totalPages}\u200e`
        }
      />
    </View>
  );
}

export function footerReservePt(): number {
  return FOOTER_RESERVE;
}
