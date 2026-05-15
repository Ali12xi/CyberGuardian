import { Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LtrText } from "@/lib/pdf/phaseA/LtrText";
import { bf, FixedPageFooterV4, SectionTitleV4, footerReservePt, type LocaleV4 } from "@/lib/pdf/v4/components";
import { A4_H, A4_W, CONTENT_W, MARGIN, dark, typo } from "@/lib/pdf/v4/constants";
import type { PdfReportDataV4 } from "@/lib/pdf/v4/mapV4";

const gap = 10;
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
  notice: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: dark.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: dark.green,
  },
  noticeTitle: { fontSize: typo.bodyLarge, fontWeight: 700, color: dark.green, marginBottom: 6 },
  noticeBody: { fontSize: typo.body, color: dark.textSecondary, lineHeight: 1.45 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  card: {
    backgroundColor: dark.cardBg,
    borderWidth: 1,
    borderColor: dark.cardBorder,
    borderRadius: 8,
    padding: 12,
  },
  lab: { fontSize: typo.cardLabel, color: dark.textMuted, marginBottom: 4 },
  val: { fontSize: typo.body, fontWeight: 700, color: dark.textPrimary },
  disclaimer: { fontSize: typo.meta, color: dark.textMuted, lineHeight: 1.35, marginTop: 12 },
  copyright: { fontSize: typo.meta, color: dark.textMuted, textAlign: "center", marginTop: 6 },
});

function t(locale: LocaleV4, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

export function TrustPageV4({
  data,
  locale,
  qrDataUrl,
}: {
  data: PdfReportDataV4;
  locale: LocaleV4;
  qrDataUrl: string | null;
}) {
  const b = data.base;
  const ta = locale === "ar" ? { textAlign: "right" as const } : {};
  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap={false}>
      <SectionTitleV4 title={t(locale, "Trust & verification", "الثقة والتحقق")} locale={locale} />

      <View style={s.notice}>
        <Text style={[s.noticeTitle, bf(locale)]}>{t(locale, "Verification notice", "إشعار التحقق")}</Text>
        <Text style={[s.noticeBody, bf(locale), ta]} wrap>
          {t(
            locale,
            "This report can be independently verified using the embedded cryptographic proof and scan token. Share the verification link with auditors or customers when assurance is required.",
            "يمكن التحقق من هذا التقرير بشكل مستقل باستخدام الدليل التشفيري المضمّن ورمز الفحص. شارك رابط التحقق مع المدققين أو العملاء عند الحاجة إلى ضمان إضافي.",
          )}
        </Text>
      </View>

      <View style={s.rowBetween}>
        <View style={{ width: col2 }}>
          <View style={s.card}>
            <Text style={[s.lab, bf(locale)]}>{t(locale, "Scan token", "رمز الفحص")}</Text>
            <LtrText value={b.tokenDisplay} style={[s.val, bf(locale)]} />
          </View>
          <View style={{ height: gap }} />
          <View style={s.card}>
            <Text style={[s.lab, bf(locale)]}>{t(locale, "Target", "الهدف")}</Text>
            <LtrText value={b.finalUrl} style={[s.val, bf(locale)]} />
          </View>
          <View style={{ height: gap }} />
          <View style={s.card}>
            <Text style={[s.lab, bf(locale)]}>{t(locale, "Generated", "تاريخ الإنشاء")}</Text>
            <LtrText value={b.timestampUtc} style={[s.val, bf(locale)]} />
          </View>
          <View style={{ height: gap }} />
          <View style={s.card}>
            <Text style={[s.lab, bf(locale)]}>{t(locale, "Version", "الإصدار")}</Text>
            <LtrText value="V1.6" style={[s.val, bf(locale)]} />
          </View>
        </View>
        <View style={[s.card, { width: col2 }]}>
          <Text style={[{ fontSize: typo.bodyLarge, fontWeight: 700, color: dark.green }, bf(locale)]}>
            {t(locale, "Proof of scan", "دليل الفحص")}
          </Text>
          <Text style={[{ fontSize: typo.body, color: dark.textSecondary, marginTop: 4 }, bf(locale)]}>
            {t(locale, "Method: HMAC-SHA256", "الطريقة: HMAC-SHA256")}
          </Text>
          <Text style={[{ fontSize: typo.meta, color: dark.textSecondary, marginTop: 6 }, bf(locale)]}>
            {t(locale, "Integrity token", "رمز السلامة")}
          </Text>
          <LtrText value={b.hmacDisplay} style={[{ fontSize: 8, color: dark.accentCyan }, bf(locale)]} />
          <Text style={[{ fontSize: typo.meta, color: dark.textSecondary, marginTop: 6 }, bf(locale)]}>
            {t(locale, "Verify at", "تحقق عبر")}
          </Text>
          <LtrText value={b.verifyDisplayLine1} style={[{ fontSize: 8, color: dark.accentCyan }, bf(locale)]} />
          <LtrText value={b.verifyDisplayLine2} style={[{ fontSize: 8, color: dark.accentCyan }, bf(locale)]} />
        </View>
      </View>

      <View style={{ alignItems: "center", marginTop: 14 }}>
        {qrDataUrl !== null ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image
          <Image src={qrDataUrl} style={{ width: 72, height: 72 }} />
        ) : null}
        <Text style={[{ fontSize: typo.micro, color: dark.metaText, marginTop: 6 }, bf(locale)]}>
          {t(locale, "Scan to verify this report", "امسح للتحقق من هذا التقرير")}
        </Text>
      </View>

      <Text style={[s.disclaimer, bf(locale), ta]} wrap>
        {t(
          locale,
          "External observation only. Not a penetration test or legal advice.",
          "ملاحظة خارجية فقط. ليس اختبار اختراق ولا استشارة قانونية.",
        )}
      </Text>
      <Text style={[s.copyright, bf(locale)]}>CyberGurdian AI © 2026 · Engineered by Ali · V1.6</Text>

      <FixedPageFooterV4 locale={locale} />
    </Page>
  );
}
