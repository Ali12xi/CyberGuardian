import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LtrText } from "@/lib/pdf/phaseA/LtrText";
import { bf, FixedPageFooterV4, SectionTitleV4, footerReservePt, type LocaleV4 } from "@/lib/pdf/v4/components";
import { A4_H, A4_W, CONTENT_W, MARGIN, dark, typo } from "@/lib/pdf/v4/constants";
import type { PdfReportDataV4 } from "@/lib/pdf/v4/mapV4";

const gap = 6;
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
  cell: {
    width: col2,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: dark.cardBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: dark.cardBorder,
  },
  lab: { fontSize: typo.cardLabel, color: dark.textMuted, marginBottom: 2 },
});

function t(locale: LocaleV4, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

export function ThreatInfraPageV4({ data, locale }: { data: PdfReportDataV4; locale: LocaleV4 }) {
  const rows = data.threatInfraRows;
  const pairs: { a: (typeof rows)[0]; b?: (typeof rows)[0] }[] = [];
  for (let i = 0; i < rows.length; i += 2) {
    pairs.push({ a: rows[i], b: rows[i + 1] });
  }
  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap={false}>
      <SectionTitleV4
        title={t(locale, "Threat intelligence & infrastructure", "ذكاء التهديدات والبنية")}
        locale={locale}
      />
      <Text style={[{ fontSize: typo.meta, color: dark.textMuted, marginBottom: 8, lineHeight: 1.35 }, bf(locale), locale === "ar" ? { textAlign: "right" } : {}]} wrap>
        {t(
          locale,
          "Supporting context from external telemetry—compressed for executive reading.",
          "سياق داعم من القياسات الخارجية—مضغوط للقراءة التنفيذية.",
        )}
      </Text>
      {pairs.map((pair, i) => (
        <View key={i} style={s.row}>
          <View style={s.cell}>
            <Text style={[s.lab, bf(locale)]}>{locale === "ar" ? pair.a.labelAr : pair.a.labelEn}</Text>
            <LtrText value={pair.a.value} style={[{ fontSize: typo.body, color: dark.textPrimary }, bf(locale)]} />
          </View>
          {pair.b !== undefined ? (
            <View style={s.cell}>
              <Text style={[s.lab, bf(locale)]}>{locale === "ar" ? pair.b.labelAr : pair.b.labelEn}</Text>
              <LtrText value={pair.b.value} style={[{ fontSize: typo.body, color: dark.textPrimary }, bf(locale)]} />
            </View>
          ) : (
            <View style={{ width: col2 }} />
          )}
        </View>
      ))}
      <FixedPageFooterV4 locale={locale} />
    </Page>
  );
}
