import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { bf, FixedPageFooterV4, SectionTitleV4, SeverityBadgeV4, footerReservePt, type LocaleV4 } from "@/lib/pdf/v4/components";
import { A4_H, A4_W, CONTENT_W, MARGIN, dark, typo } from "@/lib/pdf/v4/constants";
import type { PdfReportDataV4, PdfV4TopRisk } from "@/lib/pdf/v4/mapV4";

const s = StyleSheet.create({
  page: {
    width: A4_W,
    height: A4_H,
    backgroundColor: dark.pageBg,
    padding: MARGIN,
    paddingBottom: MARGIN + footerReservePt(),
    color: dark.textPrimary,
  },
  card: {
    backgroundColor: dark.cardBg,
    borderWidth: 1,
    borderColor: dark.cardBorder,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  title: { fontSize: typo.riskTitle, fontWeight: 700, color: dark.textPrimary, marginTop: 6, flex: 1 },
  rowHead: { flexDirection: "row", alignItems: "flex-start" },
  micro: { fontSize: typo.meta, color: dark.textMuted, marginTop: 8 },
  body: { fontSize: typo.body, color: dark.textSecondary, lineHeight: 1.4, marginTop: 4 },
  aud: { fontSize: typo.cardLabel, fontWeight: 700, color: dark.accentCyan, marginTop: 8 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  metaPill: {
    fontSize: typo.meta,
    color: dark.textPrimary,
    backgroundColor: "#0B1222",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
});

function t(locale: LocaleV4, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

function RiskBlock({ risk, locale }: { risk: PdfV4TopRisk; locale: LocaleV4 }) {
  const ta = locale === "ar" ? { textAlign: "right" as const } : {};
  return (
    <View style={s.card} wrap>
      <View style={s.rowHead} wrap={false}>
        <SeverityBadgeV4 level={risk.severity} locale={locale} />
        <Text style={[s.title, bf(locale), ta]} wrap>
          {risk.title}
        </Text>
      </View>
      <Text style={[s.aud, bf(locale)]}>{t(locale, "For the site owner", "لصاحب الموقع")}</Text>
      <Text style={[s.body, bf(locale), ta]} wrap>
        {risk.owner}
      </Text>
      <Text style={[s.aud, bf(locale)]}>{t(locale, "Business impact", "الأثر التجاري")}</Text>
      <Text style={[s.body, bf(locale), ta]} wrap>
        {risk.manager}
      </Text>
      <Text style={[s.aud, bf(locale)]}>{t(locale, "Technical context", "السياق التقني")}</Text>
      <Text style={[s.body, bf(locale), ta]} wrap>
        {risk.developer}
      </Text>
      <View style={s.metaRow}>
        <Text style={[s.metaPill, bf(locale)]}>
          {t(locale, "Effort", "الجهد")}: {risk.effort}
        </Text>
        <Text style={[s.metaPill, bf(locale)]}>
          {t(locale, "Attack feasibility", "إمكانية الاستغلال")}: {risk.attackFeasibility}
        </Text>
        <Text style={[s.metaPill, bf(locale)]}>
          {t(locale, "Priority", "الأولوية")}: {risk.priority}
        </Text>
      </View>
    </View>
  );
}

export function TopRisksPageV4({ data, locale }: { data: PdfReportDataV4; locale: LocaleV4 }) {
  const risks = data.topRisks;
  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap={false}>
      <SectionTitleV4
        title={t(locale, "Top risks & business impact", "أهم المخاطر والأثر التجاري")}
        locale={locale}
      />
      <Text style={[s.micro, bf(locale), locale === "ar" ? { textAlign: "right" } : {}]} wrap>
        {t(
          locale,
          "The three highest-severity issues below are framed for owners, managers, and engineers—without duplicating the full finding list.",
          "أدناه أعلى ثلاث قضايا خطورة، مُؤطَّرة لأصحاب المواقع والإدارة والمهندسين—دون تكرار قائمة النتائج كاملة.",
        )}
      </Text>
      {risks.length === 0 ? (
        <View style={[s.card, { marginTop: 10 }]} wrap>
          <Text style={[{ fontSize: typo.bodyLarge, color: dark.textSecondary }, bf(locale), locale === "ar" ? { textAlign: "right" } : {}]} wrap>
            {t(
              locale,
              "No elevated risks were surfaced in this scan. Continue monitoring as your surface changes.",
              "لم تُسجَّل مخاطر مرتفعة في هذا الفحص. واصل المراقبة مع تغيّر السطح.",
            )}
          </Text>
        </View>
      ) : (
        risks.map((r, i) => <RiskBlock key={i} risk={r} locale={locale} />)
      )}
      <FixedPageFooterV4 locale={locale} />
    </Page>
  );
}
