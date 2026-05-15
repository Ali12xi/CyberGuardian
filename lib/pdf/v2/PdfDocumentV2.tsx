import type { ReactElement } from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { LtrText } from "@/lib/pdf/phaseA/LtrText";
import { getPdfBodyFont } from "@/lib/pdf/phaseB/pdfFonts";
import { AttackSurfaceBars, DonutChart, GaugeChart, ScoreBreakdownBars } from "@/lib/pdf/v2/charts";
import {
  InfoCard,
  PageFooterV2,
  SectionTitle,
  SeverityBadge,
  footerReserveV2,
  type LocaleV2,
} from "@/lib/pdf/v2/components";
import { A4, contentWidthV2, dark, marginV2, typo } from "@/lib/pdf/v2/constants";
import type { PdfFindingCardV2, PdfRecommendationCardV2, PdfReportDataV2 } from "@/lib/pdf/v2/mapV2";

const gap = 8;
const col4 = Math.floor((contentWidthV2 - gap * 3) / 4);
const col2 = Math.floor((contentWidthV2 - gap) / 2);

function bf(locale: LocaleV2): Style {
  return { fontFamily: getPdfBodyFont(locale) };
}

const s = StyleSheet.create({
  page: {
    width: A4.width,
    height: A4.height,
    backgroundColor: dark.pageBg,
    padding: marginV2,
    paddingBottom: marginV2 + footerReserveV2(),
    color: dark.textPrimary,
    position: "relative",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  card: {
    backgroundColor: dark.cardBg,
    borderWidth: 1,
    borderColor: dark.cardBorder,
    borderRadius: 8,
    padding: 16,
  },
  stripeCard: {
    backgroundColor: dark.cardBg,
    borderWidth: 1,
    borderColor: dark.cardBorder,
    borderRadius: 8,
    flexDirection: "row",
    overflow: "hidden",
  },
  stripe3: {
    width: 3,
    backgroundColor: dark.accentCyan,
  },
  stripe3Green: {
    width: 3,
    backgroundColor: dark.green,
  },
  stripe3Red: {
    width: 3,
    backgroundColor: dark.red,
  },
  stripe3Amber: {
    width: 3,
    backgroundColor: dark.amber,
  },
  stripeBody: {
    flex: 1,
    padding: 12,
  },
  brandCyan: {
    fontSize: typo.brand,
    fontWeight: 700,
    color: dark.accentCyan,
    marginBottom: 2,
  },
  reportTitle: {
    fontSize: typo.reportTitle,
    fontWeight: 700,
    color: dark.textPrimary,
  },
  ts: {
    fontSize: 8,
    color: dark.textSecondary,
  },
  ver: {
    fontSize: typo.version,
    color: dark.textMuted,
    marginTop: 2,
  },
  threatHero: {
    fontSize: typo.threatHero,
    fontWeight: 700,
    marginVertical: 6,
  },
  detectRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detectLabel: {
    fontSize: 7,
    color: dark.accentCyan,
    letterSpacing: 1,
    marginLeft: 6,
  },
  methodologyItalic: {
    fontSize: 8,
    fontStyle: "italic",
    color: dark.accentCyan,
    marginBottom: 4,
  },
  methodologyBody: {
    fontSize: 8,
    color: dark.textSecondary,
    lineHeight: 1.35,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: gap,
  },
  summaryKicker: {
    fontSize: 8,
    fontWeight: 700,
    color: dark.accentCyan,
    marginBottom: 4,
  },
  summaryBody: {
    fontSize: typo.body,
    color: dark.textSecondary,
    lineHeight: 1.35,
  },
  findingCard: {
    backgroundColor: dark.cardBg,
    borderWidth: 1,
    borderColor: dark.cardBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  findingTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: dark.textPrimary,
    marginTop: 4,
  },
  findingImpact: {
    fontSize: typo.body,
    color: dark.textSecondary,
    marginTop: 4,
  },
  findingMeta: {
    fontSize: typo.meta,
    color: dark.metaText,
    marginTop: 4,
  },
  findingStd: {
    fontSize: typo.meta,
    color: dark.accentCyan,
    marginTop: 4,
  },
  techMuted: {
    fontSize: 8,
    color: dark.accentCyan,
  },
  recTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: dark.textPrimary,
    marginTop: 4,
  },
  recWhy: {
    fontSize: typo.body,
    color: dark.textSecondary,
    marginTop: 4,
  },
  recMeta: {
    fontSize: typo.meta,
    fontWeight: 700,
    color: dark.textPrimary,
    marginTop: 4,
  },
  recFix: {
    fontSize: typo.meta,
    color: dark.accentCyan,
    marginTop: 4,
  },
  headersList: {
    fontSize: typo.body,
    color: dark.textSecondary,
    marginTop: 4,
  },
  integrityTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: dark.green,
    marginBottom: 6,
  },
  disclaimer: {
    fontSize: 8,
    color: dark.textMuted,
    lineHeight: 1.35,
    marginTop: 10,
  },
  copyright: {
    fontSize: 8,
    color: dark.textMuted,
    textAlign: "center",
    marginTop: 6,
  },
  analyticsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  analyticsBlock: {
    width: Math.floor((contentWidthV2 - gap * 2) / 3),
    alignItems: "center",
  },
});

function t(locale: LocaleV2, en: string, ar: string): string {
  return locale === "ar" ? ar : en;
}

function scanIdPdfDisplay(scanId: string): string {
  if (scanId === "-" || scanId.length <= 16) {
    return scanId;
  }
  return `${scanId.slice(0, 8)}...${scanId.slice(-4)}`;
}

function FindingCard({
  f,
  locale,
}: {
  f: PdfFindingCardV2;
  locale: LocaleV2;
}) {
  const title = locale === "ar" ? f.titleAr : f.titleEn;
  const impact = locale === "ar" ? f.impactAr : f.impactEn;
  const meta = locale === "ar" ? f.metaAr : f.metaEn;
  const std = locale === "ar" ? f.standardsAr : f.standardsEn;
  return (
    <View style={s.findingCard} wrap={false}>
      <View style={s.rowBetween}>
        <SeverityBadge level={f.severity} locale={locale} />
        <Text style={[s.techMuted, bf(locale)]}>Technical issue</Text>
      </View>
      <Text style={[s.findingTitle, bf(locale)]}>{title}</Text>
      <Text style={[s.findingImpact, bf(locale)]}>{impact}</Text>
      <LtrText value={meta} style={[s.findingMeta, bf(locale)]} />
      <LtrText value={std} style={[s.findingStd, bf(locale)]} />
    </View>
  );
}

function RecommendationCard({
  r,
  locale,
}: {
  r: PdfRecommendationCardV2;
  locale: LocaleV2;
}) {
  const title = locale === "ar" ? r.titleAr : r.titleEn;
  const why = locale === "ar" ? r.whyAr : r.whyEn;
  const meta = locale === "ar" ? r.metaAr : r.metaEn;
  const fix = locale === "ar" ? r.fixAr : r.fixEn;
  return (
    <View style={s.findingCard} wrap={false}>
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <SeverityBadge level={r.severity} locale={locale} />
        <Text style={[s.recTitle, bf(locale), { flex: 1, marginLeft: 8 }]}>{title}</Text>
      </View>
      <Text style={[s.recWhy, bf(locale)]}>{why}</Text>
      <LtrText value={meta} style={[s.recMeta, bf(locale)]} />
      <LtrText value={fix} style={[s.recFix, bf(locale)]} />
    </View>
  );
}

export function PdfDocumentV2({
  data,
  locale,
  qrDataUrl,
}: {
  data: PdfReportDataV2;
  locale: LocaleV2;
  qrDataUrl: string | null;
}): ReactElement {
  const total = data.totalPages;
  let pageNum = 0;
  const nextPage = () => {
    pageNum += 1;
    return pageNum;
  };

  const scoreRowsForBars = data.scoreBreakdownRows.map((r) => ({
    label: locale === "ar" ? r.labelAr : r.labelEn,
    score: r.score,
    maxScore: r.maxScore,
    color: r.color,
  }));

  const threatColor = data.threatAccentColor;
  const threatLabel = locale === "ar" ? data.threatDisplayAr : data.threatDisplayEn;

  const pages: ReactElement[] = [];

  pages.push(
    <Page key="cover" size="A4" style={s.page}>
      <View style={s.rowBetween}>
        <View style={{ maxWidth: contentWidthV2 * 0.72 }}>
          <Text style={[s.brandCyan, bf(locale)]}>CyberGurdian AI</Text>
          <Text style={[s.reportTitle, bf(locale)]}>
            {t(locale, "Cybersecurity Intelligence Report", "\u062a\u0642\u0631\u064a\u0631 \u0630\u0643\u0627\u0621 \u0627\u0644\u0623\u0645\u0627\u0646 \u0627\u0644\u0633\u064a\u0628\u0631\u0627\u0646\u064a")}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <LtrText value={data.timestampUtc} style={[s.ts, bf(locale)]} />
          <Text style={[s.ver, bf(locale)]}>V1.6</Text>
        </View>
      </View>

      <View style={[s.card, { marginTop: 12 }]}>
        <View style={s.detectRow} wrap={false}>
          <SeverityBadge level={data.scanMeta.threatClassification} locale={locale} />
          <Text style={[s.detectLabel, bf(locale)]}>DETECTED</Text>
        </View>
        <Text style={[s.threatHero, { color: threatColor }, bf(locale)]}>{threatLabel}</Text>
        <LtrText value={data.finalUrl} style={[s.ts, { color: dark.metaText }, bf(locale)]} />
      </View>

      <View style={[s.stripeCard, { marginTop: 10 }]}>
        <View style={s.stripe3} />
        <View style={s.stripeBody}>
          <Text style={[s.methodologyItalic, bf(locale)]}>
            {locale === "ar" ? data.methodologyItalicAr : data.methodologyItalicEn}
          </Text>
          <Text style={[s.methodologyBody, bf(locale)]}>
            {locale === "ar" ? data.methodologyBodyAr : data.methodologyBodyEn}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 12 }}>
        <View style={s.gridRow}>
          <InfoCard label="SECURITY SCORE" value={`${data.score}/${data.maxScore}`} locale={locale} width={col4} />
          <InfoCard label="GRADE" value={data.grade} locale={locale} width={col4} />
          <InfoCard
            label="VISIBILITY"
            value={locale === "ar" ? data.visibilityAr : data.visibilityEn}
            locale={locale}
            width={col4}
          />
          <InfoCard label="SCAN TIMESTAMP" value={data.timestampUtc} locale={locale} width={col4} />
        </View>
        <View style={s.gridRow}>
          <InfoCard label="SCAN ID" value={scanIdPdfDisplay(data.scanId)} locale={locale} width={col4} valueFontSize={8} />
          <InfoCard label="THREAT LEVEL" value={data.scanMeta.threatClassification} locale={locale} width={col4} />
          <InfoCard
            label="INFRA TRUST"
            value={locale === "ar" ? data.infraTrustAr : data.infraTrustEn}
            locale={locale}
            width={col4}
          />
          <InfoCard label="VERSION" value="V1.6" locale={locale} width={col4} />
        </View>
      </View>

      <SectionTitle title={t(locale, "Cover / Executive Summary", "\u0627\u0644\u063a\u0644\u0627\u0641 / \u0645\u0644\u062e\u0635 \u062a\u0646\u0641\u064a\u0630\u064a")} locale={locale} />
      <View style={s.stripeCard}>
        <View style={s.stripe3} />
        <View style={s.stripeBody}>
          <Text style={[s.summaryKicker, bf(locale)]}>
            {t(locale, "Executive Risk Overview", "\u0646\u0638\u0631\u0629 \u0627\u0644\u0645\u062e\u0627\u0637\u0631 \u0627\u0644\u062a\u0646\u0641\u064a\u0630\u064a\u0629")}
          </Text>
          <Text style={[s.summaryBody, bf(locale)]}>
            {locale === "ar" ? data.overviewSummaryAr : data.overviewSummaryEn}
          </Text>
        </View>
      </View>

      <PageFooterV2 page={nextPage()} total={total} locale={locale} />
    </Page>,
  );

  data.findingChunks.forEach((chunk, idx) => {
    const isLastFind = idx === data.findingChunks.length - 1;
    pages.push(
      <Page key={`intel-${idx}`} size="A4" style={s.page}>
        {idx === 0 ? (
          <>
            <SectionTitle
              title={t(locale, "Security Intelligence Analytics", "\u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0630\u0643\u0627\u0621 \u0627\u0644\u0623\u0645\u0627\u0646")}
              locale={locale}
            />
            <View style={s.analyticsRow}>
              <View style={s.analyticsBlock}>
                <GaugeChart score={data.score} maxScore={data.maxScore} color={threatColor} />
              </View>
              <View style={s.analyticsBlock}>
                <ScoreBreakdownBars rows={scoreRowsForBars} />
              </View>
              <View style={s.analyticsBlock}>
                <DonutChart counts={data.findingCounts} />
              </View>
            </View>

            <SectionTitle title={t(locale, "Attack Surface", "\u0633\u0637\u062d \u0627\u0644\u0647\u062c\u0648\u0645")} locale={locale} />
            <AttackSurfaceBars bars={data.attackSurfaceBars} />
          </>
        ) : null}

        <SectionTitle title={t(locale, "Critical Findings", "\u0627\u0644\u0646\u062a\u0627\u0626\u062c \u0627\u0644\u062d\u0631\u062c\u064a\u0629")} locale={locale} />
        {chunk.length === 0 ? (
          <Text style={[s.summaryBody, bf(locale)]}>
            {t(locale, "No critical findings recorded for this scan.", "\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c \u062d\u0631\u062c\u064a\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u0641\u062d\u0635.")}
          </Text>
        ) : (
          chunk.map((f, j) => <FindingCard key={j} f={f} locale={locale} />)
        )}

        {isLastFind ? (
          <>
            <SectionTitle
              title={t(locale, "Threat Intelligence", "\u0630\u0643\u0627\u0621 \u0627\u0644\u062a\u0647\u062f\u064a\u062f\u0627\u062a")}
              locale={locale}
            />
            <View style={s.gridRow}>
              <InfoCard label="DOMAIN" value={data.intelligenceV2.domain} locale={locale} width={col2} />
              <InfoCard label="REPUTATION" value={data.intelligenceV2.reputation} locale={locale} width={col2} />
            </View>
            <View style={s.gridRow}>
              <InfoCard label="SUSPICIOUS TLD" value={data.intelligenceV2.suspiciousTld} locale={locale} width={col2} />
              <InfoCard label="PHISHING KEYWORDS" value={data.intelligenceV2.phishingKeywords} locale={locale} width={col2} />
            </View>
            <View style={s.gridRow}>
              <InfoCard label="URL ENTROPY" value={data.intelligenceV2.urlEntropy} locale={locale} width={col2} />
              <InfoCard label="TYPOSQUATTING" value={data.intelligenceV2.typosquatting} locale={locale} width={col2} />
            </View>
            <View style={s.gridRow}>
              <InfoCard label="REPUTATION VERDICT" value={data.intelligenceV2.reputationVerdict} locale={locale} width={col2} />
              <InfoCard label="MALICIOUS DETECTIONS" value={data.intelligenceV2.maliciousDetections} locale={locale} width={col2} />
            </View>
            <View style={s.gridRow}>
              <InfoCard label="SUSPICIOUS DETECTIONS" value={data.intelligenceV2.suspiciousDetections} locale={locale} width={col2} />
              <InfoCard label="REPUTATION NOTE" value={data.intelligenceV2.reputationNote} locale={locale} width={col2} />
            </View>
          </>
        ) : null}

        <PageFooterV2 page={nextPage()} total={total} locale={locale} />
      </Page>,
    );
  });

  pages.push(
    <Page key="infra" size="A4" style={s.page}>
      <SectionTitle title={t(locale, "TLS & Infrastructure", "TLS \u0648\u0627\u0644\u0628\u0646\u064a\u0629 \u0627\u0644\u062a\u062d\u062a\u064a\u0629")} locale={locale} />
      <View style={s.gridRow}>
        <InfoCard label="TLS VERSION" value={data.tlsInfra.tlsVersion} locale={locale} width={col2} />
        <InfoCard label="CIPHER" value={data.tlsInfra.cipher} locale={locale} width={col2} />
      </View>
      <View style={s.gridRow}>
        <InfoCard label="ISSUER" value={data.tlsInfra.issuer} locale={locale} width={col2} />
        <InfoCard label="DAYS LEFT" value={data.tlsInfra.daysLeft} locale={locale} width={col2} />
      </View>
      <View style={s.gridRow}>
        <InfoCard label="INFRASTRUCTURE" value={data.tlsInfra.infrastructure} locale={locale} width={col2} />
        <InfoCard label="CDN" value={data.tlsInfra.cdn} locale={locale} width={col2} />
      </View>
      <View style={s.gridRow}>
        <InfoCard label="WAF" value={data.tlsInfra.waf} locale={locale} width={col2} />
        <InfoCard label="CLOUD PROVIDER" value={data.tlsInfra.cloudProvider} locale={locale} width={col2} />
      </View>
      <View style={s.gridRow}>
        <InfoCard label="HOSTING PROVIDER" value={data.tlsInfra.hostingProvider} locale={locale} width={col2} />
        <InfoCard label="ASN" value={data.tlsInfra.asn} locale={locale} width={col2} />
      </View>
      <View style={{ marginBottom: gap }}>
        <InfoCard label="SERVER" value={data.tlsInfra.server} locale={locale} width={contentWidthV2} />
      </View>

      <SectionTitle title={t(locale, "Security Headers", "\u0631\u0624\u0648\u0633 \u0627\u0644\u0623\u0645\u0627\u0646")} locale={locale} />
      <View style={[s.stripeCard, { marginBottom: gap }]}>
        <View style={s.stripe3Green} />
        <View style={s.stripeBody}>
          <Text style={[{ fontSize: 8, fontWeight: 700, color: dark.green, marginBottom: 4 }, bf(locale)]}>
            Present
          </Text>
          <LtrText
            value={data.presentHeaders.length ? data.presentHeaders.join(", ") : "-"}
            style={[s.headersList, bf(locale)]}
          />
        </View>
      </View>
      <View style={[s.stripeCard, { marginBottom: gap }]}>
        <View style={s.stripe3Red} />
        <View style={s.stripeBody}>
          <Text style={[{ fontSize: 8, fontWeight: 700, color: dark.red, marginBottom: 4 }, bf(locale)]}>
            Missing
          </Text>
          <LtrText
            value={data.missingHeaders.length ? data.missingHeaders.join(", ") : "-"}
            style={[s.headersList, bf(locale)]}
          />
        </View>
      </View>
      <View style={[s.stripeCard, { marginBottom: 10 }]}>
        <View style={s.stripe3Amber} />
        <View style={s.stripeBody}>
          <Text style={[{ fontSize: 8, fontWeight: 700, color: dark.amber, marginBottom: 4 }, bf(locale)]}>
            Impact
          </Text>
          <Text style={[s.headersList, bf(locale)]}>
            {locale === "ar" ? data.headersImpactAr : data.headersImpactEn}
          </Text>
        </View>
      </View>

      <SectionTitle title={t(locale, "Scan Metadata", "\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0641\u062d\u0635")} locale={locale} />
      <View style={s.gridRow}>
        <InfoCard label="SCAN ID" value={scanIdPdfDisplay(data.scanMeta.scanId)} locale={locale} width={col4} valueFontSize={8} />
        <InfoCard label="GENERATED BY" value={data.scanMeta.generatedBy} locale={locale} width={col4} />
        <InfoCard label="SCANNER ENGINE" value={data.scanMeta.scannerEngine} locale={locale} width={col4} />
        <InfoCard label="SCAN DURATION" value={data.scanMeta.scanDuration} locale={locale} width={col4} />
      </View>
      <View style={s.gridRow}>
        <InfoCard label="INTELLIGENCE ENGINE" value={data.scanMeta.intelligenceEngine} locale={locale} width={col4} />
        <InfoCard label="SCAN TIMESTAMP" value={data.scanMeta.timestamp} locale={locale} width={col4} />
        <InfoCard label="CONFIDENCE" value={`${data.confidence}%`} locale={locale} width={col4} />
        <InfoCard label="INFRA TRUST" value={data.scanMeta.infraTrust} locale={locale} width={col4} />
      </View>

      <PageFooterV2 page={nextPage()} total={total} locale={locale} />
    </Page>,
  );

  data.recommendationChunks.forEach((chunk, idx) => {
    pages.push(
      <Page key={`rec-${idx}`} size="A4" style={s.page}>
        {idx === 0 ? (
          <>
            <SectionTitle
              title={t(locale, "Executive Recommendations", "\u062a\u0648\u0635\u064a\u0627\u062a \u062a\u0646\u0641\u064a\u0630\u064a\u0629")}
              locale={locale}
            />
            <View style={s.stripeCard}>
              <View style={s.stripe3} />
              <View style={s.stripeBody}>
                <Text style={[s.summaryKicker, bf(locale)]}>
                  {t(locale, "Executive intelligence brief", "\u0645\u0644\u062e\u0635 \u0630\u0643\u0627\u0621 \u062a\u0646\u0641\u064a\u0630\u064a")}
                </Text>
                <Text style={[s.summaryBody, bf(locale)]}>
                  {t(
                    locale,
                    "Prioritize findings by severity and exposure. Validate changes in staging before production rollout.",
                    "\u0623\u0648\u0644\u0648\u064a\u0627\u062a \u0627\u0644\u0646\u062a\u0627\u0626\u062c \u062d\u0633\u0628 \u0627\u0644\u062e\u0637\u0648\u0631\u0629 \u0648\u0627\u0644\u062a\u0639\u0631\u0636. \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a \u0641\u064a \u0628\u064a\u0626\u0629 \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631 \u0642\u0628\u0644 \u0627\u0644\u0625\u0637\u0644\u0627\u0642.",
                  )}
                </Text>
              </View>
            </View>
          </>
        ) : null}
        {chunk.length === 0 ? (
          <Text style={[s.summaryBody, bf(locale)]}>
            {t(locale, "No recommendations for this scan.", "\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u0648\u0635\u064a\u0627\u062a \u0644\u0647\u0630\u0627 \u0627\u0644\u0641\u062d\u0635.")}
          </Text>
        ) : (
          chunk.map((r, j) => <RecommendationCard key={j} r={r} locale={locale} />)
        )}
        <PageFooterV2 page={nextPage()} total={total} locale={locale} />
      </Page>,
    );
  });

  pages.push(
    <Page key="integrity" size="A4" style={s.page}>
      <SectionTitle
        title={t(locale, "Report Integrity & Verification", "\u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0648\u0627\u0644\u062a\u062d\u0642\u0642")}
        locale={locale}
      />
      <View style={s.rowBetween}>
        <View style={{ width: col2 }}>
          <InfoCard label="SCAN TOKEN" value={data.tokenDisplay} locale={locale} width={col2} />
          <View style={{ height: gap }} />
          <InfoCard label="TARGET" value={data.finalUrl} locale={locale} width={col2} />
          <View style={{ height: gap }} />
          <InfoCard label="GENERATED" value={data.timestampUtc} locale={locale} width={col2} />
          <View style={{ height: gap }} />
          <InfoCard label="VERSION" value="V1.6" locale={locale} width={col2} />
        </View>
        <View style={[s.card, { width: col2, padding: 12 }]}>
          <Text style={[s.integrityTitle, bf(locale)]}>Report integrity</Text>
          <Text style={[{ fontSize: typo.body, color: dark.textSecondary }, bf(locale)]}>Method: HMAC-SHA256</Text>
          <Text style={[{ fontSize: typo.meta, color: dark.textSecondary, marginTop: 4 }, bf(locale)]}>Token</Text>
          <LtrText value={data.hmacDisplay} style={[{ fontSize: 8, color: dark.accentCyan }, bf(locale)]} />
          <Text style={[{ fontSize: typo.meta, color: dark.textSecondary, marginTop: 6 }, bf(locale)]}>Verify at</Text>
          <LtrText value={data.verifyDisplayLine1} style={[{ fontSize: 8, color: dark.accentCyan }, bf(locale)]} />
          <LtrText value={data.verifyDisplayLine2} style={[{ fontSize: 8, color: dark.accentCyan }, bf(locale)]} />
        </View>
      </View>

      <View style={{ alignItems: "center", marginTop: 16 }}>
        {qrDataUrl !== null ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image has no alt prop
          <Image src={qrDataUrl} style={{ width: 64, height: 64 }} />
        ) : null}
        <Text style={[{ fontSize: 7, color: dark.metaText, marginTop: 6 }, bf(locale)]}>
          {t(locale, "Scan to verify this report", "\u0627\u0645\u0633\u062d \u0644\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u062a\u0642\u0631\u064a\u0631")}
        </Text>
      </View>

      <Text style={[s.disclaimer, bf(locale)]}>
        {t(
          locale,
          "This report is generated from external observation only and does not constitute a penetration test or legal advice.",
          "\u064a\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0647\u0630\u0627 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0645\u0646 \u0645\u0644\u0627\u062d\u0638\u0629 \u062e\u0627\u0631\u062c\u064a\u0629 \u0641\u0642\u0637 \u0648\u0644\u0627 \u064a\u0634\u0643\u0644 \u0627\u062e\u062a\u0628\u0627\u0631 \u0627\u062e\u062a\u0631\u0627\u0642 \u0623\u0648 \u0627\u0633\u062a\u0634\u0627\u0631\u0629 \u0642\u0627\u0646\u0648\u0646\u064a\u0629.",
        )}
      </Text>
      <Text style={[s.copyright, bf(locale)]}>CyberGurdian AI © 2026 · Engineered by Ali · V1.6</Text>

      <PageFooterV2 page={nextPage()} total={total} locale={locale} />
    </Page>,
  );

  return <Document>{pages}</Document>;
}
