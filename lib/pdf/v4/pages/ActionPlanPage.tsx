import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LtrText } from "@/lib/pdf/phaseA/LtrText";
import { bf, FixedPageFooterV4, SectionTitleV4, SeverityBadgeV4, footerReservePt, type LocaleV4 } from "@/lib/pdf/v4/components";
import { A4_H, A4_W, CONTENT_W, MARGIN, dark, typo } from "@/lib/pdf/v4/constants";
import type { PdfV4ActionItem } from "@/lib/pdf/v4/mapV4";

const s = StyleSheet.create({
  page: {
    width: A4_W,
    height: A4_H,
    backgroundColor: dark.pageBg,
    padding: MARGIN,
    paddingBottom: MARGIN + footerReservePt(),
    color: dark.textPrimary,
  },
  intro: { fontSize: typo.meta, color: dark.textMuted, marginBottom: 10, lineHeight: 1.35 },
  card: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: dark.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: dark.cardBorder,
  },
  head: { flexDirection: "row", alignItems: "flex-start" },
  title: { fontSize: typo.riskTitle, fontWeight: 700, flex: 1, marginLeft: 8, color: dark.textPrimary },
  k: { fontSize: typo.cardLabel, fontWeight: 700, color: dark.accentCyan, marginTop: 6 },
  body: { fontSize: typo.body, color: dark.textSecondary, lineHeight: 1.4, marginTop: 2 },
  snippetBox: {
    marginTop: 6,
    padding: 6,
    backgroundColor: "#020617",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: dark.cardBorder,
  },
});

function t(locale: LocaleV4, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

function ActionCard({ item, locale }: { item: PdfV4ActionItem; locale: LocaleV4 }) {
  const ta = locale === "ar" ? { textAlign: "right" as const } : {};
  return (
    <View style={s.card} wrap>
      <View style={s.head} wrap={false}>
        <SeverityBadgeV4 level={item.severity} locale={locale} />
        <Text style={[s.title, bf(locale), ta]} wrap>
          {item.problem}
        </Text>
      </View>
      <Text style={[s.k, bf(locale)]}>{t(locale, "Why it matters", "لماذا يهم")}</Text>
      <Text style={[s.body, bf(locale), ta]} wrap>
        {item.whyItMatters}
      </Text>
      <Text style={[s.k, bf(locale)]}>{t(locale, "Technical fix", "الإصلاح التقني")}</Text>
      <Text style={[s.body, bf(locale), ta]} wrap>
        {item.technicalFix}
      </Text>
      <Text style={[s.k, bf(locale)]}>{t(locale, "Ready-to-copy snippet", "مقتطف جاهز للنسخ")}</Text>
      <View style={s.snippetBox}>
        <LtrText value={item.snippet} style={[{ fontSize: 7, color: dark.textPrimary, fontFamily: "Courier" }]} />
      </View>
      <Text style={[s.k, bf(locale)]}>{t(locale, "Effort & platform", "الجهد والمنصة")}</Text>
      <Text style={[s.body, bf(locale)]} wrap>
        {`${item.effort} · ${item.snippetPlatform} · ${item.platformHint}`}
      </Text>
      <Text style={[s.k, bf(locale)]}>{t(locale, "Expected improvement", "التحسين المتوقع")}</Text>
      <Text style={[s.body, bf(locale), ta]} wrap>
        {item.expectedImprovement}
      </Text>
    </View>
  );
}

export function ActionPlanPageV4({
  chunk,
  locale,
  pageIndex,
  empty,
}: {
  chunk: PdfV4ActionItem[];
  locale: LocaleV4;
  pageIndex: number;
  empty?: boolean;
}) {
  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap={false}>
      <SectionTitleV4
        title={t(
          locale,
          pageIndex === 0 ? "Prioritized action plan" : "Prioritized action plan (continued)",
          pageIndex === 0 ? "خطة إجراءات مرتبة" : "خطة إجراءات مرتبة (تابع)",
        )}
        locale={locale}
      />
      <Text style={[s.intro, bf(locale), locale === "ar" ? { textAlign: "right" } : {}]} wrap>
        {t(
          locale,
          "Each item states the problem, rationale, fix, and a copy-ready snippet. Validate in staging before production.",
          "كل بند يوضح المشكلة والمبرر والإصلاح ومقتطفاً جاهزاً للنسخ. راجع في بيئة الاختبار قبل الإنتاج.",
        )}
      </Text>
      {empty || chunk.length === 0 ? (
        <View style={s.card} wrap>
          <Text style={[{ fontSize: typo.bodyLarge, color: dark.textSecondary }, bf(locale), locale === "ar" ? { textAlign: "right" } : {}]} wrap>
            {t(
              locale,
              "No remediation-backed actions were emitted for this scan. Re-run after configuration changes.",
              "لم تُصدَر إجراءات مدعومة بالإصلاح لهذا الفحص. أعد الفحص بعد تغيير الإعدادات.",
            )}
          </Text>
        </View>
      ) : (
        chunk.map((item, i) => <ActionCard key={i} item={item} locale={locale} />)
      )}
      <FixedPageFooterV4 locale={locale} />
    </Page>
  );
}
