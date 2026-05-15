import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { bf, FixedPageFooterV5, footerReservePt, LocaleText, type LocaleV5 } from "@/lib/pdf/v5/components";
import { A4_H, A4_W, colors, CONTENT_W, MARGIN, typo } from "@/lib/pdf/v5/constants";
import type { FindingV5, PdfReportDataV5 } from "@/lib/pdf/v5/mapV5";

const padB = MARGIN + footerReservePt();
const layerDivider = "#1a2235";
const layerLabelMuted = "#4a5568";
const layerBody = "#8a97a8";

function sevStyle(sev: FindingV5["severity"]): { border: string; badgeBg: string } {
  if (sev === "critical" || sev === "high") {
    return { border: colors.critical, badgeBg: colors.criticalBg };
  }
  if (sev === "medium") {
    return { border: colors.medium, badgeBg: colors.mediumBg };
  }
  return { border: colors.low, badgeBg: colors.lowBg };
}

const s = StyleSheet.create({
  page: { width: A4_W, height: A4_H, backgroundColor: colors.pageBg },
  inner: { padding: MARGIN, paddingBottom: padB },
  title: { fontSize: typo.section, fontWeight: 700, color: colors.white, marginBottom: 8 },
  subtitle: {
    fontSize: typo.body,
    color: colors.muted,
    lineHeight: 1.45,
    marginBottom: 22,
    maxWidth: CONTENT_W,
  },
  card: {
    marginBottom: 18,
    padding: 14,
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
  },
  head: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4, marginRight: 8 },
  badgeTxt: { fontSize: typo.meta, fontWeight: 700, color: colors.white },
  ft: { fontSize: typo.bodyLg, fontWeight: 700, color: colors.white, flex: 1 },
  row3: { flexDirection: "row", marginTop: 10 },
  col: {
    flex: 1,
    paddingHorizontal: 12,
    borderLeftWidth: 0.5,
    borderLeftColor: layerDivider,
  },
  colFirst: { borderLeftWidth: 0 },
  footWrap: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: layerDivider,
  },
});

function t(locale: LocaleV5, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

function layerLabelStyle(locale: LocaleV5) {
  return {
    fontSize: 9,
    color: layerLabelMuted,
    letterSpacing: 0.6,
    marginBottom: 4,
    ...(locale === "en" ? { textTransform: "uppercase" as const } : {}),
  };
}

function layerBodyStyle(locale: LocaleV5) {
  return {
    fontSize: 10,
    color: layerBody,
    lineHeight: 1.42,
    ...(locale === "ar" ? { textAlign: "right" as const } : {}),
  };
}

function FindingCard({ f, locale }: { f: FindingV5; locale: LocaleV5 }) {
  const pal = sevStyle(f.severity);
  const ta = locale === "ar" ? { textAlign: "right" as const } : {};
  const sevLabel = f.severity.toUpperCase();
  const metaLine = `${t(locale, "Fix time", "زمن الإصلاح")}: ${f.effortMinutes} min · ${t(locale, "Surface", "السطح")}: ${f.platform} · ${f.standards.join(", ")}`;
  return (
    <View style={[s.card, { borderLeftColor: pal.border }]}>
      <View style={s.head}>
        <View style={[s.badge, { backgroundColor: pal.badgeBg }]}>
          <Text style={[s.badgeTxt, bf(locale)]}>{sevLabel}</Text>
        </View>
        <Text style={[s.ft, bf(locale), ta]} wrap>
          {f.title}
        </Text>
      </View>
      <View style={s.row3}>
        <View style={[s.col, s.colFirst]}>
          <LocaleText locale={locale} style={[layerLabelStyle(locale), bf(locale)]} wrap={false}>
            {t(locale, "For site owners", "لأصحاب الموقع")}
          </LocaleText>
          <LocaleText locale={locale} style={[layerBodyStyle(locale), bf(locale)]} wrap>
            {f.ownerImpact}
          </LocaleText>
        </View>
        <View style={s.col}>
          <LocaleText locale={locale} style={[layerLabelStyle(locale), bf(locale)]} wrap={false}>
            {t(locale, "Business impact", "الأثر التجاري")}
          </LocaleText>
          <LocaleText locale={locale} style={[layerBodyStyle(locale), bf(locale)]} wrap>
            {f.businessImpact}
          </LocaleText>
        </View>
        <View style={s.col}>
          <LocaleText locale={locale} style={[layerLabelStyle(locale), bf(locale)]} wrap={false}>
            {t(locale, "Technical", "تقني")}
          </LocaleText>
          <LocaleText locale={locale} style={[layerBodyStyle(locale), bf(locale)]} wrap>
            {f.technicalDetail}
          </LocaleText>
        </View>
      </View>
      <View style={s.footWrap}>
        <LocaleText locale={locale} style={[{ fontSize: 9, color: layerLabelMuted }, bf(locale)]} wrap={false}>
          {metaLine}
        </LocaleText>
      </View>
    </View>
  );
}

export function FindingsPageV5({
  chunk,
  data,
  pageIndex,
}: {
  chunk: FindingV5[];
  data: PdfReportDataV5;
  pageIndex: number;
}) {
  const { locale } = data;
  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap>
      <View style={s.inner}>
        <Text style={[s.title, bf(locale)]}>
          {pageIndex === 0
            ? t(locale, "What we found", "ما وجدناه")
            : t(locale, "What we found (continued)", "ما وجدناه — تابع")}
        </Text>
        {pageIndex === 0 ? (
          <LocaleText locale={locale} style={[s.subtitle, bf(locale)]} wrap>
            {t(
              locale,
              "Three layers per finding: owner-facing risk, business impact, and technical detail.",
              "ثلاث طبقات لكل نتيجة: المخاطر للمالك، الأثر التجاري، ثم التفصيل التقني.",
            )}
          </LocaleText>
        ) : null}
        {chunk.map((f) => (
          <FindingCard key={f.id} f={f} locale={locale} />
        ))}
      </View>
      <FixedPageFooterV5 locale={locale} />
    </Page>
  );
}
