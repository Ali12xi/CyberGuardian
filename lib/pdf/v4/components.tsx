import type { ReactNode } from "react";
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
} from "@/lib/pdf/v4/constants";

export type LocaleV4 = "en" | "ar";

const LRM = "\u200e";

export function bf(locale: LocaleV4): Style {
  return { fontFamily: getPdfBodyFont(locale) };
}

const s = StyleSheet.create({
  sectionRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  stripe: { width: 3, height: 14, backgroundColor: dark.accentCyan, marginRight: 8 },
  sectionText: { fontSize: typo.section, fontWeight: 700, color: dark.textPrimary },
  sectionMuted: { fontSize: typo.sectionMuted, fontWeight: 600, color: dark.textSecondary },
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
  badge: { borderRadius: 4, paddingVertical: 3, paddingHorizontal: 8, alignSelf: "flex-start", borderWidth: 1 },
  badgeText: { fontSize: typo.badge, fontWeight: 700 },
  fieldLabel: { fontSize: typo.bodyLarge, fontWeight: 600, color: dark.textSecondary, marginBottom: 2 },
  fieldValue: { fontSize: typo.body, color: dark.textPrimary, lineHeight: 1.35 },
});

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

function severityDisplay(level: string, locale: LocaleV4): string {
  const u = level.toLowerCase();
  if (locale === "ar") {
    if (u === "critical") {
      return "حرج";
    }
    if (u === "high") {
      return "عالٍ";
    }
    if (u === "medium") {
      return "متوسط";
    }
    if (u === "informational") {
      return "إعلامي";
    }
    return "منخفض";
  }
  if (u === "critical") {
    return "Critical";
  }
  if (u === "high") {
    return "High";
  }
  if (u === "medium") {
    return "Medium";
  }
  if (u === "informational") {
    return "Informational";
  }
  return "Low";
}

export function SectionTitleV4({ title, locale, muted }: { title: string; locale: LocaleV4; muted?: boolean }) {
  return (
    <View style={s.sectionRow} wrap>
      <View style={s.stripe} />
      <Text style={[muted ? s.sectionMuted : s.sectionText, bf(locale)]}>{title}</Text>
    </View>
  );
}

export function SeverityBadgeV4({ level, locale }: { level: string; locale: LocaleV4 }) {
  const pal = severityPal(level);
  const label = severityDisplay(level, locale);
  return (
    <View style={[s.badge, { backgroundColor: pal.bg, borderColor: pal.border }]} wrap={false}>
      <Text style={[s.badgeText, { color: pal.text }, bf(locale)]}>{label}</Text>
    </View>
  );
}

export function FixedPageFooterV4({ locale }: { locale: LocaleV4 }) {
  const left =
    locale === "ar"
      ? "CyberGurdian AI — تقرير ذكاء أمني تنفيذي"
      : "CyberGurdian AI — Executive security intelligence";
  return (
    <View style={s.footerBar} fixed>
      <Text style={[s.footerLeft, bf(locale)]}>{left}</Text>
      <Text
        style={[s.footerRight, bf(locale)]}
        render={({ pageNumber, totalPages }) =>
          locale === "ar"
            ? `صفحة ${LRM}${pageNumber}${LRM} من ${LRM}${totalPages}${LRM}`
            : `${LRM}Page ${pageNumber} of ${totalPages}${LRM}`
        }
      />
    </View>
  );
}

export function footerReservePt(): number {
  return FOOTER_RESERVE;
}

export function FieldBlockV4({
  label,
  children,
  locale,
}: {
  label: string;
  locale: LocaleV4;
  children: ReactNode;
}) {
  return (
    <View style={{ marginBottom: 8 }} wrap>
      <Text style={[s.fieldLabel, bf(locale)]}>{label}</Text>
      {children}
    </View>
  );
}

export function LtrFieldValueV4({ value, locale }: { value: string; locale: LocaleV4 }) {
  return <LtrText value={value} style={[s.fieldValue, bf(locale)]} />;
}
