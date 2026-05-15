import { StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { LtrText } from "@/lib/pdf/phaseA/LtrText";
import { A4, contentWidthV2, dark, marginV2, severityStyles, typo } from "@/lib/pdf/v2/constants";
import { getPdfBodyFont } from "@/lib/pdf/phaseB/pdfFonts";

export type LocaleV2 = "en" | "ar";

const footerH = 32;

const s = StyleSheet.create({
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stripe: {
    width: 3,
    height: 14,
    backgroundColor: dark.accentCyan,
    marginRight: 8,
  },
  sectionText: {
    fontSize: typo.sectionTitle,
    fontWeight: 700,
    color: dark.textPrimary,
  },
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
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: typo.cardValue,
    fontWeight: 700,
    color: dark.textPrimary,
  },
  badge: {
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  badgeText: {
    fontSize: typo.badge,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  footerWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: A4.width,
    height: footerH,
    backgroundColor: dark.footerBar,
    borderTopWidth: 1,
    borderTopColor: dark.footerBorder,
    paddingHorizontal: marginV2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    fontSize: 7,
    color: dark.textMuted,
    maxWidth: contentWidthV2 * 0.65,
  },
  footerRight: {
    fontSize: 7,
    color: dark.textMuted,
  },
});

function bodyFont(locale: LocaleV2): Style {
  return { fontFamily: getPdfBodyFont(locale) };
}

export function sectionStripe(): object {
  return s.stripe;
}

export function SectionTitle({ title, locale }: { title: string; locale: LocaleV2 }) {
  return (
    <View style={s.sectionRow} wrap={false}>
      <View style={s.stripe} />
      <Text style={[s.sectionText, bodyFont(locale)]}>{title}</Text>
    </View>
  );
}

export function InfoCard({
  label,
  value,
  locale,
  width,
  valueFontSize,
}: {
  label: string;
  value: string;
  locale: LocaleV2;
  width: number;
  valueFontSize?: number;
}) {
  const valueStyle =
    valueFontSize !== undefined ? [s.infoValue, bodyFont(locale), { fontSize: valueFontSize }] : [s.infoValue, bodyFont(locale)];
  return (
    <View style={[s.infoCard, { width }]} wrap={false}>
      <Text style={[s.infoLabel, bodyFont(locale)]}>{label}</Text>
      <LtrText value={value} style={valueStyle} />
    </View>
  );
}

function mapSeverityKey(level: string): keyof typeof severityStyles {
  const u = level.toUpperCase();
  if (u === "CRITICAL" || u === "HIGH") {
    return "HIGH";
  }
  if (u === "MEDIUM") {
    return "MEDIUM";
  }
  return "LOW";
}

export function SeverityBadge({ level, locale }: { level: string; locale: LocaleV2 }) {
  const key = mapSeverityKey(level);
  const pal = severityStyles[key];
  return (
    <View style={[s.badge, { backgroundColor: pal.bg, borderColor: pal.border }]} wrap={false}>
      <Text style={[s.badgeText, { color: pal.text }, bodyFont(locale)]}>{level}</Text>
    </View>
  );
}

export function PageFooterV2({ page, total, locale }: { page: number; total: number; locale: LocaleV2 }) {
  const left =
    locale === "ar"
      ? "CyberGurdian AI — تقرير أمني خارجي"
      : "CyberGurdian AI — External Security Report";
  const right = `Page ${page} of ${total}`;
  return (
    <View style={s.footerWrap} fixed>
      <Text style={[s.footerLeft, locale === "ar" ? { textAlign: "right" } : { textAlign: "left" }, bodyFont(locale)]}>
        {left}
      </Text>
      <LtrText value={right} style={[s.footerRight, bodyFont(locale)]} />
    </View>
  );
}

export function footerReserveV2(): number {
  return footerH + 6;
}
