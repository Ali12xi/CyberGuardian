import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { bf, FixedPageFooterV3, SectionTitleV3, SeverityBadgeV3, footerReservePt, type LocaleV3 } from "@/lib/pdf/v3/components";
import { A4_H, A4_W, CONTENT_W, MARGIN, REC_CARD_H, dark, typo } from "@/lib/pdf/v3/constants";
import type { PdfV3Recommendation } from "@/lib/pdf/v3/mapV3";

const s = StyleSheet.create({
  page: {
    width: A4_W,
    height: A4_H,
    backgroundColor: dark.pageBg,
    padding: MARGIN,
    paddingBottom: MARGIN + footerReservePt(),
    color: dark.textPrimary,
  },
  intro: {
    flexDirection: "row",
    backgroundColor: dark.cardBg,
    borderWidth: 1,
    borderColor: dark.cardBorder,
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  stripe: { width: 3, backgroundColor: dark.accentCyan },
  introBody: { flex: 1, padding: 10 },
  introK: { fontSize: 8, fontWeight: 700, color: dark.accentCyan, marginBottom: 4 },
  introT: { fontSize: typo.body, color: dark.textSecondary, lineHeight: 1.25 },
  card: {
    minHeight: REC_CARD_H,
    backgroundColor: dark.cardBg,
    borderWidth: 1,
    borderColor: dark.cardBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  title: { fontSize: 11, fontWeight: 700, color: dark.textPrimary, marginTop: 4, marginLeft: 6, flex: 1 },
  why: { fontSize: typo.body, color: dark.textSecondary, marginTop: 4 },
  meta: { fontSize: typo.meta, fontWeight: 700, color: dark.textPrimary, marginTop: 4 },
});

function t(locale: LocaleV3, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

export function RecommendationsPageV3({
  chunk,
  locale,
  showIntro,
}: {
  chunk: PdfV3Recommendation[];
  locale: LocaleV3;
  showIntro: boolean;
}) {
  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap={false}>
      <SectionTitleV3
        title={t(locale, "Executive Recommendations", "توصيات تنفيذية")}
        locale={locale}
      />
      {showIntro ? (
        <View style={s.intro}>
          <View style={s.stripe} />
          <View style={s.introBody}>
            <Text style={[s.introK, bf(locale)]}>
              {t(locale, "Executive intelligence brief", "ملخص ذكاء تنفيذي")}
            </Text>
            <Text style={[s.introT, bf(locale)]}>
              {t(
                locale,
                "Prioritize by severity. Validate in staging before production.",
                "أولوية حسب الخطورة. تحقق في بيئة الاختبار قبل الإطلاق.",
              )}
            </Text>
          </View>
        </View>
      ) : null}
      {chunk.map((r, i) => (
        <View key={i} style={s.card} wrap>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }} wrap={false}>
            <SeverityBadgeV3 level={r.severity} locale={locale} />
            <Text style={[s.title, bf(locale)]}>{r.title}</Text>
          </View>
          <Text style={[s.why, bf(locale)]} wrap={false}>
            {r.why}
          </Text>
          <Text style={[s.meta, bf(locale)]} wrap={false}>
            {r.metaLine}
          </Text>
        </View>
      ))}
      <FixedPageFooterV3 locale={locale} />
    </Page>
  );
}
