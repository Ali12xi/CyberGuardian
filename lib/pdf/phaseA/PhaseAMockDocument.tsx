import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { A4, contentWidth, margin, palette } from "@/lib/pdf/phaseA/constants";
import { LtrText } from "@/lib/pdf/phaseA/LtrText";
import { footerReservePt, PageFooter } from "@/lib/pdf/phaseA/PageFooter";

const MOCK_TS = "2026/05/12 06:41 UTC";
const MOCK_SCAN_ID = "CGA-2026-XXXX";
const MOCK_DOMAIN = "github.com";
const MOCK_URL = "https://github.com/";
const MOCK_HMAC = "abc123def456...";
const MOCK_VERIFY = "cyberguardianai.com/verify/abc123";
const MOCK_TOKEN = "CGA-2026-8F2A3D";

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
    backgroundColor: palette.green,
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
  sepTight: {
    height: 1,
    width: contentWidth,
    backgroundColor: palette.separator,
    marginVertical: 12,
  },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: palette.pillLowBg,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  pillText: {
    fontSize: 8,
    color: palette.pillLowText,
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
    borderLeftColor: palette.green,
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
});

function threatPill() {
  return (
    <View style={s.pill}>
      <Text style={s.pillText}>LOW THREAT</Text>
    </View>
  );
}

function scoreRow(
  label: string,
  percent: number,
  note: string,
  fillColor: string,
) {
  const fillW = (contentWidth * percent) / 100;
  return (
    <View style={s.scoreRowGap}>
      <View style={s.rowBetween}>
        <Text style={{ fontSize: 10, fontWeight: 700, color: palette.textPrimary }}>{label}</Text>
        <LtrText value={`${percent}%`} style={{ fontSize: 10, fontWeight: 700, color: fillColor }} />
      </View>
      <View style={s.barTrack}>
        <View style={[s.barFill, { width: fillW, backgroundColor: fillColor }]} />
      </View>
      <Text style={{ fontSize: 8, color: palette.textSecond, marginBottom: 6 }}>{note}</Text>
      <View style={{ height: 1, width: contentWidth, backgroundColor: palette.separator }} />
    </View>
  );
}

function barColor(pct: number): string {
  if (pct >= 80) {
    return palette.green;
  }
  if (pct >= 40) {
    return palette.amber;
  }
  return palette.red;
}

export function PhaseAMockDocument({ locale: _locale }: { locale: "en" | "ar" }) {
  void _locale;

  return (
    <Document>
      {/* Page 1 — Executive cover */}
      <Page size={[A4.width, A4.height]} style={s.page}>
        <View style={s.accentBar} />
        <View style={s.bodyBottomPad}>
          <View style={s.rowBetween}>
            <View style={{ width: coverExecLeftW }}>
              <Text style={s.kicker}>EXTERNAL SECURITY REPORT</Text>
              <Text style={s.brand}>CyberGurdian AI</Text>
            </View>
            <View style={{ width: coverExecRightW, alignItems: "flex-end" }}>
              <LtrText value={MOCK_TS} style={{ fontSize: 9, color: palette.textSecond }} />
              <Text style={{ fontSize: 8, color: palette.textMuted, marginTop: 4 }}>V1.6</Text>
            </View>
          </View>

          <View style={s.sepFull} />

          <View style={{ flexDirection: "row" }}>
            <View style={{ width: coverExecLeftW, paddingRight: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: 700, color: palette.textPrimary, marginBottom: 6 }}>
                {MOCK_DOMAIN}
              </Text>
              <LtrText value={MOCK_URL} style={{ fontSize: 9, color: palette.textSecond }} />
            </View>
            <View style={{ width: coverExecRightW }}>
              {threatPill()}
              <View style={{ flexDirection: "row", marginBottom: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: 700, color: palette.textPrimary }}>Grade: </Text>
                <LtrText value="B" style={{ fontSize: 11, fontWeight: 700, color: palette.textPrimary }} />
              </View>
              <LtrText value="Score: 77/95" style={{ fontSize: 11, color: palette.textPrimary }} />
              <Text style={{ fontSize: 9, color: palette.textSecond, marginTop: 4 }}>Visibility: High</Text>
            </View>
          </View>

          <View style={s.sepFull} />

          <View style={{ marginBottom: 8 }}>
            <View style={s.rowBetween}>
              <Text style={s.metaLabel}>Scan ID:</Text>
              <LtrText value={MOCK_SCAN_ID} style={{ fontSize: 9, color: palette.textPrimary }} />
            </View>
            <View style={[s.rowBetween, { marginTop: 6 }]}>
              <Text style={s.metaLabel}>Generated:</Text>
              <LtrText value={MOCK_TS} style={{ fontSize: 9, color: palette.textPrimary }} />
            </View>
          </View>

          <View style={s.methodologyBox}>
            <Text style={s.methodologyTitle}>Assessment Methodology</Text>
            <Text style={s.methodologyBody}>
              This report is based on passive, external-facing security analysis only. No intrusive testing or
              exploitation was performed during the scan.
            </Text>
          </View>

          <View style={s.spacer} />
          <Text style={s.disclaimer}>
            This report reflects external-facing security posture at scan time only. It does not constitute a
            penetration test, vulnerability assessment, or security certification.
          </Text>
        </View>
        <PageFooter pageIndex={1} />
      </Page>

      {/* Page 2 — Score breakdown */}
      <Page size={[A4.width, A4.height]} style={s.page}>
        <View style={s.bodyBottomPad}>
          <Text style={{ fontSize: 16, fontWeight: 700, color: palette.textPrimary, marginBottom: 6 }}>
            Security Score Breakdown
          </Text>
          <Text style={{ fontSize: 9, color: palette.textSecond, marginBottom: 24, lineHeight: 1.4 }}>
            Independent health signals — not a split{"\n"}of the headline score.
          </Text>

          {scoreRow("TLS & Certificate", 87, "TLSv1.3 active · 83d until expiry · HSTS enabled", barColor(87))}
          {scoreRow("Security Headers", 83, "1 security header missing", barColor(83))}
          {scoreRow("Infrastructure", 48, "No CDN detected · Server metadata exposed", barColor(48))}
          {scoreRow("Domain Trust", 90, "Trusted domain · No typosquatting signals", barColor(90))}
          {scoreRow("Redirect Safety", 88, "Standard redirect · 1 hop", barColor(88))}
        </View>
        <PageFooter pageIndex={2} />
      </Page>

      {/* Page 3 — Security assessment */}
      <Page size={[A4.width, A4.height]} style={s.page}>
        <View style={s.bodyBottomPad}>
          <Text style={{ fontSize: 16, fontWeight: 700, color: palette.textPrimary, marginBottom: 14 }}>
            Security Assessment
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
              <Text style={s.sectionLabel}>OVERVIEW</Text>
              {threatPill()}
              <LtrText value="Score: 77/95 · Grade B" style={{ fontSize: 9, color: palette.textPrimary, marginBottom: 4 }} />
              <Text style={{ fontSize: 9, color: palette.textPrimary, marginBottom: 8 }}>Visibility: High</Text>
              <Text style={{ fontSize: 9, color: palette.textSecond, lineHeight: 1.45, marginBottom: 20 }}>
                External posture is generally sound. Remaining exposure is concentrated in browser policy headers and
                visible infrastructure metadata.
              </Text>

              <Text style={s.sectionLabel}>INFRASTRUCTURE TRUST</Text>
              <Text style={{ fontSize: 9, color: palette.textPrimary, marginBottom: 4 }}>Provider: AWS</Text>
              <LtrText value="TLS: TLSv1.3 · CDN: None" style={{ fontSize: 9, color: palette.textPrimary, marginBottom: 4 }} />
              <Text style={{ fontSize: 9, color: palette.amber }}>Server exposure: Elevated</Text>
            </View>

            <View style={{ width: contentWidth - halfCol - 1, paddingLeft: 12 }}>
              <Text style={s.sectionLabel}>ATTACK SURFACE</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: palette.green,
                    marginRight: 8,
                  }}
                />
                <Text style={{ fontSize: 9, color: palette.textPrimary }}>LOW Missing permissions-policy</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: palette.green,
                    marginRight: 8,
                  }}
                />
                <Text style={{ fontSize: 9, color: palette.textPrimary }}>LOW Server metadata exposed</Text>
              </View>

              <Text style={s.sectionLabel}>RECOMMENDED ACTIONS</Text>
              <Text style={{ fontSize: 9, color: palette.textPrimary, marginBottom: 6 }}>
                1. Add Permissions-Policy header (~10 min)
              </Text>
              <Text style={{ fontSize: 9, color: palette.textPrimary }}>2. Hide server metadata (~10 min)</Text>
            </View>
          </View>
        </View>
        <PageFooter pageIndex={3} />
      </Page>

      {/* Page 4 — Security action plan */}
      <Page size={[A4.width, A4.height]} style={s.page}>
        <View style={s.bodyBottomPad}>
          <Text style={{ fontSize: 16, fontWeight: 700, color: palette.textPrimary, marginBottom: 4 }}>
            Security Action Plan
          </Text>
          <Text style={{ fontSize: 9, color: palette.textSecond, marginBottom: 16 }}>2 findings · ~20 min total</Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={s.planCard}>
              <View style={s.rowBetween}>
                <View style={s.pill}>
                  <Text style={s.pillText}>LOW</Text>
                </View>
                <LtrText value="~10 min" style={{ fontSize: 8, color: palette.textSecond }} />
              </View>
              <Text style={{ fontSize: 10, fontWeight: 700, color: palette.textPrimary, marginTop: 8, marginBottom: 8 }}>
                Missing Permissions Policy
              </Text>
              <Text style={{ fontSize: 9, color: palette.textSecond, lineHeight: 1.35, marginBottom: 8 }}>
                Powerful browser features are not locked{"\n"}down by policy.
              </Text>
              <Text style={{ fontSize: 9, color: palette.textMuted, marginBottom: 4 }}>Business Impact: Later</Text>
              <View style={s.codeBox}>
                <LtrText
                  value="Permissions-Policy: camera=(), microphone=()"
                  style={s.codeText}
                />
              </View>
            </View>

            <View style={s.planCard}>
              <View style={s.rowBetween}>
                <View style={s.pill}>
                  <Text style={s.pillText}>LOW</Text>
                </View>
                <LtrText value="~10 min" style={{ fontSize: 8, color: palette.textSecond }} />
              </View>
              <Text style={{ fontSize: 10, fontWeight: 700, color: palette.textPrimary, marginTop: 8, marginBottom: 8 }}>
                Infrastructure Metadata Exposed
              </Text>
              <Text style={{ fontSize: 9, color: palette.textSecond, lineHeight: 1.35, marginBottom: 8 }}>
                Server version visible in HTTP response{"\n"}headers.
              </Text>
              <Text style={{ fontSize: 9, color: palette.textMuted, marginBottom: 4 }}>Business Impact: Later</Text>
              <View style={s.codeBox}>
                <LtrText value="Remove Server: and X-Powered-By: headers" style={s.codeText} />
              </View>
            </View>
          </View>
        </View>
        <PageFooter pageIndex={4} />
      </Page>

      {/* Page 5 — Trust & verification */}
      <Page size={[A4.width, A4.height]} style={s.page}>
        <View style={s.bodyBottomPad}>
          <Text style={{ fontSize: 16, fontWeight: 700, color: palette.textPrimary, marginBottom: 14 }}>
            Report Integrity & Verification
          </Text>

          <View style={s.rowBetween}>
            <View style={{ width: Math.floor(contentWidth * 0.48) }}>
              <View style={[s.rowBetween, { marginBottom: 6 }]}>
                <Text style={{ fontSize: 8, color: palette.textMuted }}>Scan Token:</Text>
                <LtrText value={MOCK_TOKEN} style={{ fontSize: 9, color: palette.textPrimary }} />
              </View>
              <View style={[s.rowBetween, { marginBottom: 6 }]}>
                <Text style={{ fontSize: 8, color: palette.textMuted }}>Target:</Text>
                <LtrText value={MOCK_URL} style={{ fontSize: 9, color: palette.textPrimary }} />
              </View>
              <View style={[s.rowBetween, { marginBottom: 6 }]}>
                <Text style={{ fontSize: 8, color: palette.textMuted }}>Generated:</Text>
                <LtrText value={MOCK_TS} style={{ fontSize: 9, color: palette.textPrimary }} />
              </View>
              <View style={s.rowBetween}>
                <Text style={{ fontSize: 8, color: palette.textMuted }}>Version:</Text>
                <Text style={{ fontSize: 9, color: palette.textPrimary }}>CyberGurdian AI V1.6</Text>
              </View>
            </View>

            <View style={s.integrityBox}>
              <Text style={{ fontSize: 10, fontWeight: 700, color: palette.textPrimary, marginBottom: 6 }}>
                ✓ Report Integrity
              </Text>
              <Text style={{ fontSize: 9, color: palette.textSecond, marginBottom: 6 }}>Method: HMAC-SHA256</Text>
              <Text style={{ fontSize: 8, color: palette.textMuted, marginBottom: 4 }}>Token:</Text>
              <LtrText value={MOCK_HMAC} style={{ fontSize: 8, fontFamily: "Courier", color: palette.textPrimary }} />
              <View style={{ height: 10 }} />
              <Text style={{ fontSize: 8, color: palette.textMuted, marginBottom: 4 }}>Verify at:</Text>
              <LtrText value={MOCK_VERIFY} style={{ fontSize: 8, color: palette.green }} />
            </View>
          </View>

          <View style={{ alignItems: "center", marginTop: 20, marginBottom: 16 }}>
            <View style={s.qrBox}>
              <Text style={{ fontSize: 7, color: palette.textMuted }}>QR — Phase C</Text>
            </View>
            <LtrText value={MOCK_VERIFY} style={{ fontSize: 8, color: palette.textSecond, textAlign: "center" }} />
            <Text style={{ fontSize: 7, color: palette.textMuted, marginTop: 4 }}>Scan to verify this report</Text>
          </View>

          <Text style={{ fontSize: 8, color: palette.textMuted, lineHeight: 1.45, marginBottom: 12 }}>
            This report reflects external-facing security posture at scan time only. It does not constitute a full
            penetration test, vulnerability assessment, or legal security certification. CyberGurdian AI performs
            passive, non-intrusive external analysis only.
          </Text>

          <Text style={{ fontSize: 8, color: palette.textMuted, textAlign: "center" }}>
            CyberGurdian AI © 2026 · Engineered by Ali · V1.6
          </Text>
        </View>
        <PageFooter pageIndex={5} />
      </Page>
    </Document>
  );
}
