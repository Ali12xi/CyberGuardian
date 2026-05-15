import type { ReactElement } from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { A4, contentWidth, margin, palette } from "@/lib/pdf/phaseA/constants";
import { LtrText } from "@/lib/pdf/phaseA/LtrText";
import { footerReservePt } from "@/lib/pdf/phaseA/PageFooter";
import type { PdfPlanFinding, PdfReportData } from "@/lib/pdf/phaseB/mapScanResult";
import { getPdfBodyFont } from "@/lib/pdf/phaseB/pdfFonts";

const coverExecLeftW = Math.round(contentWidth * 0.55);
const coverExecRightW = contentWidth - coverExecLeftW;
const halfCol = Math.floor((contentWidth - 1) / 2);
const planCardW = Math.floor((contentWidth - 16) / 2);

const s = StyleSheet.create({
  page: {
    width: A4.width,
    height: A4.height,
    backgroundColor: palette.white,
    padding: margin,
    paddingTop: margin + 3,
    fontFamily: "Helvetica",
    color: palette.textPrimary,
    position: "relative",
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: A4.width,
    height: 3,
  },
  bodyBottomPad: {
    paddingBottom: footerReservePt(),
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sepFull: {
    height: 1,
    width: contentWidth,
    backgroundColor: palette.separator,
    marginVertical: 16,
  },
  pill: {
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  pillText: {
    fontSize: 8,
    fontWeight: 700,
  },
  kicker: {
    fontSize: 8,
    color: palette.textSecond,
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  brand: {
    fontSize: 14,
    fontWeight: 700,
    color: palette.textPrimary,
  },
  metaLabel: {
    fontSize: 9,
    color: palette.textSecond,
  },
  methodologyBox: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.separator,
    padding: 12,
    marginTop: 8,
  },
  methodologyTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: palette.textPrimary,
    marginBottom: 6,
  },
  methodologyBody: {
    fontSize: 8,
    color: palette.textSecond,
    lineHeight: 1.45,
  },
  disclaimer: {
    fontSize: 8,
    color: palette.textMuted,
    lineHeight: 1.45,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 24,
  },
  sectionLabel: {
    fontSize: 7,
    color: palette.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  barTrack: {
    width: contentWidth,
    height: 4,
    backgroundColor: palette.separator,
    marginBottom: 4,
    position: "relative",
  },
  barFill: {
    position: "absolute",
    left: 0,
    top: 0,
    height: 4,
  },
  scoreRowGap: {
    marginBottom: 16,
  },
  planCard: {
    width: planCardW,
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 3,
    borderTopColor: palette.separator,
    borderRightColor: palette.separator,
    borderBottomColor: palette.separator,
    padding: 14,
  },
  codeBox: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.separator,
    padding: 8,
    marginTop: 8,
  },
  codeText: {
    fontSize: 8,
    fontFamily: "Courier",
    color: palette.textPrimary,
  },
  qrBox: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: palette.separator,
    backgroundColor: palette.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  integrityBox: {
    borderWidth: 1,
    borderColor: palette.separator,
    backgroundColor: palette.surface,
    padding: 12,
    width: Math.floor(contentWidth * 0.48),
  },
  footerBar: {
    position: "absolute",
    bottom: margin,
    left: margin,
    width: contentWidth,
    borderTopWidth: 1,
    borderTopColor: palette.separator,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  footerLeft: {
    fontSize: 8,
    color: palette.textMuted,
    maxWidth: contentWidth * 0.62,
  },
  footerRight: {
    fontSize: 8,
    color: palette.textMuted,
  },
});

type Locale = "en" | "ar";

function withPdfFont(locale: Locale, ...parts: (Style | undefined | false)[]): Style | Style[] {
  const flat = parts.filter(Boolean) as Style[];
  if (flat.some((p) => (p as { fontFamily?: string }).fontFamily === "Courier")) {
    return flat.length === 1 ? flat[0]! : flat;
  }
  const tail: Style = { fontFamily: getPdfBodyFont(locale) };
  if (flat.length === 0) {
    return tail;
  }
  return [...flat, tail];
}

function PdfPageFooter({
  pageIndex,
  totalPages,
  locale,
}: {
  pageIndex: number;
  totalPages: number;
  locale: Locale;
}) {
  const left =
    locale === "ar"
      ? "CyberGurdian AI \u2014 \u062a\u0642\u0631\u064a\u0631 \u0623\u0645\u0646\u064a \u062e\u0627\u0631\u062c\u064a"
      : "CyberGurdian AI — External Security Report";
  const right = `Page ${pageIndex} of ${totalPages}`;
  return (
    <View style={s.footerBar} fixed>
      <Text
        style={withPdfFont(
          locale,
          s.footerLeft,
          locale === "ar" ? { textAlign: "right" } : { textAlign: "left" },
        )}
      >
        {left}
      </Text>
      <LtrText value={right} style={withPdfFont(locale, s.footerRight)} />
    </View>
  );
}

function barColorPct(pct: number): string {
  if (pct >= 80) {
    return palette.green;
  }
  if (pct >= 40) {
    return palette.amber;
  }
  return palette.red;
}

function labels(locale: Locale) {
  if (locale === "ar") {
    return {
      kicker: "\u062a\u0642\u0631\u064a\u0631 \u0623\u0645\u0646\u064a \u062e\u0627\u0631\u062c\u064a",
      scoreTitle: "\u062a\u0641\u0635\u064a\u0644 \u0627\u0644\u0646\u062a\u064a\u062c\u0629 \u0627\u0644\u0623\u0645\u0646\u064a\u0629",
      scoreSub:
        "\u0625\u0634\u0627\u0631\u0627\u062a \u0635\u062d\u0629 \u0645\u0633\u062a\u0642\u0644\u0629 \u2014 \u0648\u0644\u064a\u0633\u062a \u062a\u0642\u0633\u064a\u0645\u064b\u0627 \u0644\u0644\u0646\u062a\u064a\u062c\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629.",
      noScores: "\u0644\u0627 \u062a\u062a\u0648\u0641\u0631 \u062a\u0641\u0627\u0635\u064a\u0644 \u0641\u0626\u0627\u062a.",
      assessmentTitle: "\u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0623\u0645\u0646\u064a",
      overview: "\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629",
      infra: "\u062b\u0642\u0629 \u0627\u0644\u0628\u0646\u064a\u0629 \u0627\u0644\u062a\u062d\u062a\u064a\u0629",
      attack: "\u0633\u0637\u062d \u0627\u0644\u0647\u062c\u0648\u0645",
      actions: "\u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0645\u0648\u0635\u0649 \u0628\u0647\u0627",
      visibility: "\u0627\u0644\u0631\u0624\u064a\u0629:",
      planTitle: "\u062e\u0637\u0629 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0623\u0645\u0646\u064a\u0629",
      planCompact: "\u062e\u0637\u0629 \u0627\u0644\u0639\u0645\u0644 (\u0645\u062e\u062a\u0635\u0631\u0629)",
      trustTitle: "\u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0648\u0627\u0644\u062a\u062d\u0642\u0642",
      scanId: "\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0641\u062d\u0635:",
      generated: "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0646\u0634\u0627\u0621:",
      methodologyTitle: "\u0645\u0646\u0647\u062c\u064a\u0629 \u0627\u0644\u062a\u0642\u064a\u064a\u0645",
      methodologyBody:
        "\u064a\u0639\u062a\u0645\u062f \u0647\u0630\u0627 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0639\u0644\u0649 \u062a\u062d\u0644\u064a\u0644 \u0623\u0645\u0646\u064a \u062e\u0627\u0631\u062c\u064a \u0633\u0644\u0628\u064a \u0641\u0642\u0637. \u0644\u0645 \u064a\u064f\u0646\u0641\u0651\u064e\u0630 \u0627\u062e\u062a\u0628\u0627\u0631\u064c \u0645\u064f\u062f\u062e\u064e\u0644 \u0623\u0648 \u0627\u0633\u062a\u063a\u0644\u0627\u0644 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u0641\u062d\u0635.",
      disclaimerCover:
        "\u064a\u0639\u0643\u0633 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0623\u0645\u0646\u064a \u0627\u0644\u0638\u0627\u0647\u0631 \u062e\u0627\u0631\u062c\u064a\u064b\u0627 \u0648\u0642\u062a \u0627\u0644\u0641\u062d\u0635 \u0641\u0642\u0637. \u0648\u0644\u0627 \u064a\u064f\u0639\u062f \u0627\u062e\u062a\u0628\u0627\u0631 \u0627\u062e\u062a\u0631\u0627\u0642 \u0623\u0648 \u062a\u0642\u064a\u064a\u0645\u064b\u0627 \u0644\u0644\u062b\u063a\u0631\u0627\u062a \u0623\u0648 \u0634\u0647\u0627\u062f\u0629 \u0623\u0645\u0646\u064a\u0629.",
      disclaimerTrust:
        "\u064a\u0639\u0643\u0633 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0623\u0645\u0646\u064a \u0627\u0644\u0638\u0627\u0647\u0631 \u062e\u0627\u0631\u062c\u064a\u064b\u0627 \u0648\u0642\u062a \u0627\u0644\u0641\u062d\u0635 \u0641\u0642\u0637. \u0648\u0644\u0627 \u064a\u064f\u0639\u062f \u0627\u062e\u062a\u0628\u0627\u0631 \u0627\u062e\u062a\u0631\u0627\u0642 \u0643\u0627\u0645\u0644\u0627\u064b \u0623\u0648 \u062a\u0642\u064a\u064a\u0645 \u062b\u063a\u0631\u0627\u062a \u0623\u0648 \u0634\u0647\u0627\u062f\u0629 \u0623\u0645\u0646\u064a\u0629 \u0642\u0627\u0646\u0648\u0646\u064a\u0629. \u064a\u064f\u062c\u0631\u064a CyberGurdian AI \u062a\u062d\u0644\u064a\u0644\u064b\u0627 \u062e\u0627\u0631\u062c\u064a\u064b\u0627 \u0633\u0644\u0628\u064a\u064b\u0627 \u063a\u064a\u0631 \u0645\u064f\u062f\u062e\u0650\u0644 \u0641\u0642\u0637.",
      scanToken: "\u0631\u0645\u0632 \u0627\u0644\u0641\u062d\u0635:",
      target: "\u0627\u0644\u0647\u062f\u0641:",
      version: "\u0627\u0644\u0625\u0635\u062f\u0627\u0631:",
      integrityTitle: "\u2713 \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u062a\u0642\u0631\u064a\u0631",
      method: "\u0627\u0644\u0637\u0631\u064a\u0642\u0629: HMAC-SHA256",
      tokenLbl: "\u0627\u0644\u0631\u0645\u0632:",
      verifyAt: "\u062a\u062d\u0642\u0642 \u0639\u0628\u0631:",
      qrNote: "\u0627\u0645\u0633\u062d \u0644\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u062a\u0642\u0631\u064a\u0631",
      copyright: "CyberGurdian AI \u00a9 2026 \u00b7 Engineered by Ali \u00b7 V1.6",
      grade: "\u0627\u0644\u062f\u0631\u062c\u0629:",
      score: "\u0627\u0644\u0646\u062a\u064a\u062c\u0629:",
      provider: "\u0627\u0644\u0645\u0632\u0648\u062f:",
      tlsCdn: "TLS / CDN",
      exposure: "\u0627\u0644\u062a\u0639\u0631\u0636:",
      biz: "\u0627\u0644\u0623\u062b\u0631 \u0627\u0644\u062a\u062c\u0627\u0631\u064a:",
    };
  }
  return {
    kicker: "EXTERNAL SECURITY REPORT",
    scoreTitle: "Security Score Breakdown",
    scoreSub: "Independent health signals — not a split\nof the headline score.",
    noScores: "No category breakdown available.",
    assessmentTitle: "Security Assessment",
    overview: "OVERVIEW",
    infra: "INFRASTRUCTURE TRUST",
    attack: "ATTACK SURFACE",
    actions: "RECOMMENDED ACTIONS",
    visibility: "Visibility:",
    planTitle: "Security Action Plan",
    planCompact: "Security Action Plan",
    trustTitle: "Report Integrity & Verification",
    scanId: "Scan ID:",
    generated: "Generated:",
    methodologyTitle: "Assessment Methodology",
    methodologyBody:
      "This report is based on passive, external-facing security analysis only. No intrusive testing or exploitation was performed during the scan.",
    disclaimerCover:
      "This report reflects external-facing security posture at scan time only. It does not constitute a penetration test, vulnerability assessment, or security certification.",
    disclaimerTrust:
      "This report reflects external-facing security posture at scan time only. It does not constitute a full penetration test, vulnerability assessment, or legal security certification. CyberGurdian AI performs passive, non-intrusive external analysis only.",
    scanToken: "Scan Token:",
    target: "Target:",
    version: "Version:",
    integrityTitle: "✓ Report Integrity",
    method: "Method: HMAC-SHA256",
    tokenLbl: "Token:",
    verifyAt: "Verify at:",
    qrNote: "Scan to verify this report",
    copyright: "CyberGurdian AI © 2026 · Engineered by Ali · V1.6",
    grade: "Grade:",
    score: "Score:",
    provider: "Provider:",
    tlsCdn: "TLS / CDN",
    exposure: "Exposure:",
    biz: "Business Impact:",
  };
}

function scoreRowBlock(locale: Locale, label: string, pct: number, note: string, fillColor: string) {
  const fillW = (contentWidth * pct) / 100;
  return (
    <View style={s.scoreRowGap}>
      <View style={s.rowBetween}>
        <Text style={withPdfFont(locale, { fontSize: 10, fontWeight: 700, color: palette.textPrimary })}>{label}</Text>
        <LtrText value={`${pct}%`} style={withPdfFont(locale, { fontSize: 10, fontWeight: 700, color: fillColor })} />
      </View>
      <View style={s.barTrack}>
        <View style={[s.barFill, { width: fillW, backgroundColor: fillColor }]} />
      </View>
      <Text style={withPdfFont(locale, { fontSize: 8, color: palette.textSecond, marginBottom: 6 })}>{note}</Text>
      <View style={{ height: 1, width: contentWidth, backgroundColor: palette.separator }} />
    </View>
  );
}

function planCardBlock(f: PdfPlanFinding, locale: Locale) {
  const title = locale === "ar" ? f.titleAr : f.titleEn;
  const desc = locale === "ar" ? f.descriptionAr : f.descriptionEn;
  const biz = locale === "ar" ? f.businessImpactAr : f.businessImpactEn;
  return (
    <View
      style={[
        s.planCard,
        {
          borderLeftColor: f.stripeColor,
        },
      ]}
    >
      <View style={s.rowBetween}>
        <View style={[s.pill, { backgroundColor: f.pillBg }]}>
          <Text style={withPdfFont(locale, s.pillText, { color: f.pillText })}>{f.severityLabel}</Text>
        </View>
        <LtrText value={f.effortLabel} style={withPdfFont(locale, { fontSize: 8, color: palette.textSecond })} />
      </View>
      <Text style={withPdfFont(locale, { fontSize: 10, fontWeight: 700, color: palette.textPrimary, marginTop: 8, marginBottom: 8 })}>
        {title}
      </Text>
      <Text style={withPdfFont(locale, { fontSize: 9, color: palette.textSecond, lineHeight: 1.35, marginBottom: 8 })}>{desc}</Text>
      <Text style={withPdfFont(locale, { fontSize: 9, color: palette.textMuted, marginBottom: 4 })}>
        {labels(locale).biz} {biz}
      </Text>
      <View style={s.codeBox}>
        <LtrText value={f.codeSnippet} style={s.codeText} />
      </View>
    </View>
  );
}

export function PdfDocument({
  data,
  locale,
  qrDataUrl = null,
}: {
  data: PdfReportData;
  locale: Locale;
  qrDataUrl?: string | null;
}) {
  const T = labels(locale);
  const total = data.pdfPageCount;
  const isAr = locale === "ar";
  const textAlignMain = isAr ? "right" : "left";
  const pageSurface = [s.page, { fontFamily: getPdfBodyFont(locale) }];

  const gradeLine = `${T.score} ${data.score}/${data.maxScore} · ${T.grade} ${data.grade}`;
  const visLine = `${T.visibility} ${isAr ? data.visibilityAr : data.visibilityEn}`;
  const tlsLine =
    data.infraTlsLine +
    " · CDN: " +
    (isAr ? data.infraCdnAr : data.infraCdnEn);
  const exposureLine = isAr ? data.exposureAr : data.exposureEn;

  const scoreRows = data.scoreRows;
  const attackLines = data.attackLines;
  const actionLines = data.actionLines;

  const pages: ReactElement[] = [];

  pages.push(
    <Page key="p1" size={[A4.width, A4.height]} style={pageSurface}>
      <View style={[s.accentBar, { backgroundColor: data.threatAccentColor }]} />
      <View style={s.bodyBottomPad}>
        <View style={s.rowBetween}>
          <View style={{ width: coverExecLeftW }}>
            <Text style={withPdfFont(locale, s.kicker, { textAlign: textAlignMain })}>{T.kicker}</Text>
            <Text style={withPdfFont(locale, s.brand, { textAlign: textAlignMain })}>CyberGurdian AI</Text>
          </View>
          <View style={{ width: coverExecRightW, alignItems: isAr ? "flex-start" : "flex-end" }}>
            <LtrText value={data.timestampUtc} style={withPdfFont(locale, { fontSize: 9, color: palette.textSecond })} />
            <Text style={withPdfFont(locale, { fontSize: 8, color: palette.textMuted, marginTop: 4 })}>V1.6</Text>
          </View>
        </View>
        <View style={s.sepFull} />
        <View style={{ flexDirection: "row" }}>
          <View style={{ width: coverExecLeftW, paddingRight: 12 }}>
            <Text
              style={withPdfFont(locale, {
                fontSize: 16,
                fontWeight: 700,
                color: palette.textPrimary,
                marginBottom: 6,
                textAlign: textAlignMain,
              })}
            >
              {data.domain}
            </Text>
            <LtrText value={data.finalUrl} style={withPdfFont(locale, { fontSize: 9, color: palette.textSecond })} />
          </View>
          <View style={{ width: coverExecRightW }}>
            <View style={[s.pill, { backgroundColor: data.threatPillBg }]}>
              <Text style={withPdfFont(locale, s.pillText, { color: data.threatPillText })}>{data.threatPillLabel}</Text>
            </View>
            <View style={{ flexDirection: "row", marginBottom: 4 }}>
              <Text style={withPdfFont(locale, { fontSize: 11, fontWeight: 700, color: palette.textPrimary })}>{T.grade} </Text>
              <LtrText value={data.grade} style={withPdfFont(locale, { fontSize: 11, fontWeight: 700, color: palette.textPrimary })} />
            </View>
            {isAr ? (
              <Text style={withPdfFont(locale, { fontSize: 11, color: palette.textPrimary, textAlign: textAlignMain })}>
                {`${T.score} ${data.score}/${data.maxScore}`}
              </Text>
            ) : (
              <LtrText
                value={`${T.score} ${data.score}/${data.maxScore}`}
                style={withPdfFont(locale, { fontSize: 11, color: palette.textPrimary })}
              />
            )}
            <Text style={withPdfFont(locale, { fontSize: 9, color: palette.textSecond, marginTop: 4, textAlign: textAlignMain })}>
              {visLine}
            </Text>
          </View>
        </View>
        <View style={s.sepFull} />
        <View style={{ marginBottom: 8 }}>
          <View style={s.rowBetween}>
            <Text style={withPdfFont(locale, s.metaLabel, { textAlign: textAlignMain })}>{T.scanId}</Text>
            <LtrText value={data.scanId} style={withPdfFont(locale, { fontSize: 9, color: palette.textPrimary })} />
          </View>
          <View style={[s.rowBetween, { marginTop: 6 }]}>
            <Text style={withPdfFont(locale, s.metaLabel, { textAlign: textAlignMain })}>{T.generated}</Text>
            <LtrText value={data.timestampUtc} style={withPdfFont(locale, { fontSize: 9, color: palette.textPrimary })} />
          </View>
        </View>
        <View style={s.methodologyBox}>
          <Text style={withPdfFont(locale, s.methodologyTitle, { textAlign: textAlignMain })}>{T.methodologyTitle}</Text>
          <Text style={withPdfFont(locale, s.methodologyBody, { textAlign: textAlignMain })}>{T.methodologyBody}</Text>
        </View>
        <View style={s.spacer} />
        <Text style={withPdfFont(locale, s.disclaimer, { textAlign: textAlignMain })}>{T.disclaimerCover}</Text>
      </View>
      <PdfPageFooter pageIndex={1} totalPages={total} locale={locale} />
    </Page>,
  );

  const scoreSubtitle = T.scoreSub;

  pages.push(
    <Page key="p2" size={[A4.width, A4.height]} style={pageSurface}>
      <View style={s.bodyBottomPad}>
        <Text style={withPdfFont(locale, { fontSize: 16, fontWeight: 700, color: palette.textPrimary, marginBottom: 6, textAlign: textAlignMain })}>
          {T.scoreTitle}
        </Text>
        <Text style={withPdfFont(locale, { fontSize: 9, color: palette.textSecond, marginBottom: 24, lineHeight: 1.4, textAlign: textAlignMain })}>
          {scoreSubtitle}
        </Text>
        {scoreRows.length === 0 ? (
          <Text style={withPdfFont(locale, { fontSize: 9, color: palette.textSecond })}>{T.noScores}</Text>
        ) : (
          scoreRows.map((row, i) => {
            const label = isAr ? row.labelAr : row.labelEn;
            const note = isAr ? row.noteAr : row.noteEn;
            const pct = row.score;
            const fill = barColorPct(pct);
            return <View key={`sr-${i}`}>{scoreRowBlock(locale, label, pct, note, fill)}</View>;
          })
        )}
      </View>
      <PdfPageFooter pageIndex={2} totalPages={total} locale={locale} />
    </Page>,
  );

  const summaryText = isAr ? data.overviewSummaryAr : data.overviewSummaryEn;
  const providerLabel = isAr ? data.infraProviderAr : data.infraProviderEn;

  pages.push(
    <Page key="p3" size={[A4.width, A4.height]} style={pageSurface}>
      <View style={s.bodyBottomPad}>
        <Text style={withPdfFont(locale, { fontSize: 16, fontWeight: 700, color: palette.textPrimary, marginBottom: 14, textAlign: textAlignMain })}>
          {T.assessmentTitle}
        </Text>
        <View style={{ flexDirection: "row", width: contentWidth }}>
          <View
            style={{
              width: halfCol,
              paddingRight: 12,
              borderRightWidth: 1,
              borderRightColor: palette.separator,
            }}
          >
            <Text style={withPdfFont(locale, s.sectionLabel, { textAlign: textAlignMain })}>{T.overview}</Text>
            <View style={[s.pill, { backgroundColor: data.threatPillBg }]}>
              <Text style={withPdfFont(locale, s.pillText, { color: data.threatPillText })}>{data.threatPillLabel}</Text>
            </View>
            {isAr ? (
              <Text style={withPdfFont(locale, { fontSize: 9, color: palette.textPrimary, marginBottom: 4, textAlign: textAlignMain })}>
                {gradeLine}
              </Text>
            ) : (
              <LtrText value={gradeLine} style={withPdfFont(locale, { fontSize: 9, color: palette.textPrimary, marginBottom: 4 })} />
            )}
            <Text style={withPdfFont(locale, { fontSize: 9, color: palette.textPrimary, marginBottom: 8, textAlign: textAlignMain })}>{visLine}</Text>
            <Text style={withPdfFont(locale, { fontSize: 9, color: palette.textSecond, lineHeight: 1.45, marginBottom: 20, textAlign: textAlignMain })}>
              {summaryText}
            </Text>
            <Text style={withPdfFont(locale, s.sectionLabel, { textAlign: textAlignMain })}>{T.infra}</Text>
            <Text style={withPdfFont(locale, { fontSize: 9, color: palette.textPrimary, marginBottom: 4, textAlign: textAlignMain })}>
              {T.provider} {providerLabel}
            </Text>
            <LtrText value={tlsLine} style={withPdfFont(locale, { fontSize: 9, color: palette.textPrimary, marginBottom: 4 })} />
            <Text style={withPdfFont(locale, { fontSize: 9, color: data.exposureColor, textAlign: textAlignMain })}>{exposureLine}</Text>
          </View>
          <View style={{ width: contentWidth - halfCol - 1, paddingLeft: 12 }}>
            <Text style={withPdfFont(locale, s.sectionLabel, { textAlign: textAlignMain })}>{T.attack}</Text>
            {attackLines.map((line, i) => (
              <View key={`atk-${i}`} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: line.dotColor,
                    marginRight: 8,
                  }}
                />
                <Text style={withPdfFont(locale, { fontSize: 9, color: palette.textPrimary, textAlign: textAlignMain })}>
                  {isAr ? line.lineAr : line.lineEn}
                </Text>
              </View>
            ))}
            <Text style={withPdfFont(locale, s.sectionLabel, { textAlign: textAlignMain, marginTop: 12 })}>{T.actions}</Text>
            {actionLines.map((a, i) => (
              <Text key={`act-${i}`} style={withPdfFont(locale, { fontSize: 9, color: palette.textPrimary, marginBottom: 6, textAlign: textAlignMain })}>
                {isAr ? a.lineAr : a.lineEn}
              </Text>
            ))}
          </View>
        </View>

        {data.compactPlanOnPage3 ? (
          <View style={{ marginTop: 20 }}>
            <View style={{ height: 1, width: contentWidth, backgroundColor: palette.separator, marginBottom: 12 }} />
            <Text style={withPdfFont(locale, { fontSize: 11, fontWeight: 700, color: palette.textPrimary, marginBottom: 10, textAlign: textAlignMain })}>
              {T.planCompact}
            </Text>
            {data.compactPlanRows.map((row, i) => {
              const title = isAr ? row.titleAr : row.titleEn;
              return (
                <View
                  key={`cpr-${i}`}
                  style={{
                    flexDirection: "row",
                    borderLeftWidth: 3,
                    borderLeftColor: row.stripeColor,
                    paddingLeft: 8,
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexGrow: 1 }}>
                    <Text style={withPdfFont(locale, { fontSize: 8, fontWeight: 700, color: palette.textSecond, marginBottom: 2 })}>
                      {row.severityLabel} {title}
                    </Text>
                    <LtrText value={row.codeSnippet} style={{ fontSize: 7, fontFamily: "Courier", color: palette.textPrimary }} />
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
      <PdfPageFooter pageIndex={3} totalPages={total} locale={locale} />
    </Page>,
  );

  if (!data.compactPlanOnPage3) {
    const chunks = data.planChunks;
    for (let pi = 0; pi < chunks.length; pi += 1) {
      const cards = chunks[pi];
      const subEn = data.planPageSubtitlesEn[pi] ?? "";
      const subAr = data.planPageSubtitlesAr[pi] ?? "";
      const sub = isAr ? subAr : subEn;
      const left = cards[0];
      const right = cards[1];
      pages.push(
        <Page key={`plan-${pi}`} size={[A4.width, A4.height]} style={pageSurface}>
          <View style={s.bodyBottomPad}>
            <Text style={withPdfFont(locale, { fontSize: 16, fontWeight: 700, color: palette.textPrimary, marginBottom: 4, textAlign: textAlignMain })}>
              {T.planTitle}
            </Text>
            <Text style={withPdfFont(locale, { fontSize: 9, color: palette.textSecond, marginBottom: 16, textAlign: textAlignMain })}>{sub}</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {left ? planCardBlock(left, locale) : <View style={{ width: planCardW }} />}
              {right ? planCardBlock(right, locale) : <View style={{ width: planCardW }} />}
            </View>
            {cards.length > 2 ? (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
                {cards[2] ? planCardBlock(cards[2], locale) : <View style={{ width: planCardW }} />}
                {cards[3] ? planCardBlock(cards[3], locale) : <View style={{ width: planCardW }} />}
              </View>
            ) : null}
            {cards.length > 4 ? (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
                {cards[4] ? planCardBlock(cards[4], locale) : <View style={{ width: planCardW }} />}
                {cards[5] ? planCardBlock(cards[5], locale) : <View style={{ width: planCardW }} />}
              </View>
            ) : null}
          </View>
          <PdfPageFooter pageIndex={4 + pi} totalPages={total} locale={locale} />
        </Page>,
      );
    }
  }

  const trustPageIndex = total;

  pages.push(
    <Page key="trust" size={[A4.width, A4.height]} style={pageSurface}>
      <View style={s.bodyBottomPad}>
        <Text style={withPdfFont(locale, { fontSize: 16, fontWeight: 700, color: palette.textPrimary, marginBottom: 14, textAlign: textAlignMain })}>
          {T.trustTitle}
        </Text>
        <View style={s.rowBetween}>
          <View style={{ width: Math.floor(contentWidth * 0.48) }}>
            <View style={[s.rowBetween, { marginBottom: 6 }]}>
              <Text style={withPdfFont(locale, { fontSize: 8, color: palette.textMuted })}>{T.scanToken}</Text>
              <LtrText value={data.tokenDisplay} style={withPdfFont(locale, { fontSize: 9, color: palette.textPrimary })} />
            </View>
            <View style={[s.rowBetween, { marginBottom: 6 }]}>
              <Text style={withPdfFont(locale, { fontSize: 8, color: palette.textMuted })}>{T.target}</Text>
              <LtrText value={data.finalUrl} style={withPdfFont(locale, { fontSize: 9, color: palette.textPrimary })} />
            </View>
            <View style={[s.rowBetween, { marginBottom: 6 }]}>
              <Text style={withPdfFont(locale, { fontSize: 8, color: palette.textMuted })}>{T.generated}</Text>
              <LtrText value={data.timestampUtc} style={withPdfFont(locale, { fontSize: 9, color: palette.textPrimary })} />
            </View>
            <View style={s.rowBetween}>
              <Text style={withPdfFont(locale, { fontSize: 8, color: palette.textMuted })}>{T.version}</Text>
              <Text style={withPdfFont(locale, { fontSize: 9, color: palette.textPrimary })}>CyberGurdian AI V1.6</Text>
            </View>
          </View>
          <View style={s.integrityBox}>
            <Text style={withPdfFont(locale, { fontSize: 10, fontWeight: 700, color: palette.textPrimary, marginBottom: 6, textAlign: textAlignMain })}>
              {T.integrityTitle}
            </Text>
            <Text style={withPdfFont(locale, { fontSize: 9, color: palette.textSecond, marginBottom: 6, textAlign: textAlignMain })}>{T.method}</Text>
            <Text style={withPdfFont(locale, { fontSize: 8, color: palette.textMuted, marginBottom: 4, textAlign: textAlignMain })}>{T.tokenLbl}</Text>
            <LtrText value={data.hmacDisplay} style={withPdfFont(locale, { fontSize: 8, fontFamily: "Courier", color: palette.textPrimary })} />
            <View style={{ height: 10 }} />
            <Text style={withPdfFont(locale, { fontSize: 8, color: palette.textMuted, marginBottom: 4, textAlign: textAlignMain })}>{T.verifyAt}</Text>
            <LtrText value={data.verifyDisplayLine1} style={withPdfFont(locale, { fontSize: 8, color: palette.green })} />
            <LtrText value={data.verifyDisplayLine2} style={withPdfFont(locale, { fontSize: 8, color: palette.green })} />
          </View>
        </View>
        <View style={{ alignItems: "center", marginTop: 20, marginBottom: 16 }}>
          <View style={s.qrBox}>
            {qrDataUrl !== null && qrDataUrl !== "" ? (
              <>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image has no alt; decorative QR */}
                <Image src={qrDataUrl} style={{ width: 64, height: 64 }} />
              </>
            ) : null}
          </View>
          <Text style={withPdfFont(locale, { fontSize: 7, color: palette.textMuted, marginTop: 4 })}>{T.qrNote}</Text>
        </View>
        <Text style={withPdfFont(locale, { fontSize: 8, color: palette.textMuted, lineHeight: 1.45, marginBottom: 12, textAlign: textAlignMain })}>
          {T.disclaimerTrust}
        </Text>
        <Text style={withPdfFont(locale, { fontSize: 8, color: palette.textMuted, textAlign: "center" })}>{T.copyright}</Text>
      </View>
      <PdfPageFooter pageIndex={trustPageIndex} totalPages={total} locale={locale} />
    </Page>,
  );

  return <Document>{pages}</Document>;
}
