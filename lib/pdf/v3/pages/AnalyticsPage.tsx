import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { AttackSurfaceBarsV3, DonutChartV3, GaugeChartV3, ScoreBreakdownBarsV3 } from "@/lib/pdf/v3/charts";
import { bf, FixedPageFooterV3, SectionTitleV3, footerReservePt, type LocaleV3 } from "@/lib/pdf/v3/components";
import { A4_H, A4_W, ANALYTICS_ATTACK_H, ANALYTICS_ROW_H, CONTENT_W, MARGIN, dark } from "@/lib/pdf/v3/constants";
import type { PdfReportDataV3 } from "@/lib/pdf/v3/mapV3";

const s = StyleSheet.create({
  page: {
    width: A4_W,
    height: A4_H,
    backgroundColor: dark.pageBg,
    padding: MARGIN,
    paddingBottom: MARGIN + footerReservePt(),
    color: dark.textPrimary,
  },
  analyticsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    height: ANALYTICS_ROW_H,
    marginTop: 8,
  },
  block: { width: Math.floor((CONTENT_W - 16) / 3), alignItems: "center" },
  attackWrap: { marginTop: 12, height: ANALYTICS_ATTACK_H },
});

function t(locale: LocaleV3, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

export function AnalyticsPageV3({ data, locale }: { data: PdfReportDataV3; locale: LocaleV3 }) {
  const rows = data.scoreRows.map((r) => ({
    label: locale === "ar" ? r.labelAr : r.labelEn,
    score: r.score,
    maxScore: r.maxScore,
    color: r.color,
  }));
  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap={false}>
      <SectionTitleV3
        title={t(locale, "Security Intelligence Analytics", "تحليلات ذكاء الأمان")}
        locale={locale}
      />
      <View style={s.analyticsRow}>
        <View style={s.block}>
          <GaugeChartV3 score={data.score} maxScore={data.maxScore} color={data.threatAccentColor} />
        </View>
        <View style={s.block}>
          <ScoreBreakdownBarsV3 rows={rows} />
        </View>
        <View style={s.block}>
          <DonutChartV3 counts={data.donutCounts} />
        </View>
      </View>
      <SectionTitleV3 title={t(locale, "Attack Surface", "سطح الهجوم")} locale={locale} />
      <View style={s.attackWrap}>
        <AttackSurfaceBarsV3 bars={data.attackBars} />
      </View>
      <FixedPageFooterV3 locale={locale} />
    </Page>
  );
}
