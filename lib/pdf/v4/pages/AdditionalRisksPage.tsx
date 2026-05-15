import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { bf, FixedPageFooterV4, SectionTitleV4, SeverityBadgeV4, footerReservePt, type LocaleV4 } from "@/lib/pdf/v4/components";
import { A4_H, A4_W, MARGIN, dark, typo } from "@/lib/pdf/v4/constants";
import type { PdfV4CompactRisk } from "@/lib/pdf/v4/mapV4";

const s = StyleSheet.create({
  page: {
    width: A4_W,
    height: A4_H,
    backgroundColor: dark.pageBg,
    padding: MARGIN,
    paddingBottom: MARGIN + footerReservePt(),
    color: dark.textPrimary,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    padding: 8,
    backgroundColor: dark.cardBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: dark.cardBorder,
  },
  title: { fontSize: 9, fontWeight: 700, color: dark.textPrimary, flex: 1, marginLeft: 8 },
  blurb: { fontSize: typo.meta, color: dark.textMuted, marginTop: 4, lineHeight: 1.35 },
});

function t(locale: LocaleV4, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

function CompactRow({ r, locale }: { r: PdfV4CompactRisk; locale: LocaleV4 }) {
  const ta = locale === "ar" ? { textAlign: "right" as const } : {};
  return (
    <View style={s.row} wrap>
      <SeverityBadgeV4 level={r.severity} locale={locale} />
      <View style={{ flex: 1 }}>
        <Text style={[s.title, bf(locale), ta]} wrap>
          {r.title}
        </Text>
        <Text style={[s.blurb, bf(locale), ta]} wrap>
          {r.blurb}
        </Text>
      </View>
    </View>
  );
}

export function AdditionalRisksPageV4({
  chunk,
  locale,
  pageIndex,
}: {
  chunk: PdfV4CompactRisk[];
  locale: LocaleV4;
  pageIndex: number;
}) {
  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap={false}>
      <SectionTitleV4
        title={t(
          locale,
          pageIndex === 0 ? "Additional risks" : "Additional risks (continued)",
          pageIndex === 0 ? "مخاطر إضافية" : "مخاطر إضافية (تابع)",
        )}
        locale={locale}
      />
      {chunk.map((r, i) => (
        <CompactRow key={i} r={r} locale={locale} />
      ))}
      <FixedPageFooterV4 locale={locale} />
    </Page>
  );
}
