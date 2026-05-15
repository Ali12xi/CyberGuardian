import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { bf, FixedPageFooterV5, LtrText, LocaleText, footerReservePt, type LocaleV5 } from "@/lib/pdf/v5/components";
import { A4_H, A4_W, colors, CONTENT_W, MARGIN, typo } from "@/lib/pdf/v5/constants";
import type { PdfReportDataV5 } from "@/lib/pdf/v5/mapV5";

const padB = MARGIN + footerReservePt();
const gap = 10;
const half = Math.floor((CONTENT_W - gap) / 2);

const s = StyleSheet.create({
  page: { width: A4_W, height: A4_H, backgroundColor: colors.pageBg },
  inner: { padding: MARGIN, paddingBottom: padB },
  h1: { fontSize: typo.section, fontWeight: 700, color: colors.white, marginBottom: 6 },
  lead: { fontSize: typo.body, color: colors.muted, lineHeight: 1.45, marginBottom: 22, maxWidth: CONTENT_W },
  cell: {
    width: half,
    marginBottom: gap,
    padding: 10,
    backgroundColor: colors.cardBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cellLab: { fontSize: typo.meta, color: colors.muted, marginBottom: 3 },
  hdrList: { fontSize: typo.body, marginTop: 4, lineHeight: 1.4 },
  secTitle: { fontSize: typo.bodyLg, fontWeight: 700, color: colors.white, marginTop: 18, marginBottom: 10 },
  hdrSub: { fontSize: typo.meta, fontWeight: 700, marginBottom: 4 },
});

function t(locale: LocaleV5, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

export function TechnicalPageV5({ data }: { data: PdfReportDataV5 }) {
  const { locale } = data;
  const presentStr = data.headers.present.join(", ") || "-";
  const missingStr = data.headers.missing.join(", ") || "-";
  const lead = locale === "ar" ? data.sectionIntros.technicalAr : data.sectionIntros.technical;

  const infraPairs: { k: string; en: string; ar: string; v: string }[] = [
    { k: "p", en: "Provider", ar: "المزود", v: data.infrastructure.provider },
    { k: "c", en: "CDN", ar: "CDN", v: data.infrastructure.cdn },
    { k: "w", en: "WAF", ar: "WAF", v: data.infrastructure.waf },
    { k: "a", en: "ASN", ar: "ASN", v: data.infrastructure.asn },
    { k: "s", en: "Server header", ar: "رأس الخادم", v: data.infrastructure.server },
    { k: "cl", en: "Cloud", ar: "سحابي", v: data.infrastructure.cloudProvider },
  ];

  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap>
      <View style={s.inner}>
        <Text style={[s.h1, bf(locale)]}>{t(locale, "Technical evidence", "الأدلة التقنية")}</Text>
        <LocaleText locale={locale} style={[s.lead, bf(locale)]} wrap>
          {lead}
        </LocaleText>

        <Text style={[{ ...s.secTitle, marginTop: 4 }, bf(locale)]}>{t(locale, "TLS", "TLS")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <View style={[s.cell, { marginRight: gap }]}>
            <Text style={[s.cellLab, bf(locale)]}>{t(locale, "Version", "الإصدار")}</Text>
            <LtrText value={data.tls.version} style={[{ fontSize: typo.body, color: colors.body }, bf(locale)]} />
          </View>
          <View style={s.cell}>
            <Text style={[s.cellLab, bf(locale)]}>{t(locale, "Cipher", "الخوارزمية")}</Text>
            <LtrText value={data.tls.cipher} style={[{ fontSize: typo.body, color: colors.body }, bf(locale)]} />
          </View>
          <View style={[s.cell, { marginRight: gap }]}>
            <Text style={[s.cellLab, bf(locale)]}>{t(locale, "Issuer", "المصدر")}</Text>
            <LtrText value={data.tls.issuer} style={[{ fontSize: typo.body, color: colors.body }, bf(locale)]} />
          </View>
          <View style={s.cell}>
            <Text style={[s.cellLab, bf(locale)]}>{t(locale, "Days remaining", "الأيام المتبقية")}</Text>
            <LtrText value={String(data.tls.daysLeft)} style={[{ fontSize: typo.body, color: colors.body }, bf(locale)]} />
          </View>
        </View>

        <Text style={[s.secTitle, bf(locale)]}>{t(locale, "Security headers", "رؤوس الأمان")}</Text>
        <Text style={[{ ...s.hdrSub, color: colors.clean }, bf(locale)]}>{t(locale, "Present", "موجودة")}</Text>
        <LtrText value={presentStr} style={[s.hdrList, { color: colors.body }, bf(locale)]} />
        <Text style={[{ ...s.hdrSub, color: colors.critical, marginTop: 8 }, bf(locale)]}>
          {t(locale, "Missing", "ناقصة")}
        </Text>
        <LtrText value={missingStr} style={[s.hdrList, { color: colors.body }, bf(locale)]} />

        <Text style={[s.secTitle, bf(locale)]}>{t(locale, "Infrastructure", "البنية التحتية")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {infraPairs.map((row, i) => (
            <View key={row.k} style={[s.cell, { marginRight: i % 2 === 0 ? gap : 0 }]}>
              <Text style={[s.cellLab, bf(locale)]}>{locale === "ar" ? row.ar : row.en}</Text>
              <LtrText value={row.v} style={[{ fontSize: typo.body, color: colors.body }, bf(locale)]} />
            </View>
          ))}
        </View>
      </View>
      <FixedPageFooterV5 locale={locale} />
    </Page>
  );
}
