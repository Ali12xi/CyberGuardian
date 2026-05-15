import type { Style } from "@react-pdf/types";
import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  ArText,
  bf,
  EnText,
  FixedPageFooterV5,
  footerReservePt,
  LocaleText,
  LtrText,
  wrapLrmDigits,
  type LocaleV5,
} from "@/lib/pdf/v5/components";
import { A4_H, A4_W, CATEGORY_LABEL_AR, CATEGORY_LABEL_EN, colors, MARGIN } from "@/lib/pdf/v5/constants";
import type { PdfReportDataV5 } from "@/lib/pdf/v5/mapV5";

const PAGE_PAD_H = 36;
const PAGE_PAD_V = 40;
const padB = MARGIN + footerReservePt();
const INNER_CONTENT_W = A4_W - PAGE_PAD_H * 2;
const SCORE_TOWER_W = 160;
const EXEC_MAX_W = 380;

const AR = {
  brand: "\u062a\u0642\u0631\u064a\u0631 \u0630\u0643\u0627\u0621 \u0623\u0645\u0646\u064a",
  grade: "\u0627\u0644\u062a\u0642\u062f\u064a\u0631",
  findings: "\u0627\u0644\u0646\u062a\u0627\u0626\u062c",
  tlsStatus: "\u062d\u0627\u0644\u0629 TLS",
  reputation: "\u0627\u0644\u0633\u0645\u0639\u0629",
  trusted: "\u0645\u0648\u062b\u0648\u0642",
  neutral: "\u0645\u062d\u0627\u064a\u062f",
  suspicious: "\u0645\u0634\u0628\u0648\u0647",
  scoreBreakdown: "\u062a\u0641\u0635\u064a\u0644 \u0627\u0644\u0646\u062a\u064a\u062c\u0629",
  malicious: "\u0625\u0634\u0627\u0631\u0629 \u062e\u0628\u064a\u062b\u0629",
  daysRemaining: "\u064a\u0648\u0645\u0627\u064b \u0645\u062a\u0628\u0642\u064a\u0627\u064b",
  low: "\u0645\u0646\u062e\u0641\u0636\u0629",
  medium: "\u0645\u062a\u0648\u0633\u0637\u0629",
  high: "\u0639\u0627\u0644\u064a\u0629",
  critical: "\u062d\u0631\u062c\u0629",
  scanned: "\u0641\u064f\u062d\u0635 \u0641\u064a",
} as const;

const bannerColors: Record<
  PdfReportDataV5["decisionSignal"]["tier"],
  { bg: string; border: string; text: string }
> = {
  urgent: { bg: "#2a0f0f", border: "#ef4444", text: "#fecaca" },
  soon: { bg: "#2a1a06", border: "#f59e0b", text: "#fde68a" },
  none: { bg: "#0f2918", border: "#22c55e", text: "#bbf7d0" },
};

const mutedHex = "#4a5568";
const execHex = "#8a97a8";
const cardBorder = "#1e2a3a";
const cardBg = "#0d1625";
const cardMuted = "#6b7a8d";

function barColor(score: number): string {
  if (score >= 80) {
    return colors.barGood;
  }
  if (score >= 60) {
    return colors.barMid;
  }
  return colors.barBad;
}

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

function reputationLabel(rep: string, locale: LocaleV5): string {
  if (locale !== "ar") {
    const x = rep.trim();
    if (x === "") {
      return rep;
    }
    return x.charAt(0).toUpperCase() + x.slice(1);
  }
  const arReputationLabels: Record<string, string> = {
    trusted: "\u0645\u0648\u062b\u0648\u0642",
    suspicious: "\u0645\u0634\u0628\u0648\u0647",
    malicious: "\u062e\u0628\u064a\u062b",
    neutral: "\u0645\u062d\u0627\u064a\u062f",
  };
  const key = rep.trim().toLowerCase();
  return arReputationLabels[key] ?? rep;
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

function findingsSubtitle(data: PdfReportDataV5, locale: LocaleV5): string {
  const { critical, high, medium, low } = severityCounts(data.findings);
  if (locale === "ar") {
    return wrapLrmDigits(
      `${critical} ${AR.critical} · ${high} ${AR.high} · ${medium} ${AR.medium} · ${low} ${AR.low}`,
    );
  }
  return `${critical} critical · ${high} high · ${medium} medium · ${low} low`;
}

function tlsSubtitle(data: PdfReportDataV5, locale: LocaleV5): string {
  const d = data.tls.daysLeft;
  if (locale === "ar") {
    if (d < 0) {
      return "\u0631\u0627\u062c\u0639 \u0627\u0644\u0634\u0647\u0627\u062f\u0629";
    }
    return wrapLrmDigits(`${d} ${AR.daysRemaining}`);
  }
  if (d < 0) {
    return "See certificate";
  }
  return `${d} days remaining`;
}

function reputationSubtitle(data: PdfReportDataV5, locale: LocaleV5): string {
  const m = data.intel.malicious;
  const t = Math.max(data.intel.total, 1);
  if (locale === "ar") {
    return wrapLrmDigits(`${m}/${t} ${AR.malicious}`);
  }
  return `${m}/${t} malicious signals`;
}

function metaLine(data: PdfReportDataV5, locale: LocaleV5): string {
  if (locale === "ar") {
    return wrapLrmDigits(`${AR.scanned} ${data.base.timestamp} · ID ${data.base.scanId}`);
  }
  return `Scanned ${data.base.timestamp} · ID ${data.base.scanId}`;
}

const s = StyleSheet.create({
  page: { width: A4_W, height: A4_H, backgroundColor: colors.pageBg },
  inner: {
    paddingTop: PAGE_PAD_V,
    paddingBottom: padB,
    paddingHorizontal: PAGE_PAD_H,
    flex: 1,
  },
  brandEn: {
    fontSize: 8,
    fontWeight: 700,
    color: colors.brandCyan,
    letterSpacing: 0.55,
    textTransform: "uppercase",
    marginBottom: 28,
  },
  brandRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginBottom: 28 },
  heroRow: { flexDirection: "row", alignItems: "flex-start", width: "100%" },
  narrativeCol: { flex: 1, paddingRight: 20 },
  narrativeColAr: { flex: 1, paddingLeft: 20, paddingRight: 0 },
  scoreTower: { width: SCORE_TOWER_W, alignItems: "flex-end" },
  pill: {
    borderRadius: 14,
    borderWidth: 0.5,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  pillDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  pillDotAr: { width: 6, height: 6, borderRadius: 3, marginLeft: 6 },
  pillTextEn: { fontSize: 9, letterSpacing: 0.8 },
  pillTextAr: { fontSize: 9, letterSpacing: 0 },
  domain: { fontSize: 24, fontWeight: 500, color: colors.white, marginTop: 12 },
  meta: { fontSize: 9, color: mutedHex, marginTop: 4 },
  exec: { fontSize: 12, color: execHex, lineHeight: 1.6, marginTop: 16, maxWidth: EXEC_MAX_W },
  card: {
    flex: 1,
    backgroundColor: cardBg,
    borderWidth: 0.5,
    borderColor: cardBorder,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cardsRow: { flexDirection: "row", marginTop: 32, width: "100%" },
  breakdownBox: {
    backgroundColor: cardBg,
    borderWidth: 0.5,
    borderColor: cardBorder,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 20,
    width: "100%",
  },
  breakdownTitle: { fontSize: 9, color: mutedHex, letterSpacing: 0.8, marginBottom: 12 },
  breakdownTitleAr: { fontSize: 9, color: mutedHex, letterSpacing: 0, marginBottom: 12, textAlign: "right" },
  barBlock: { marginBottom: 12 },
  barTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5, width: "100%" },
  barTrack: {
    height: 5,
    width: "100%",
    backgroundColor: colors.deepBg,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: 5, borderRadius: 3 },
  barLabel: { fontSize: 9, color: colors.muted },
});

function MetricCard({
  label,
  value,
  subtitle,
  valueFontSize,
  valueColor,
  locale,
  index,
  valueLocale,
}: {
  label: string;
  value: string;
  subtitle: string;
  valueFontSize: number;
  valueColor: string;
  locale: LocaleV5;
  index: number;
  valueLocale?: boolean;
}) {
  const labelStyle: Style[] = [
    { fontSize: 9, color: mutedHex, letterSpacing: locale === "ar" ? 0 : 0.8 },
    bf(locale),
  ];
  const subStyle: Style[] = [{ fontSize: 10, color: cardMuted, marginTop: 6 }, bf(locale)];
  return (
    <View
      style={[
        s.card,
        { marginLeft: index === 0 ? 0 : 5, marginRight: index === 2 ? 0 : 5 },
      ]}
      wrap={false}
    >
      <LocaleText locale={locale} style={labelStyle} wrap={false}>
        {label}
      </LocaleText>
      {valueLocale ? (
        <LocaleText
          locale={locale}
          style={[{ fontSize: valueFontSize, fontWeight: 500, color: valueColor, marginTop: 8 }, bf(locale)]}
          wrap={false}
        >
          {value}
        </LocaleText>
      ) : (
        <LtrText
          value={value}
          style={[{ fontSize: valueFontSize, fontWeight: 500, color: valueColor, marginTop: 8 }, bf("en")]}
        />
      )}
      <LocaleText locale={locale} style={subStyle} wrap>
        {subtitle}
      </LocaleText>
    </View>
  );
}

export function ScorecardPageV5({ data }: { data: PdfReportDataV5 }) {
  const { locale, base, decisionSignal } = data;
  const isAr = locale === "ar";
  const tier = decisionSignal.tier;
  const bc = bannerColors[tier];
  const counts = severityCounts(data.findings);
  const tlsGreen = data.tls.version.includes("1.3");
  const repLower = data.intel.reputation.trim().toLowerCase();
  const repGreen = repLower.includes("trust") && data.intel.malicious === 0;

  const narrativeStyle = isAr ? s.narrativeColAr : s.narrativeCol;

  const scoreTower = (
    <View style={s.scoreTower} wrap={false}>
      <LtrText
        value={String(base.score)}
        style={[{ fontSize: 42, fontWeight: 300, color: colors.white, lineHeight: 1 }, bf("en")]}
      />
      <LtrText value="/100" style={[{ fontSize: 10, color: mutedHex, marginTop: 2 }, bf("en")]} />
      <LtrText
        value={base.grade}
        style={[
          { fontSize: 26, fontWeight: 500, color: colors.brandCyan, marginTop: 18, lineHeight: 1 },
          bf("en"),
        ]}
      />
      <LocaleText
        locale={locale}
        style={[
          {
            fontSize: 9,
            color: mutedHex,
            letterSpacing: isAr ? 0 : 0.8,
            marginTop: 4,
          },
          bf(locale),
        ]}
        wrap={false}
      >
        {isAr ? AR.grade : "GRADE"}
      </LocaleText>
    </View>
  );

  const narrativeCol = (
    <View style={narrativeStyle} wrap={false}>
      <View
        style={[
          s.pill,
          { backgroundColor: bc.bg, borderColor: bc.border },
          isAr ? { flexDirection: "row-reverse" } : {},
        ]}
        wrap={false}
      >
        <View style={[isAr ? s.pillDotAr : s.pillDot, { backgroundColor: bc.border }]} />
        {isAr ? (
          <LocaleText locale={locale} style={[s.pillTextAr, { color: bc.text }, bf(locale)]} wrap={false}>
            {decisionSignal.labelAr}
          </LocaleText>
        ) : (
          <LtrText
            value={decisionSignal.label.toUpperCase()}
            style={[s.pillTextEn, { color: bc.border }, bf("en")]}
          />
        )}
      </View>

      <LtrText value={base.domain} style={[s.domain, bf("en")]} />
      <LtrText value={metaLine(data, locale)} style={[s.meta, bf("en")]} />

      <View style={isAr ? { direction: "rtl", maxWidth: EXEC_MAX_W } : {}} wrap={false}>
        <LocaleText locale={locale} style={[s.exec, bf(locale)]} wrap>
          {data.executiveSentence}
        </LocaleText>
      </View>
    </View>
  );

  const findingsLabel = isAr ? AR.findings : "FINDINGS";
  const tlsLabel = isAr ? AR.tlsStatus : "TLS STATUS";
  const repLabel = isAr ? AR.reputation : "REPUTATION";
  const breakdownTitle = isAr ? AR.scoreBreakdown : "SCORE BREAKDOWN";

  const barInnerW = Math.max(120, INNER_CONTENT_W - 36);

  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap>
      <View style={s.inner}>
        {isAr ? (
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginBottom: 28 }} wrap={false}>
            <LtrText
              value={"CyberGurdian AI · "}
              style={[{ fontSize: 8, fontWeight: 700, color: colors.brandCyan, letterSpacing: 0.35 }, bf("en")]}
            />
            <View style={{ direction: "rtl" }} wrap={false}>
              <ArText style={{ fontSize: 8, fontWeight: 700, color: colors.brandCyan }} wrap={false}>
                {AR.brand}
              </ArText>
            </View>
          </View>
        ) : (
          <EnText style={[s.brandEn, bf("en")]} wrap={false}>
            CYBERGUARDIAN AI · SECURITY INTELLIGENCE REPORT
          </EnText>
        )}

        <View style={[s.heroRow, isAr ? { flexDirection: "row-reverse" } : {}]} wrap={false}>
          {narrativeCol}
          {scoreTower}
        </View>

        <View style={[s.cardsRow, isAr ? { flexDirection: "row-reverse" } : {}]} wrap={false}>
          <MetricCard
            label={findingsLabel}
            value={String(data.findings.length)}
            subtitle={findingsSubtitle(data, locale)}
            valueFontSize={22}
            valueColor={colors.white}
            locale={locale}
            index={0}
          />
          <MetricCard
            label={tlsLabel}
            value={data.tls.version}
            subtitle={tlsSubtitle(data, locale)}
            valueFontSize={16}
            valueColor={tlsGreen ? "#22c55e" : colors.white}
            locale={locale}
            index={1}
          />
          <MetricCard
            label={repLabel}
            value={reputationLabel(data.intel.reputation, locale)}
            subtitle={reputationSubtitle(data, locale)}
            valueFontSize={16}
            valueColor={repGreen ? "#22c55e" : colors.white}
            locale={locale}
            index={2}
            valueLocale
          />
        </View>

        <View style={s.breakdownBox} wrap={false}>
          <LocaleText
            locale={locale}
            style={isAr ? [s.breakdownTitleAr, bf(locale)] : [s.breakdownTitle, bf(locale)]}
            wrap={false}
          >
            {breakdownTitle}
          </LocaleText>

          {CAT_ORDER.map((key) => {
            const score = scoreForCategory(data, key);
            const labelEn = CATEGORY_LABEL_EN[key];
            const labelAr =
              data.categoryLabelsAr[key] !== undefined && data.categoryLabelsAr[key] !== ""
                ? data.categoryLabelsAr[key]
                : CATEGORY_LABEL_AR[key];
            const label = isAr ? labelAr : labelEn;
            const w = Math.max(0, Math.min(100, score));
            const numColor = score < 60 ? colors.barBad : colors.body;
            return (
              <View key={key} style={s.barBlock} wrap={false}>
                <View style={[s.barTop, isAr ? { flexDirection: "row-reverse" } : {}]} wrap={false}>
                  <Text style={[s.barLabel, bf(locale), isAr ? { textAlign: "right" } : {}]}>{label}</Text>
                  <LtrText value={String(score)} style={[{ fontSize: 9, color: numColor }, bf("en")]} />
                </View>
                <View style={s.barTrack}>
                  <View
                    style={[
                      s.barFill,
                      {
                        width: Math.round((w / 100) * barInnerW),
                        backgroundColor: barColor(score),
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
      <FixedPageFooterV5 locale={locale} />
    </Page>
  );
}
