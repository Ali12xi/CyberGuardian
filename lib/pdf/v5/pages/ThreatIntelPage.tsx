import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { bf, FixedPageFooterV5, LtrText, LocaleText, footerReservePt, type LocaleV5 } from "@/lib/pdf/v5/components";
import { A4_H, A4_W, colors, CONTENT_W, MARGIN, typo } from "@/lib/pdf/v5/constants";
import type { PdfReportDataV5 } from "@/lib/pdf/v5/mapV5";

const padB = MARGIN + footerReservePt();
const gap = 8;
const col = Math.floor((CONTENT_W - gap) / 2);

const s = StyleSheet.create({
  page: { width: A4_W, height: A4_H, backgroundColor: colors.pageBg },
  inner: { padding: MARGIN, paddingBottom: padB },
  h1: { fontSize: typo.section, fontWeight: 700, color: colors.white, marginBottom: 6 },
  lead: { fontSize: typo.body, color: colors.muted, lineHeight: 1.45, marginBottom: 16, maxWidth: CONTENT_W },
  banner: {
    padding: 14,
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  banTxt: { fontSize: typo.body, color: colors.body, lineHeight: 1.45 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: gap },
  cell: {
    width: col,
    padding: 8,
    backgroundColor: colors.cardBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lab: { fontSize: typo.meta, color: colors.muted, marginBottom: 2 },
});

function t(locale: LocaleV5, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

function intelGridValue(locale: LocaleV5, rowKey: string, raw: string): string {
  if (locale !== "ar") {
    return raw;
  }
  const k = raw.trim().toLowerCase();
  if (rowKey === "r") {
    const arReputationLabels: Record<string, string> = {
      trusted: "\u0645\u0648\u062b\u0648\u0642",
      suspicious: "\u0645\u0634\u0628\u0648\u0647",
      malicious: "\u062e\u0628\u064a\u062b",
      neutral: "\u0645\u062d\u0627\u064a\u062f",
    };
    return arReputationLabels[k] ?? raw;
  }
  if (rowKey === "v") {
    const arVerdictLabels: Record<string, string> = {
      clean: "\u0646\u0638\u064a\u0641",
      malicious: "\u062e\u0628\u064a\u062b",
      suspicious: "\u0645\u0634\u0628\u0648\u0647",
      neutral: "\u0645\u062d\u0627\u064a\u062f",
    };
    return arVerdictLabels[k] ?? raw;
  }
  if (rowKey === "p") {
    const arPhishingLabels: Record<string, string> = {
      no: "\u0644\u0627",
      yes: "\u0646\u0639\u0645",
    };
    return arPhishingLabels[k] ?? raw;
  }
  return raw;
}

function intelValueUsesLocaleText(locale: LocaleV5, rowKey: string): boolean {
  return locale === "ar" && (rowKey === "r" || rowKey === "v" || rowKey === "p");
}

function verdictSentence(data: PdfReportDataV5): string {
  const { locale, intel, base } = data;
  const total = intel.total > 0 ? intel.total : 92;
  const flagged = data.enginesFlagged;
  if (intel.verdict === "clean" || flagged === 0) {
    return locale === "ar"
      ? `${base.domain} نظيف — ${flagged}/${total} محركات بلا إشارة خبيثة.`
      : `${base.domain} is clean (${flagged}/${total} engines, no malicious signals).`;
  }
  return locale === "ar"
    ? `${base.domain}: ${flagged}/${total} إشارات خارج نطاق السمعة النظيفة.`
    : `${base.domain}: ${flagged}/${total} vendor signals outside a clean band.`;
}

/** Vendor / domain intelligence only — TLS & infra live on the Technical page. */
const INTEL_ROWS: { key: string; en: string; ar: string; pick: (d: PdfReportDataV5) => string }[] = [
  { key: "d", en: "Domain", ar: "النطاق", pick: (d) => d.base.domain },
  { key: "r", en: "Reputation", ar: "السمعة", pick: (d) => d.intel.reputation },
  { key: "v", en: "Verdict", ar: "الحكم", pick: (d) => d.intel.verdict },
  { key: "m", en: "Malicious", ar: "خبيث", pick: (d) => String(d.intel.malicious) },
  { key: "p", en: "Phishing indicators", ar: "تصيد", pick: (d) => (d.intel.phishingKeywords ? "yes" : "no") },
  { key: "e", en: "Entropy", ar: "الانتروبيا", pick: (d) => d.intel.entropy.toFixed(2) },
];

export function ThreatIntelPageV5({ data }: { data: PdfReportDataV5 }) {
  const { locale } = data;
  const ta = locale === "ar" ? { textAlign: "right" as const } : {};
  const lead = locale === "ar" ? data.sectionIntros.intelAr : data.sectionIntros.intel;
  const pairs: { a: (typeof INTEL_ROWS)[0]; b?: (typeof INTEL_ROWS)[0] }[] = [];
  for (let i = 0; i < INTEL_ROWS.length; i += 2) {
    pairs.push({ a: INTEL_ROWS[i], b: INTEL_ROWS[i + 1] });
  }
  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap>
      <View style={s.inner}>
        <Text style={[s.h1, bf(locale)]}>{t(locale, "External intelligence", "الذكاء الخارجي")}</Text>
        <LocaleText locale={locale} style={[s.lead, bf(locale)]} wrap>
          {lead}
        </LocaleText>
        <View style={s.banner}>
          <Text style={[s.banTxt, bf(locale), ta]} wrap>
            {verdictSentence(data)}
          </Text>
        </View>
        {pairs.map((pair, i) => {
          const renderValue = (row: (typeof INTEL_ROWS)[0]) => {
            const raw = row.pick(data);
            const display = intelGridValue(locale, row.key, raw);
            const valueStyle = [{ fontSize: typo.body, color: colors.body }, bf(locale)];
            if (intelValueUsesLocaleText(locale, row.key)) {
              return (
                <LocaleText locale={locale} style={valueStyle} wrap={false}>
                  {display}
                </LocaleText>
              );
            }
            return <LtrText value={display} style={valueStyle} />;
          };
          return (
            <View key={i} style={s.row}>
              <View style={s.cell}>
                <Text style={[s.lab, bf(locale)]}>{locale === "ar" ? pair.a.ar : pair.a.en}</Text>
                {renderValue(pair.a)}
              </View>
              {pair.b !== undefined ? (
                <View style={s.cell}>
                  <Text style={[s.lab, bf(locale)]}>{locale === "ar" ? pair.b.ar : pair.b.en}</Text>
                  {renderValue(pair.b)}
                </View>
              ) : (
                <View style={{ width: col }} />
              )}
            </View>
          );
        })}
      </View>
      <FixedPageFooterV5 locale={locale} />
    </Page>
  );
}
