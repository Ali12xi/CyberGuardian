import { Page, StyleSheet, View, Text } from "@react-pdf/renderer";
import type { PdfReportDataV5 } from "@/lib/pdf/v5/mapV5";
import { normalizeArabicText } from "@/lib/pdf/v5/mapV5";
import {
  ArText,
  bf,
  EnText,
  FixedPageFooterV6,
  footerReservePt,
  LocaleText,
  LtrText,
  type LocaleV6,
} from "@/lib/pdf/v6/components";
import {
  A4_H,
  A4_W,
  BRAND_TAGLINE_AR,
  CATEGORY_LABEL_AR,
  CATEGORY_LABEL_EN,
  colors,
  CONTENT_W,
  coverSpacing,
  MARGIN,
  typo,
} from "@/lib/pdf/v6/constants";

const padB = MARGIN + footerReservePt();

const CAT_ORDER = ["tls", "headers", "infrastructure", "domain", "redirects"] as const;

function scoreForCategory(d: PdfReportDataV5, key: (typeof CAT_ORDER)[number]): number {
  if (key === "domain") {
    return d.categoryScores.domainTrust;
  }
  if (key === "redirects") {
    return d.categoryScores.redirectSafety;
  }
  return d.categoryScores[key];
}

function barColor(score: number): string {
  if (score >= 80) {
    return colors.barGood;
  }
  if (score >= 60) {
    return colors.barMid;
  }
  return colors.barBad;
}

function bannerPalette(tier: PdfReportDataV5["decisionSignal"]["tier"]): {
  bg: string;
  border: string;
  text: string;
  dot: string;
} {
  if (tier === "urgent") {
    return {
      bg: colors.bannerUrgentBg,
      border: colors.bannerUrgentBorder,
      text: colors.bannerUrgentText,
      dot: colors.bannerUrgentBorder,
    };
  }
  if (tier === "soon") {
    return {
      bg: colors.bannerSoonBg,
      border: colors.bannerSoonBorder,
      text: colors.bannerSoonText,
      dot: colors.bannerSoonBorder,
    };
  }
  return {
    bg: colors.bannerCalmBg,
    border: colors.bannerCalmBorder,
    text: colors.bannerCalmText,
    dot: colors.bannerCalmBorder,
  };
}

function t(locale: LocaleV6, en: string, ar: string): string {
  return locale === "ar" ? ar : en;
}

function severityCounts(findings: PdfReportDataV5["findings"]): {
  critical: number;
  high: number;
  medium: number;
  low: number;
} {
  const o = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) {
    if (f.severity === "critical") {
      o.critical += 1;
    } else if (f.severity === "high") {
      o.high += 1;
    } else if (f.severity === "medium") {
      o.medium += 1;
    } else {
      o.low += 1;
    }
  }
  return o;
}

function wrapLrmDigitsLocal(s: string): string {
  return s.replace(/\d+/g, (n) => `\u200e${n}\u200e`);
}

function formatScanMeta(data: PdfReportDataV5, locale: LocaleV6): string {
  const ms = Math.round(data.base.duration);
  if (locale === "ar") {
    return `\u062a\u0645 \u0627\u0644\u0641\u062d\u0635 ${data.base.timestamp} \u00b7 UTC \u00b7 ${ms} ms`;
  }
  return `Scanned ${data.base.timestamp} · ${ms}ms`;
}

function reputationHeadline(data: PdfReportDataV5, locale: LocaleV6): string {
  const v = data.intel.verdict.trim();
  const r = data.intel.reputation.trim();
  const pick = v !== "" && v !== "-" ? v : r;
  const raw = pick.length > 36 ? `${pick.slice(0, 33)}…` : pick;
  return locale === "ar" ? normalizeArabicText(raw) : raw;
}

const s = StyleSheet.create({
  page: { width: A4_W, height: A4_H, backgroundColor: colors.pageBg },
  inner: { padding: MARGIN, paddingBottom: padB, flex: 1 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
    marginBottom: coverSpacing.afterTopRow,
  },
  brandCaps: {
    fontSize: typo.brandCaps,
    fontWeight: 700,
    color: colors.brandCyan,
    letterSpacing: 0.45,
    textTransform: "uppercase",
    maxWidth: CONTENT_W * 0.58,
  },
  scoreCluster: { alignItems: "flex-end" },
  scoreMainRow: { flexDirection: "row", alignItems: "baseline" },
  scoreNum: { fontSize: typo.scoreHero, fontWeight: 800, color: colors.white },
  scoreFrac: { fontSize: typo.scoreFrac, color: colors.muted, marginLeft: 4 },
  gradeRow: { flexDirection: "row", alignItems: "baseline", marginTop: 2 },
  gradeLetter: { fontSize: typo.gradeHero, fontWeight: 800, color: colors.brandCyan },
  gradeWord: {
    fontSize: typo.gradeLabel,
    color: colors.muted,
    marginLeft: 8,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  banner: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: coverSpacing.afterBanner,
  },
  bannerDot: { width: 9, height: 9, borderRadius: 5, marginRight: 10 },
  bannerText: { fontSize: typo.decisionBanner, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" },
  domain: {
    fontSize: typo.domain,
    fontWeight: 700,
    color: colors.white,
    marginBottom: coverSpacing.afterDomain,
  },
  meta: { fontSize: typo.meta, color: colors.muted, marginBottom: coverSpacing.afterMeta },
  execWrap: { marginBottom: coverSpacing.afterExec, maxHeight: 48, width: "100%" },
  exec: { fontSize: typo.exec, color: colors.body, lineHeight: 1.42, maxWidth: CONTENT_W },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: coverSpacing.afterCards,
  },
  card: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    minHeight: 72,
  },
  cardFirst: { marginLeft: 0 },
  cardLast: { marginRight: 0 },
  cardLabel: { fontSize: typo.cardLabel, color: colors.muted, marginBottom: 6 },
  cardValue: { fontSize: typo.cardValue, fontWeight: 700, color: colors.white },
  cardSub: { fontSize: typo.cardSub, color: colors.muted, marginTop: 4 },
  breakdownTitle: {
    fontSize: typo.breakdownTitle,
    color: colors.muted,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: coverSpacing.beforeBreakdown,
  },
  barBlock: { marginBottom: coverSpacing.barGap },
  barTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  barLabel: { fontSize: typo.barLabel, color: colors.muted },
  barTrack: {
    height: 5,
    width: CONTENT_W,
    backgroundColor: colors.deepBg,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: 5, borderRadius: 3 },
});

export function CoverPageV6({ data }: { data: PdfReportDataV5 }) {
  const locale = data.locale as LocaleV6;
  const { base, decisionSignal } = data;
  const pal = bannerPalette(decisionSignal.tier);
  const counts = severityCounts(data.findings);
  const metaLine = locale === "ar" ? wrapLrmDigitsLocal(formatScanMeta(data, locale)) : formatScanMeta(data, locale);
  const repSub =
    locale === "ar"
      ? wrapLrmDigitsLocal(
          `${data.enginesFlagged}/${Math.max(data.intel.total, 1)} \u0625\u0634\u0627\u0631\u0629 \u0633\u0645\u0639\u0629`,
        )
      : `${data.enginesFlagged}/${Math.max(data.intel.total, 1)} vendor signals`;
  const tlsStrong = data.tls.version.includes("1.3");
  const execText = locale === "ar" ? normalizeArabicText(data.executiveSentence) : data.executiveSentence;

  const brandEn = "CYBERGUARDIAN AI · SECURITY INTELLIGENCE REPORT";
  const breakdownTitle = t(locale, "Score breakdown", "تفصيل النتيجة");

  const findingsSub = t(
    locale,
    `${counts.critical} critical · ${counts.high} high · ${counts.medium} medium · ${counts.low} low`,
    `${counts.critical} حرجة · ${counts.high} عالية · ${counts.medium} متوسطة · ${counts.low} منخفضة`,
  );

  const tlsDays =
    data.tls.daysLeft >= 0
      ? t(locale, `${data.tls.daysLeft} days remaining`, `${data.tls.daysLeft} يومًا متبقيًا`)
      : t(locale, "See certificate", "راجع الشهادة");

  const bannerLine = locale === "ar" ? decisionSignal.labelAr : decisionSignal.label;

  const scoreBlock = (
    <View style={s.scoreCluster} wrap={false}>
      <View style={s.scoreMainRow} wrap={false}>
        <LtrText value={String(base.score)} style={[s.scoreNum, bf("en")]} />
        <Text style={[s.scoreFrac, bf("en")]}>/100</Text>
      </View>
      <View style={s.gradeRow} wrap={false}>
        <LtrText value={base.grade} style={[s.gradeLetter, bf("en")]} />
        <Text style={[s.gradeWord, bf(locale === "ar" ? "ar" : "en")]}>
          {locale === "ar" ? "\u062f\u0631\u062c\u0629" : "GRADE"}
        </Text>
      </View>
    </View>
  );

  const brandBlock =
    locale === "ar" ? (
      <View style={{ maxWidth: CONTENT_W * 0.58 }} wrap={false}>
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }} wrap={false}>
          <LtrText
            value="CyberGurdian AI · "
            style={[
              s.brandCaps,
              { letterSpacing: 0.35, textTransform: "none" as const },
              bf("en"),
            ]}
          />
          <View style={{ direction: "rtl" }} wrap={false}>
            <ArText style={[s.brandCaps, { fontSize: typo.brandCaps + 0.5, color: colors.brandCyan }]} wrap={false}>
              {BRAND_TAGLINE_AR}
            </ArText>
          </View>
        </View>
      </View>
    ) : (
      <EnText style={[s.brandCaps, bf("en")]} wrap={false}>
        {brandEn}
      </EnText>
    );

  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap>
      <View style={s.inner}>
        <View style={s.topRow} wrap={false}>
          {locale === "ar" ? (
            <>
              {scoreBlock}
              {brandBlock}
            </>
          ) : (
            <>
              {brandBlock}
              {scoreBlock}
            </>
          )}
        </View>

        <View
          style={[
            s.banner,
            { backgroundColor: pal.bg, borderColor: pal.border },
            locale === "ar" ? { flexDirection: "row-reverse" } : {},
          ]}
          wrap={false}
        >
          <View style={[s.bannerDot, { backgroundColor: pal.dot }]} />
          <Text
            style={[
              s.bannerText,
              { color: pal.text },
              locale === "ar" ? { textTransform: "none" as const, letterSpacing: 0 } : {},
              bf(locale),
            ]}
          >
            {`• ${bannerLine}`}
          </Text>
        </View>

        <Text style={[s.domain, bf(locale), locale === "ar" ? { textAlign: "right" } : {}]} wrap={false}>
          {base.domain}
        </Text>

        <View wrap={false}>
          <LocaleText locale={locale} style={[s.meta, bf(locale)]} wrap={false}>
            {metaLine}
          </LocaleText>
        </View>

        <View style={[s.execWrap, locale === "ar" ? { direction: "rtl" } : {}]} wrap>
          <LocaleText locale={locale} style={[s.exec, bf(locale)]} wrap>
            {execText}
          </LocaleText>
        </View>

        <View style={s.cardsRow} wrap={false}>
          <View style={[s.card, s.cardFirst]}>
            <Text style={[s.cardLabel, bf(locale)]}>{t(locale, "FINDINGS", "النتائج")}</Text>
            <LtrText value={String(data.findingsTotal)} style={[s.cardValue, bf("en")]} />
            <LocaleText locale={locale} style={[s.cardSub, bf(locale)]} wrap={false}>
              {locale === "ar" ? wrapLrmDigitsLocal(findingsSub) : findingsSub}
            </LocaleText>
          </View>
          <View style={s.card}>
            <Text style={[s.cardLabel, bf(locale)]}>{t(locale, "TLS STATUS", "حالة TLS")}</Text>
            <LtrText
              value={data.tls.version}
              style={[
                s.cardValue,
                { color: tlsStrong ? colors.barGood : colors.white },
                bf("en"),
              ]}
            />
            <LocaleText locale={locale} style={[s.cardSub, bf(locale)]} wrap={false}>
              {locale === "ar" ? wrapLrmDigitsLocal(tlsDays) : tlsDays}
            </LocaleText>
          </View>
          <View style={[s.card, s.cardLast]}>
            <Text style={[s.cardLabel, bf(locale)]}>{t(locale, "REPUTATION", "السمعة")}</Text>
            <LocaleText locale={locale} style={[s.cardValue, { color: colors.barGood }]} wrap={false}>
              {reputationHeadline(data, locale)}
            </LocaleText>
            <LocaleText locale={locale} style={[s.cardSub, bf(locale)]} wrap={false}>
              {repSub}
            </LocaleText>
          </View>
        </View>

        <Text style={[s.breakdownTitle, bf(locale)]}>{breakdownTitle}</Text>

        {CAT_ORDER.map((key) => {
          const score = scoreForCategory(data, key);
          const labelEn = CATEGORY_LABEL_EN[key];
          const labelAr =
            data.categoryLabelsAr[key] !== undefined && data.categoryLabelsAr[key] !== ""
              ? data.categoryLabelsAr[key]
              : CATEGORY_LABEL_AR[key];
          const label = locale === "ar" ? labelAr : labelEn;
          const w = Math.max(0, Math.min(100, score));
          const numColor = score < 60 ? colors.barBad : colors.body;
          return (
            <View key={key} style={s.barBlock} wrap={false}>
              <View style={[s.barTop, locale === "ar" ? { flexDirection: "row-reverse" } : {}]} wrap={false}>
                <Text style={[s.barLabel, bf(locale)]}>{label}</Text>
                <LtrText value={String(score)} style={[{ fontSize: typo.barLabel, color: numColor }, bf("en")]} />
              </View>
              <View style={s.barTrack}>
                <View
                  style={[
                    s.barFill,
                    {
                      width: Math.round((w / 100) * CONTENT_W),
                      backgroundColor: barColor(score),
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
      <FixedPageFooterV6 locale={locale} />
    </Page>
  );
}
