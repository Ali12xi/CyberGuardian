import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { bf, FixedPageFooterV3, SectionTitleV3, SeverityBadgeV3, footerReservePt, type LocaleV3 } from "@/lib/pdf/v3/components";
import { A4_H, A4_W, FINDING_CARD_H, MARGIN, dark, typo } from "@/lib/pdf/v3/constants";
import type { PdfV3Finding } from "@/lib/pdf/v3/mapV3";

const s = StyleSheet.create({
  page: {
    width: A4_W,
    height: A4_H,
    backgroundColor: dark.pageBg,
    padding: MARGIN,
    paddingBottom: MARGIN + footerReservePt(),
    color: dark.textPrimary,
  },
  card: {
    height: FINDING_CARD_H,
    backgroundColor: dark.cardBg,
    borderWidth: 1,
    borderColor: dark.cardBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  title: { fontSize: 10, fontWeight: 700, color: dark.textPrimary, marginTop: 4 },
  desc: { fontSize: typo.body, color: dark.textSecondary, marginTop: 4, lineHeight: 1.25 },
  meta: { fontSize: typo.meta, color: dark.metaText, marginTop: 4 },
});

function t(locale: LocaleV3, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

export function FindingsPageV3({
  findings,
  locale,
  sectionTitle,
}: {
  findings: PdfV3Finding[];
  locale: LocaleV3;
  sectionTitle: string;
}) {
  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap={false}>
      <SectionTitleV3 title={sectionTitle} locale={locale} />
      {findings.map((f, i) => (
        <View key={i} style={s.card} wrap>
          <View style={{ flexDirection: "row", alignItems: "center" }} wrap={false}>
            <SeverityBadgeV3 level={f.severity} locale={locale} />
          </View>
          <Text style={[s.title, bf(locale)]}>{f.title}</Text>
          <Text style={[s.desc, bf(locale)]} wrap={false}>
            {f.description}
          </Text>
          <Text style={[s.meta, bf(locale)]} wrap={false}>
            {f.impactLine}
          </Text>
        </View>
      ))}
      <FixedPageFooterV3 locale={locale} />
    </Page>
  );
}
