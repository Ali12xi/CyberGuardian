import { Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { bf, FixedPageFooterV5, LtrText, LocaleText, footerReservePt, type LocaleV5 } from "@/lib/pdf/v5/components";
import { A4_H, A4_W, colors, CONTENT_W, MARGIN, typo } from "@/lib/pdf/v5/constants";
import type { PdfReportDataV5 } from "@/lib/pdf/v5/mapV5";

const padB = MARGIN + footerReservePt();
const gap = 10;
const cellW = Math.floor((CONTENT_W - gap) / 2);

const s = StyleSheet.create({
  page: { width: A4_W, height: A4_H, backgroundColor: colors.pageBg },
  inner: { padding: MARGIN, paddingBottom: padB },
  h1: { fontSize: typo.section, fontWeight: 700, color: colors.white, marginBottom: 6 },
  lead: { fontSize: typo.body, color: colors.muted, lineHeight: 1.45, marginBottom: 18, maxWidth: CONTENT_W },
  notice: {
    padding: 14,
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.clean,
    marginBottom: 18,
  },
  nTitle: { fontSize: typo.bodyLg, fontWeight: 700, color: colors.clean, marginBottom: 6 },
  nBody: { fontSize: typo.body, color: colors.body, lineHeight: 1.4 },
  gridRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: gap },
  cell: {
    width: cellW,
    padding: 10,
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lab: { fontSize: typo.meta, color: colors.muted, marginBottom: 4 },
  disc: { fontSize: typo.meta, color: colors.muted, lineHeight: 1.35, marginTop: 12 },
  copy: { fontSize: typo.meta, color: colors.muted, textAlign: "center", marginTop: 6 },
});

function t(locale: LocaleV5, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

export function TrustPageV5({ data }: { data: PdfReportDataV5 }) {
  const { locale, base } = data;
  const ta = locale === "ar" ? { textAlign: "right" as const } : {};
  const lead = locale === "ar" ? data.sectionIntros.trustAr : data.sectionIntros.trust;
  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap>
      <View style={s.inner}>
        <Text style={[s.h1, bf(locale)]}>{t(locale, "Trust & verification", "الثقة والتحقق")}</Text>
        <LocaleText locale={locale} style={[s.lead, bf(locale)]} wrap>
          {lead}
        </LocaleText>

        <View style={s.notice}>
          <Text style={[s.nTitle, bf(locale)]}>{t(locale, "Verification notice", "إشعار التحقق")}</Text>
          <Text style={[s.nBody, bf(locale), ta]} wrap>
            {t(
              locale,
              "Use the token and URL below to confirm this report was issued by our systems.",
              "استخدم الرمز والرابط أدناه للتأكد من أن التقرير صادر عن أنظمتنا.",
            )}
          </Text>
        </View>

        <View style={s.gridRow}>
          <View style={s.cell}>
            <Text style={[s.lab, bf(locale)]}>{t(locale, "Target", "الهدف")}</Text>
            <LtrText value={base.url} style={[{ fontSize: typo.body, color: colors.white }, bf(locale)]} />
          </View>
          <View style={s.cell}>
            <Text style={[s.lab, bf(locale)]}>{t(locale, "Generated", "تاريخ الإنشاء")}</Text>
            <LtrText value={base.timestamp} style={[{ fontSize: typo.body, color: colors.white }, bf(locale)]} />
          </View>
        </View>
        <View style={s.gridRow}>
          <View style={s.cell}>
            <Text style={[s.lab, bf(locale)]}>{t(locale, "Scan ID", "معرف الفحص")}</Text>
            <LtrText value={base.scanId} style={[{ fontSize: typo.body, color: colors.white }, bf(locale)]} />
          </View>
          <View style={s.cell}>
            <Text style={[s.lab, bf(locale)]}>{t(locale, "Version", "الإصدار")}</Text>
            <LtrText value={base.version} style={[{ fontSize: typo.body, color: colors.white }, bf(locale)]} />
          </View>
        </View>

        <Text style={[s.lab, bf(locale)]}>HMAC</Text>
        <LtrText value={data.hmacToken} style={[{ fontSize: 8, color: colors.brandCyan }, bf(locale)]} />

        <View style={{ alignItems: "center", marginTop: 14 }}>
          {data.qrDataUrl !== "" ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image
            <Image src={data.qrDataUrl} style={{ width: 72, height: 72 }} />
          ) : null}
        </View>

        <Text style={[s.disc, bf(locale), ta]} wrap>
          {t(
            locale,
            "External observation only. Not a penetration test or legal advice.",
            "ملاحظة خارجية فقط. ليس اختبار اختراق ولا استشارة قانونية.",
          )}
        </Text>
        <Text style={[s.copy, bf(locale)]}>CyberGurdian AI © 2026 · V1.6</Text>
      </View>
      <FixedPageFooterV5 locale={locale} />
    </Page>
  );
}
