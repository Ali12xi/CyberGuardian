import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LtrText } from "@/lib/pdf/phaseA/LtrText";
import { GaugeChartV4 } from "@/lib/pdf/v4/charts";
import { bf, FixedPageFooterV4, SectionTitleV4, SeverityBadgeV4, footerReservePt, type LocaleV4 } from "@/lib/pdf/v4/components";
import { A4_H, A4_W, CONTENT_W, MARGIN, dark, typo } from "@/lib/pdf/v4/constants";
import type { PdfReportDataV4 } from "@/lib/pdf/v4/mapV4";

const gap = 14;
const leftW = Math.floor(CONTENT_W * 0.56);
const rightW = CONTENT_W - leftW - gap;

const s = StyleSheet.create({
  page: {
    width: A4_W,
    height: A4_H,
    backgroundColor: dark.pageBg,
    padding: MARGIN,
    paddingBottom: MARGIN + footerReservePt(),
    color: dark.textPrimary,
  },
  brand: { fontSize: typo.brand, fontWeight: 700, color: dark.accentCyan },
  title: { fontSize: typo.reportTitle, fontWeight: 700, color: dark.textPrimary, marginTop: 4 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  narrative: { fontSize: typo.bodyLarge, color: dark.textSecondary, lineHeight: 1.45, marginTop: 8 },
  keyBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: dark.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: dark.cardBorder,
  },
  keyLabel: { fontSize: typo.cardLabel, fontWeight: 700, color: dark.accentCyan, marginBottom: 4 },
  keyLine: { fontSize: typo.keyObservation, color: dark.textPrimary, lineHeight: 1.35 },
  rightCard: {
    width: rightW,
    backgroundColor: dark.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: dark.cardBorder,
    padding: 12,
    alignItems: "center",
  },
  metricLabel: { fontSize: typo.cardLabel, color: dark.textMuted, marginTop: 6 },
  metricValue: { fontSize: typo.cardValue, fontWeight: 700, color: dark.textPrimary },
  quietRow: { marginTop: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  quiet: { fontSize: typo.micro, color: dark.textMuted },
});

function t(locale: LocaleV4, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

function scanIdShort(id: string): string {
  if (id === "-" || id.length <= 18) {
    return id;
  }
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export function ExecutiveOverviewPageV4({ data, locale }: { data: PdfReportDataV4; locale: LocaleV4 }) {
  const b = data.base;
  const vis = locale === "ar" ? data.visibilityAr : data.visibilityEn;
  const sevKey = (data.result.threatLevel ?? "low").toUpperCase();
  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap={false}>
      <View style={s.rowTop}>
        <View style={{ maxWidth: CONTENT_W * 0.72 }}>
          <Text style={[s.brand, bf(locale)]}>CyberGurdian AI</Text>
          <Text style={[s.title, bf(locale)]}>
            {t(locale, "Executive risk overview", "نظرة تنفيذية على المخاطر")}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", marginTop: 16, alignItems: "flex-start" }} wrap={false}>
        <View style={{ width: leftW }}>
          <SectionTitleV4 title={t(locale, "Threat level", "مستوى التهديد")} locale={locale} muted />
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }} wrap={false}>
            <SeverityBadgeV4 level={sevKey} locale={locale} />
          </View>
          <Text style={[{ fontSize: typo.threatHero, fontWeight: 700, color: data.threatAccentColor, marginTop: 6 }, bf(locale)]}>
            {data.threatHeroLabel}
          </Text>
          <LtrText value={b.finalUrl} style={[{ fontSize: typo.meta, color: dark.metaText, marginTop: 4 }, bf(locale)]} />

          <Text style={[s.narrative, bf(locale), locale === "ar" ? { textAlign: "right" } : {}]} wrap>
            {data.executiveNarrative}
          </Text>
          <Text style={[s.narrative, { fontSize: typo.body, color: dark.textMuted }, bf(locale), locale === "ar" ? { textAlign: "right" } : {}]} wrap>
            {data.businessRiskNarrative}
          </Text>

          <View style={s.keyBox} wrap>
            <Text style={[s.keyLabel, bf(locale)]}>{t(locale, "Key observation", "ملاحظة رئيسية")}</Text>
            <Text style={[s.keyLine, bf(locale), locale === "ar" ? { textAlign: "right" } : {}]} wrap>
              {data.keyObservation}
            </Text>
          </View>
        </View>

        <View style={{ width: gap }} />
        <View style={s.rightCard}>
          <GaugeChartV4 score={data.score} maxScore={data.maxScore} color={data.threatAccentColor} locale={locale} />
          <Text style={[s.metricLabel, bf(locale)]}>{t(locale, "Grade", "التقدير")}</Text>
          <LtrText value={data.grade} style={[s.metricValue, bf(locale)]} />
          <Text style={[s.metricLabel, bf(locale)]}>{t(locale, "Visibility", "الظهور")}</Text>
          <Text style={[s.metricValue, bf(locale), { textAlign: "center" }]}>{vis}</Text>
          <Text style={[s.metricLabel, bf(locale)]}>{t(locale, "Scan timestamp", "وقت الفحص")}</Text>
          <LtrText value={b.timestampUtc} style={[s.metricValue, bf(locale)]} />
        </View>
      </View>

      <View style={s.quietRow}>
        <View style={{ flexDirection: "row", alignItems: "center", maxWidth: CONTENT_W * 0.65 }} wrap={false}>
          <Text style={[s.quiet, bf(locale)]}>{t(locale, "Scan ID", "معرف الفحص")}: </Text>
          <LtrText value={scanIdShort(b.scanId)} style={[s.quiet, bf(locale)]} />
        </View>
        <Text style={[s.quiet, bf(locale)]}>{t(locale, "Report version V1.6", "إصدار التقرير V1.6")}</Text>
      </View>

      <FixedPageFooterV4 locale={locale} />
    </Page>
  );
}
