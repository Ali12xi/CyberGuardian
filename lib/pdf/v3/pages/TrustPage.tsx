import { Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LtrText } from "@/lib/pdf/phaseA/LtrText";
import { bf, FixedPageFooterV3, InfoCardV3, SectionTitleV3, footerReservePt, type LocaleV3 } from "@/lib/pdf/v3/components";
import { A4_H, A4_W, CONTENT_W, MARGIN, dark, typo } from "@/lib/pdf/v3/constants";
import type { PdfReportDataV3 } from "@/lib/pdf/v3/mapV3";

const gap = 8;
const col2 = Math.floor((CONTENT_W - gap) / 2);

const s = StyleSheet.create({
  page: {
    width: A4_W,
    height: A4_H,
    backgroundColor: dark.pageBg,
    padding: MARGIN,
    paddingBottom: MARGIN + footerReservePt(),
    color: dark.textPrimary,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  card: {
    backgroundColor: dark.cardBg,
    borderWidth: 1,
    borderColor: dark.cardBorder,
    borderRadius: 8,
    padding: 12,
  },
  integrityTitle: { fontSize: 10, fontWeight: 700, color: dark.green, marginBottom: 6 },
  disclaimer: { fontSize: 8, color: dark.textMuted, lineHeight: 1.35, marginTop: 12 },
  copyright: { fontSize: 8, color: dark.textMuted, textAlign: "center", marginTop: 6 },
});

function t(locale: LocaleV3, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

export function TrustPageV3({
  data,
  locale,
  qrDataUrl,
}: {
  data: PdfReportDataV3;
  locale: LocaleV3;
  qrDataUrl: string | null;
}) {
  const b = data.base;
  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap={false}>
      <SectionTitleV3
        title={t(locale, "Report Integrity & Verification", "سلامة التقرير والتحقق")}
        locale={locale}
      />
      <View style={s.rowBetween}>
        <View style={{ width: col2 }}>
          <InfoCardV3 label="SCAN TOKEN" value={b.tokenDisplay} locale={locale} width={col2} />
          <View style={{ height: gap }} />
          <InfoCardV3 label="TARGET" value={b.finalUrl} locale={locale} width={col2} />
          <View style={{ height: gap }} />
          <InfoCardV3 label="GENERATED" value={b.timestampUtc} locale={locale} width={col2} />
          <View style={{ height: gap }} />
          <InfoCardV3 label="VERSION" value="V1.6" locale={locale} width={col2} />
        </View>
        <View style={[s.card, { width: col2 }]}>
          <Text style={[s.integrityTitle, bf(locale)]}>Report integrity</Text>
          <Text style={[{ fontSize: typo.body, color: dark.textSecondary }, bf(locale)]}>Method: HMAC-SHA256</Text>
          <Text style={[{ fontSize: typo.meta, color: dark.textSecondary, marginTop: 4 }, bf(locale)]}>Token</Text>
          <LtrText value={b.hmacDisplay} style={[{ fontSize: 8, color: dark.accentCyan }, bf(locale)]} />
          <Text style={[{ fontSize: typo.meta, color: dark.textSecondary, marginTop: 6 }, bf(locale)]}>Verify at</Text>
          <LtrText value={b.verifyDisplayLine1} style={[{ fontSize: 8, color: dark.accentCyan }, bf(locale)]} />
          <LtrText value={b.verifyDisplayLine2} style={[{ fontSize: 8, color: dark.accentCyan }, bf(locale)]} />
        </View>
      </View>

      <View style={{ alignItems: "center", marginTop: 16 }}>
        {qrDataUrl !== null ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image
          <Image src={qrDataUrl} style={{ width: 64, height: 64 }} />
        ) : null}
        <Text style={[{ fontSize: 7, color: dark.metaText, marginTop: 6 }, bf(locale)]}>
          {t(locale, "Scan to verify this report", "امسح للتحقق من هذا التقرير")}
        </Text>
      </View>

      <Text style={[s.disclaimer, bf(locale)]}>
        {t(
          locale,
          "External observation only. Not a penetration test or legal advice.",
          "ملاحظة خارجية فقط. ليس اختبار اختراق ولا استشارة قانونية.",
        )}
      </Text>
      <Text style={[s.copyright, bf(locale)]}>CyberGurdian AI © 2026 · Engineered by Ali · V1.6</Text>

      <FixedPageFooterV3 locale={locale} />
    </Page>
  );
}
