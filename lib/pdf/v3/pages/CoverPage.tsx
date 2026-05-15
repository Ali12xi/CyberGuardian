import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LtrText } from "@/lib/pdf/phaseA/LtrText";
import {
  bf,
  FixedPageFooterV3,
  InfoCardV3,
  SectionTitleV3,
  SeverityBadgeV3,
  footerReservePt,
  type LocaleV3,
} from "@/lib/pdf/v3/components";
import {
  A4_H,
  A4_W,
  CONTENT_W,
  COVER_HERO_H,
  COVER_META_GRID_H,
  COVER_METHOD_H,
  COVER_SUMMARY_H,
  MARGIN,
  dark,
  typo,
} from "@/lib/pdf/v3/constants";
import type { PdfReportDataV3 } from "@/lib/pdf/v3/mapV3";

const gap = 8;
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
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  brand: { fontSize: typo.brand, fontWeight: 700, color: dark.accentCyan },
  title: { fontSize: typo.reportTitle, fontWeight: 700, color: dark.textPrimary },
  ts: { fontSize: 8, color: dark.textSecondary },
  ver: { fontSize: 7, color: dark.textMuted, marginTop: 2 },
  hero: {
    backgroundColor: dark.cardBg,
    borderWidth: 1,
    borderColor: dark.cardBorder,
    borderRadius: 8,
    padding: 12,
    height: COVER_HERO_H,
    marginTop: 10,
  },
  threatTitle: { fontSize: typo.threatHero, fontWeight: 700, marginTop: 6 },
  methodStripe: {
    flexDirection: "row",
    marginTop: 10,
    height: COVER_METHOD_H,
    backgroundColor: dark.cardBg,
    borderWidth: 1,
    borderColor: dark.cardBorder,
    borderRadius: 8,
    overflow: "hidden",
  },
  stripe: { width: 3, backgroundColor: dark.accentCyan },
  methodBody: { flex: 1, padding: 10, justifyContent: "center" },
  methodItalic: { fontSize: 8, fontStyle: "italic", color: dark.accentCyan, marginBottom: 4 },
  methodText: { fontSize: 8, color: dark.textSecondary, lineHeight: 1.3 },
  metaGrid: { marginTop: 10, height: COVER_META_GRID_H },
  gridRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: gap },
  summaryStripe: {
    flexDirection: "row",
    marginTop: 6,
    height: COVER_SUMMARY_H,
    backgroundColor: dark.cardBg,
    borderWidth: 1,
    borderColor: dark.cardBorder,
    borderRadius: 8,
    overflow: "hidden",
  },
  sumK: { fontSize: 8, fontWeight: 700, color: dark.accentCyan, marginBottom: 4 },
  sumB: { fontSize: typo.body, color: dark.textSecondary, lineHeight: 1.25 },
});

function t(locale: LocaleV3, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

function scanIdDisplay(id: string): string {
  if (id === "-" || id.length <= 16) {
    return id;
  }
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function CoverPageV3({ data, locale }: { data: PdfReportDataV3; locale: LocaleV3 }) {
  const b = data.base;
  const threatLabel = locale === "ar" ? data.threatDisplayAr : data.threatLabelEn;
  const sevKey = (data.result.threatLevel ?? "low").toUpperCase();
  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap={false}>
      <View style={s.rowBetween}>
        <View style={{ maxWidth: CONTENT_W * 0.7 }}>
          <Text style={[s.brand, bf(locale)]}>CyberGurdian AI</Text>
          <Text style={[s.title, bf(locale)]}>
            {t(locale, "Cybersecurity Intelligence Report", "تقرير ذكاء الأمن السيبراني")}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <LtrText value={b.timestampUtc} style={[s.ts, bf(locale)]} />
          <Text style={[s.ver, bf(locale)]}>V1.6</Text>
        </View>
      </View>

      <View style={s.hero}>
        <View style={{ flexDirection: "row", alignItems: "center" }} wrap={false}>
          <SeverityBadgeV3 level={sevKey} locale={locale} />
          <Text style={{ fontSize: 7, color: dark.accentCyan, marginLeft: 6, letterSpacing: 1 }}>DETECTED</Text>
        </View>
        <Text style={[s.threatTitle, { color: data.threatAccentColor }, bf(locale)]}>{threatLabel}</Text>
        <LtrText value={b.finalUrl} style={[{ fontSize: 9, color: dark.metaText, marginTop: 4 }, bf(locale)]} />
      </View>

      <View style={s.methodStripe}>
        <View style={s.stripe} />
        <View style={s.methodBody}>
          <Text style={[s.methodItalic, bf(locale)]}>{t(locale, "Methodology", "منهجية الفحص")}</Text>
          <Text style={[s.methodText, bf(locale)]} wrap={false}>
            {locale === "ar" ? data.methodologyAr : data.methodologyEn}
          </Text>
        </View>
      </View>

      <View style={s.metaGrid}>
        <View style={s.gridRow}>
          <InfoCardV3
            label="SECURITY SCORE"
            value={`${data.score}/${data.maxScore}`}
            locale={locale}
            width={col4}
          />
          <InfoCardV3 label="GRADE" value={data.grade} locale={locale} width={col4} />
          <InfoCardV3
            label="VISIBILITY"
            value={locale === "ar" ? data.visibilityAr : data.visibilityEn}
            locale={locale}
            width={col4}
          />
          <InfoCardV3 label="SCAN TIMESTAMP" value={b.timestampUtc} locale={locale} width={col4} />
        </View>
        <View style={s.gridRow}>
          <InfoCardV3
            label="SCAN ID"
            value={scanIdDisplay(b.scanId)}
            locale={locale}
            width={col4}
            valueFontSize={8}
          />
          <InfoCardV3 label="THREAT LEVEL" value={String(data.result.threatLevel).toUpperCase()} locale={locale} width={col4} />
          <InfoCardV3
            label="INFRA TRUST"
            value={(locale === "ar" ? b.exposureAr : b.exposureEn).replace("exposure-:", "exposure:")}
            locale={locale}
            width={col4}
          />
          <InfoCardV3 label="VERSION" value="V1.6" locale={locale} width={col4} />
        </View>
      </View>

      <SectionTitleV3 title={t(locale, "Executive Summary", "الملخص التنفيذي")} locale={locale} />
      <View style={s.summaryStripe}>
        <View style={s.stripe} />
        <View style={s.methodBody}>
          <Text style={[s.sumK, bf(locale)]}>
            {t(locale, "Executive Risk Overview", "نظرة المخاطر التنفيذية")}
          </Text>
          <Text style={[s.sumB, bf(locale)]} wrap={false}>
            {locale === "ar" ? data.overviewAr : data.overviewEn}
          </Text>
        </View>
      </View>

      <FixedPageFooterV3 locale={locale} />
    </Page>
  );
}
