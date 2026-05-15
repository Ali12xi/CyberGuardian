import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { bf, FixedPageFooterV5, LtrText, LocaleText, footerReservePt, type LocaleV5 } from "@/lib/pdf/v5/components";
import { A4_H, A4_W, colors, CONTENT_W, MARGIN, typo } from "@/lib/pdf/v5/constants";
import type { ActionV5, PdfReportDataV5 } from "@/lib/pdf/v5/mapV5";

const padB = MARGIN + footerReservePt();

function sevPal(sev: ActionV5["severity"]) {
  if (sev === "critical" || sev === "high") {
    return { bg: colors.criticalBg, fg: colors.critical };
  }
  if (sev === "medium") {
    return { bg: colors.mediumBg, fg: colors.medium };
  }
  return { bg: colors.lowBg, fg: colors.low };
}

const s = StyleSheet.create({
  page: { width: A4_W, height: A4_H, backgroundColor: colors.pageBg },
  inner: { padding: MARGIN, paddingBottom: padB },
  title: { fontSize: typo.section, fontWeight: 700, color: colors.white, marginBottom: 8 },
  subtitle: {
    fontSize: typo.body,
    color: colors.muted,
    lineHeight: 1.45,
    marginBottom: 22,
    maxWidth: CONTENT_W,
  },
  card: {
    marginBottom: 18,
    padding: 14,
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  head: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  idx: { fontSize: typo.section, fontWeight: 800, color: colors.brandCyan, marginRight: 8, minWidth: 22 },
  badge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, marginRight: 8 },
  badgeTxt: { fontSize: typo.meta, fontWeight: 700, color: colors.white },
  ttl: { fontSize: typo.bodyLg, fontWeight: 700, color: colors.white, flex: 1 },
  two: { flexDirection: "row", marginTop: 10 },
  half: { flex: 1, paddingRight: 8 },
  lab: { fontSize: typo.meta, fontWeight: 700, color: colors.brandCyan, marginBottom: 4 },
  body: { fontSize: typo.body, color: colors.body, lineHeight: 1.4 },
  snippetBox: {
    backgroundColor: "#060b14",
    borderWidth: 0.5,
    borderColor: "#1e2a3a",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 10,
    width: "100%",
  },
  snippetText: {
    fontFamily: "Courier",
    fontSize: 9,
    color: "#00d4b4",
    flexShrink: 1,
  },
  foot: { fontSize: typo.meta, color: colors.muted, marginTop: 8 },
});

function t(locale: LocaleV5, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

export function ActionPlanPageV5({
  chunk,
  data,
  pageIndex,
  globalStartIndex,
}: {
  chunk: ActionV5[];
  data: PdfReportDataV5;
  pageIndex: number;
  globalStartIndex: number;
}) {
  if (!chunk || chunk.length === 0) {
    return null;
  }

  const { locale } = data;
  const ta = locale === "ar" ? { textAlign: "right" as const } : {};
  return (
    <Page size={[A4_W, A4_H]} style={s.page} wrap>
      <View style={s.inner}>
        <Text style={[s.title, bf(locale)]}>
          {pageIndex === 0
            ? t(locale, "What to fix first", "ما يُصلح أولاً")
            : t(locale, "What to fix first (continued)", "ما يُصلح أولاً — تابع")}
        </Text>
        {pageIndex === 0 ? (
          <LocaleText locale={locale} style={[s.subtitle, bf(locale)]} wrap>
            {t(
              locale,
              "Prioritized checklist — apply the snippet, deploy headers, then re-scan.",
              "قائمة مرتبة — طبّق المقتطف، انشر الرؤوس، ثم أعد الفحص.",
            )}
          </LocaleText>
        ) : null}
        {chunk.map((a, i) => {
          const pal = sevPal(a.severity);
          const n = globalStartIndex + i + 1;
          return (
            <View key={`${a.findingId}-${i}`} style={s.card}>
              <View style={s.head}>
                <Text style={[s.idx, bf(locale)]}>{n}.</Text>
                <View style={[s.badge, { backgroundColor: pal.bg }]}>
                  <Text style={[s.badgeTxt, { color: pal.fg }, bf(locale)]}>{a.severity.toUpperCase()}</Text>
                </View>
                <Text style={[s.ttl, bf(locale), ta]} wrap>
                  {a.title}
                </Text>
              </View>
              <View style={s.two}>
                <View style={s.half}>
                  <Text style={[s.lab, bf(locale)]}>{t(locale, "Risk", "المخاطر")}</Text>
                  <Text style={[s.body, bf(locale), ta]} wrap>
                    {a.ifIgnored}
                  </Text>
                </View>
                <View style={[s.half, { paddingRight: 0 }]}>
                  <Text style={[s.lab, bf(locale)]}>{t(locale, "Outcome", "النتيجة")}</Text>
                  <Text style={[s.body, bf(locale), ta]} wrap>
                    {a.afterFixed}
                  </Text>
                </View>
              </View>
              <View style={s.snippetBox}>
                <LtrText value={a.snippet} style={[s.snippetText, { flexShrink: 1 }]} />
              </View>
              <View
                style={{
                  marginTop: 10,
                  paddingTop: 8,
                  borderTopWidth: 0.5,
                  borderTopColor: "#1a2235",
                }}
              >
                <Text style={[s.foot, bf(locale), { marginTop: 0 }]} wrap={false}>
                  {`${t(locale, "Effort", "الجهد")}: ${a.effortMinutes} min · ${a.platform} · ${t(locale, "Expected", "متوقع")}: +${a.expectedScoreGain} ${t(locale, "pts", "نقطة")}`}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      <FixedPageFooterV5 locale={locale} />
    </Page>
  );
}
