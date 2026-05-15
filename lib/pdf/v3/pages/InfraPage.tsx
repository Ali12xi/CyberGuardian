import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LtrText } from "@/lib/pdf/phaseA/LtrText";
import { bf, FixedPageFooterV3, InfoCardV3, SectionTitleV3, footerReservePt, type LocaleV3 } from "@/lib/pdf/v3/components";
import { A4_H, A4_W, CONTENT_W, MARGIN, dark, typo } from "@/lib/pdf/v3/constants";
import type { PdfReportDataV3 } from "@/lib/pdf/v3/mapV3";

const gap = 8;
const col2 = Math.floor((CONTENT_W - gap) / 2);
const col4 = Math.floor((CONTENT_W - gap * 3) / 4);

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
  stripeCard: {
    flexDirection: "row",
    backgroundColor: dark.cardBg,
    borderWidth: 1,
    borderColor: dark.cardBorder,
    borderRadius: 8,
    marginBottom: gap,
    overflow: "hidden",
  },
  stripeG: { width: 3, backgroundColor: dark.green },
  stripeR: { width: 3, backgroundColor: dark.red },
  stripeA: { width: 3, backgroundColor: dark.amber },
  body: { flex: 1, padding: 10 },
  h: { fontSize: 8, fontWeight: 700, marginBottom: 4 },
  list: { fontSize: typo.body, color: dark.textSecondary },
});

function t(locale: LocaleV3, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

export function InfraPageV3({ data, locale }: { data: PdfReportDataV3; locale: LocaleV3 }) {
  const tls = data.tlsCards;
  const rowTls = [
    { a: tls[0], b: tls[1] },
    { a: tls[2], b: tls[3] },
    { a: tls[4], b: tls[5] },
  ];
  const presentStr = data.presentHeaders.length ? data.presentHeaders.join(", ") : "-";
  const missingStr = data.missingHeaders.length ? data.missingHeaders.join(", ") : "-";
  const impact = locale === "ar" ? data.headersImpactAr : data.headersImpactEn;
  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap={false}>
      <SectionTitleV3 title={t(locale, "TLS & Infrastructure", "TLS والبنية التحتية")} locale={locale} />
      {rowTls.map((row, i) => (
        <View key={i} style={s.row}>
          <InfoCardV3 label={row.a.label} value={row.a.value} locale={locale} width={col2} />
          <InfoCardV3 label={row.b.label} value={row.b.value} locale={locale} width={col2} />
        </View>
      ))}

      <SectionTitleV3 title={t(locale, "Security Headers", "رؤوس الأمان")} locale={locale} />
      <View style={s.stripeCard}>
        <View style={s.stripeG} />
        <View style={s.body}>
          <Text style={[s.h, { color: dark.green }, bf(locale)]}>Present</Text>
          <LtrText value={presentStr} style={[s.list, bf(locale)]} />
        </View>
      </View>
      <View style={s.stripeCard}>
        <View style={s.stripeR} />
        <View style={s.body}>
          <Text style={[s.h, { color: dark.red }, bf(locale)]}>Missing</Text>
          <LtrText value={missingStr} style={[s.list, bf(locale)]} />
        </View>
      </View>
      <View style={s.stripeCard}>
        <View style={s.stripeA} />
        <View style={s.body}>
          <Text style={[s.h, { color: dark.amber }, bf(locale)]}>Impact</Text>
          <Text style={[s.list, bf(locale)]}>{impact}</Text>
        </View>
      </View>

      <SectionTitleV3 title={t(locale, "Scan Metadata", "بيانات الفحص")} locale={locale} />
      <View style={s.row}>
        {data.scanMetaRow1.map((c, i) => (
          <InfoCardV3 key={i} label={c.label} value={c.value} locale={locale} width={col4} />
        ))}
      </View>
      <View style={s.row}>
        {data.scanMetaRow2.map((c, i) => (
          <InfoCardV3 key={i} label={c.label} value={c.value} locale={locale} width={col4} />
        ))}
      </View>

      <FixedPageFooterV3 locale={locale} />
    </Page>
  );
}
