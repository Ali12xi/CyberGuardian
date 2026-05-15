import { Page, StyleSheet, View } from "@react-pdf/renderer";
import { FixedPageFooterV3, InfoCardV3, SectionTitleV3, footerReservePt, type LocaleV3 } from "@/lib/pdf/v3/components";
import { A4_H, A4_W, CONTENT_W, MARGIN, dark } from "@/lib/pdf/v3/constants";
import type { PdfReportDataV3 } from "@/lib/pdf/v3/mapV3";

const gap = 8;
const col2 = Math.floor((CONTENT_W - gap) / 2);

const s = StyleSheet.create({
  page: {
    width: A4_W,
    height: A4_H,
    backgroundColor: dark.pageBg,
    padding: MARGIN,
    paddingBottom: MARGIN + footerReservePt(),
    color: dark.textPrimary,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: gap },
});

function t(locale: LocaleV3, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

export function ThreatIntelPageV3({ data, locale }: { data: PdfReportDataV3; locale: LocaleV3 }) {
  const cards = data.threatIntelCards;
  const rows: { a: (typeof cards)[0]; b?: (typeof cards)[0] }[] = [];
  for (let i = 0; i < cards.length; i += 2) {
    rows.push({ a: cards[i], b: cards[i + 1] });
  }
  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap={false}>
      <SectionTitleV3 title={t(locale, "Threat Intelligence", "ذكاء التهديدات")} locale={locale} />
      {rows.map((row, i) => (
        <View key={i} style={s.row}>
          <InfoCardV3 label={row.a.label} value={row.a.value} locale={locale} width={col2} />
          {row.b !== undefined ? (
            <InfoCardV3 label={row.b.label} value={row.b.value} locale={locale} width={col2} />
          ) : (
            <View style={{ width: col2 }} />
          )}
        </View>
      ))}
      <FixedPageFooterV3 locale={locale} />
    </Page>
  );
}
