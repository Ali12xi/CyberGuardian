import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LtrText } from "@/lib/pdf/phaseA/LtrText";
import { AttackSurfaceBarsV4, DonutChartV4, ScoreBreakdownBarsV4 } from "@/lib/pdf/v4/charts";
import { bf, FixedPageFooterV4, SectionTitleV4, footerReservePt, type LocaleV4 } from "@/lib/pdf/v4/components";
import { A4_H, A4_W, CONTENT_W, MARGIN, dark, typo } from "@/lib/pdf/v4/constants";
import type { PdfReportDataV4 } from "@/lib/pdf/v4/mapV4";

const gap = 10;
const halfW = Math.floor((CONTENT_W - gap) / 2);

const s = StyleSheet.create({
  page: {
    width: A4_W,
    height: A4_H,
    backgroundColor: dark.pageBg,
    padding: MARGIN,
    paddingBottom: MARGIN + footerReservePt(),
    color: dark.textPrimary,
  },
  row3: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, alignItems: "flex-start" },
  tlsGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  tlsCell: {
    width: Math.floor((CONTENT_W - gap) / 2),
    marginBottom: gap,
    padding: 8,
    backgroundColor: dark.cardBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: dark.cardBorder,
  },
  tlsLabel: { fontSize: typo.cardLabel, color: dark.textMuted, marginBottom: 2 },
  hdrBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: dark.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: dark.cardBorder,
  },
  hdrLine: { fontSize: typo.body, color: dark.textSecondary, lineHeight: 1.35, marginTop: 4 },
});

function t(locale: LocaleV4, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

export function TechnicalPageV4({ data, locale }: { data: PdfReportDataV4; locale: LocaleV4 }) {
  const rows = data.scoreRows.map((r) => ({
    label: locale === "ar" ? r.labelAr : r.labelEn,
    score: r.score,
    maxScore: r.maxScore,
    color: r.color,
  }));
  const bars = data.attackBars.map((b) => ({
    label: locale === "ar" ? b.labelAr : b.labelEn,
    value: b.value,
    color: b.color,
  }));
  const ta = locale === "ar" ? { textAlign: "right" as const } : {};
  const presentLine = data.presentHeaders.join(", ") || "-";
  const missingLine = data.missingHeaders.join(", ") || "-";
  const impact = locale === "ar" ? data.headersImpactAr : data.headersImpactEn;

  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap={false}>
      <SectionTitleV4 title={t(locale, "Technical security analysis", "التحليل التقني للأمان")} locale={locale} />
      <View style={s.row3}>
        <View style={{ width: halfW, alignItems: "center" }}>
          <DonutChartV4 counts={data.donutCounts} locale={locale} />
        </View>
        <View style={{ width: halfW }}>
          <Text style={[{ fontSize: typo.sectionMuted, fontWeight: 600, color: dark.textSecondary, marginBottom: 4 }, bf(locale)]}>
            {t(locale, "Score breakdown", "تفصيل النتيجة")}
          </Text>
          <ScoreBreakdownBarsV4 rows={rows} locale={locale} />
        </View>
      </View>

      <SectionTitleV4 title={t(locale, "TLS & transport", "TLS والنقل")} locale={locale} muted />
      <View style={s.tlsGrid}>
        {data.tlsCards.map((c, i) => (
          <View key={i} style={[s.tlsCell, { marginRight: i % 2 === 0 ? gap : 0 }]}>
            <Text style={[s.tlsLabel, bf(locale)]}>{locale === "ar" ? c.labelAr : c.labelEn}</Text>
            <LtrText value={c.value} style={[{ fontSize: typo.bodyLarge, fontWeight: 700, color: dark.textPrimary }, bf(locale)]} />
          </View>
        ))}
      </View>

      <SectionTitleV4 title={t(locale, "Security headers", "رؤوس الأمان")} locale={locale} muted />
      <View style={s.hdrBox}>
        <Text style={[{ fontSize: typo.body, color: dark.textSecondary }, bf(locale), ta]} wrap>
          {impact}
        </Text>
        <Text style={[s.hdrLine, bf(locale)]}>{t(locale, "Present", "موجودة")}</Text>
        <LtrText value={presentLine} style={[{ fontSize: typo.meta, color: dark.textPrimary }, bf(locale)]} />
        <Text style={[s.hdrLine, bf(locale)]}>{t(locale, "Missing", "ناقصة")}</Text>
        <LtrText value={missingLine} style={[{ fontSize: typo.meta, color: dark.textPrimary }, bf(locale)]} />
      </View>

      <SectionTitleV4 title={t(locale, "Attack surface", "سطح الهجوم")} locale={locale} muted />
      <View style={{ marginTop: 6 }}>
        <AttackSurfaceBarsV4 bars={bars} locale={locale} />
      </View>

      <FixedPageFooterV4 locale={locale} />
    </Page>
  );
}
