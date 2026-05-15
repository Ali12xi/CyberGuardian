import { Circle, Path, Svg, Text, View } from "@react-pdf/renderer";
import { CONTENT_W, dark } from "@/lib/pdf/v3/constants";

const VB = "0 0 100 100";
const LRM = "\u200e";

function lrmScoreText(scoreText: string): string {
  return `${LRM}${scoreText}${LRM}`;
}

function polarDeg(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPathD(cx: number, cy: number, r: number, degStart: number, degEnd: number, forceLarge = false) {
  const p0 = polarDeg(cx, cy, r, degStart);
  const p1 = polarDeg(cx, cy, r, degEnd);
  let delta = degEnd - degStart;
  while (delta < 0) {
    delta += 360;
  }
  while (delta > 360) {
    delta -= 360;
  }
  const largeArc = forceLarge || delta > 180 ? 1 : 0;
  const sweep = 1;
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} ${sweep} ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
}

const GAUGE_START = -210;
const GAUGE_END = 30;

export function GaugeChartV3({ score, maxScore, color }: { score: number; maxScore: number; color: string }) {
  const safeMax = maxScore > 0 ? maxScore : 95;
  const pct = Math.max(0, Math.min(1, score / safeMax));
  const fillEnd = GAUGE_START + (GAUGE_END - GAUGE_START) * pct;
  const trackD = arcPathD(50, 55, 35, GAUGE_START, GAUGE_END);
  const fillD =
    pct < 0.002 ? "" : arcPathD(50, 55, 35, GAUGE_START, Math.max(GAUGE_START + 0.01, fillEnd));
  const labelPct = Math.round(pct * 100);
  return (
    <View style={{ width: 100, height: 100, alignItems: "center" }}>
      <Svg viewBox={VB} width={100} height={78}>
        <Path d={trackD} stroke={dark.arcTrack} strokeWidth={8} fill="none" strokeLinecap="round" />
        {fillD !== "" ? (
          <Path d={fillD} stroke={color} strokeWidth={8} fill="none" strokeLinecap="round" />
        ) : null}
      </Svg>
      <Text style={{ fontSize: 18, fontWeight: 700, color: dark.textPrimary, marginTop: -14 }}>
        {lrmScoreText(`${labelPct}%`)}
      </Text>
      <Text style={{ fontSize: 8, color: dark.textSecondary, marginTop: 2 }}>Score</Text>
    </View>
  );
}

export type DonutCountsV3 = { high: number; medium: number; low: number };

export function DonutChartV3({ counts }: { counts: DonutCountsV3 }) {
  const { high, medium, low } = counts;
  const total = high + medium + low;
  const cx = 50;
  const cy = 50;
  const outerR = 35;
  const innerR = 22;

  if (total <= 0) {
    return (
      <View>
        <Svg viewBox={VB} width={100} height={100}>
          <Circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill={dark.arcTrack} />
        </Svg>
      </View>
    );
  }

  const segs: { n: number; color: string; label: string }[] = [
    { n: high, color: dark.red, label: "HIGH" },
    { n: medium, color: dark.amber, label: "MEDIUM" },
    { n: low, color: dark.green, label: "LOW" },
  ];

  let angle = -90;
  const paths: { d: string; color: string }[] = [];
  for (const seg of segs) {
    if (seg.n <= 0) {
      continue;
    }
    const sweep = (seg.n / total) * 360;
    const a0 = angle;
    const a1 = angle + sweep;
    const pOuter0 = polarDeg(cx, cy, outerR, a0);
    const pOuter1 = polarDeg(cx, cy, outerR, a1);
    const pInner1 = polarDeg(cx, cy, innerR, a1);
    const pInner0 = polarDeg(cx, cy, innerR, a0);
    const large = sweep > 180 ? 1 : 0;
    const d = [
      `M ${pOuter0.x.toFixed(2)} ${pOuter0.y.toFixed(2)}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${pOuter1.x.toFixed(2)} ${pOuter1.y.toFixed(2)}`,
      `L ${pInner1.x.toFixed(2)} ${pInner1.y.toFixed(2)}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${pInner0.x.toFixed(2)} ${pInner0.y.toFixed(2)}`,
      "Z",
    ].join(" ");
    paths.push({ d, color: seg.color });
    angle = a1;
  }

  return (
    <View>
      <Svg viewBox={VB} width={100} height={100}>
        {paths.map((p, i) => (
          <Path key={i} d={p.d} fill={p.color} />
        ))}
        <Circle cx={cx} cy={cy} r={innerR - 0.5} fill={dark.pageBg} />
      </Svg>
    </View>
  );
}

export function ScoreBreakdownBarsV3({
  rows,
}: {
  rows: { label: string; score: number; maxScore: number; color: string }[];
}) {
  const barW = 100;
  return (
    <View style={{ width: barW }}>
      {rows.map((r, i) => {
        const pct = r.maxScore > 0 ? Math.max(0, Math.min(1, r.score / r.maxScore)) : 0;
        const fillW = Math.max(0, Math.round(pct * barW));
        return (
          <View key={i} style={{ marginBottom: 6 }} wrap>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
              <Text style={{ fontSize: 7, color: dark.accentCyan }}>{r.label}</Text>
              <Text style={{ fontSize: 7, color: r.color }}>{lrmScoreText(`${r.score}/${r.maxScore}`)}</Text>
            </View>
            <View style={{ height: 4, width: barW, backgroundColor: dark.arcTrack, borderRadius: 2, overflow: "hidden" }}>
              <View style={{ height: 4, width: fillW, backgroundColor: r.color }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function AttackSurfaceBarsV3({
  bars,
}: {
  bars: { label: string; value: string; color: string }[];
}) {
  const barW = Math.max(80, CONTENT_W - 24);
  return (
    <View
      style={{
        backgroundColor: dark.cardBg,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: dark.cardBorder,
        padding: 12,
      }}
    >
      {bars.map((b, i) => {
        const n = parseFloat(String(b.value).replace("%", ""));
        const pct = Number.isFinite(n) ? Math.max(0, Math.min(1, n / 100)) : 0;
        const fillW = Math.max(0, Math.round(pct * barW));
        return (
          <View key={i} style={{ marginBottom: i === bars.length - 1 ? 0 : 10 }} wrap>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 7, color: dark.accentCyan }}>{b.label}</Text>
              <Text style={{ fontSize: 8, color: b.color }}>{lrmScoreText(b.value)}</Text>
            </View>
            <View style={{ height: 4, width: barW, backgroundColor: dark.arcTrack, borderRadius: 2, overflow: "hidden" }}>
              <View style={{ height: 4, width: fillW, backgroundColor: b.color }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
