"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import type { Language, Translations } from "@/lib/i18n";
import DownloadReportButton from "@/components/DownloadReportButton";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { getBusinessImpact } from "@/lib/businessImpact";
import { getFindingExplanation } from "@/lib/findingExplanations";
import type { EffortBandKey } from "@/lib/fixSnippets";
import {
  getActionPlanEffortBandKey,
  getFixTimeEstimate,
  type FixPlatform,
} from "@/lib/fixSnippets";
import { DIFFICULTY_LABELS } from "@/lib/findingFixes";
import { getRemediationById } from "@/lib/remediation";
import { resolveTechnicalFix } from "@/lib/technicalFixResolver";
import type { AIExplanation, Finding, ScanResult } from "@/lib/types";
import {
  entropyStatusIcon,
  getEntropyBand,
  getEntropyExplanation,
  getPunycodeExplanation,
  getReputationExplanation,
  getSuspiciousTldExplanation,
  getTyposquattingExplanation,
  reputationStatusIcon,
} from "@/lib/domainSignals";
import { getTechnologyContextLine, techRiskLabel } from "@/lib/techContext";

type ReportCardProps = {
  result: ScanResult | null;
  loading: boolean;
  explanation: AIExplanation | null;
  aiLoading: boolean;
  scanId?: string;
  scanToken?: string;
};

function effortBandLabel(t: Translations, key: EffortBandKey): string {
  switch (key) {
    case "none":
      return t.effortBandNone;
    case "minimal":
      return t.effortBandMinimal;
    case "light":
      return t.effortBandLight;
    case "moderate":
      return t.effortBandModerate;
    case "heavy":
      return t.effortBandHeavy;
    case "severe":
      return t.effortBandSevere;
    default:
      return t.effortBandLight;
  }
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  return Object.keys(vars).reduce(
    (acc, k) => acc.replaceAll(`{${k}}`, String(vars[k])),
    template,
  );
}

const SEVERITY_ORDER: Record<Finding["severity"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  informational: 4,
};

function sortFindingsBySeverity(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

function topFindings(findings: Finding[], limit: number): Finding[] {
  return sortFindingsBySeverity(findings).slice(0, limit);
}

function firstOverviewSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }
  const match = trimmed.match(/^[^.!?…]+[.!?…]?/);
  const first = (match ? match[0] : trimmed.split("\n")[0] ?? trimmed).trim();
  return first.length > 320 ? `${first.slice(0, 317)}…` : first;
}

function scanWallClockMs(result: ScanResult): number | null {
  const ms = result.meta.responseTime;
  return typeof ms === "number" && ms > 0 ? ms : null;
}

function findingSeverityDot(severity: Finding["severity"]): string {
  if (severity === "critical" || severity === "high") {
    return "🔴";
  }
  if (severity === "medium") {
    return "🟡";
  }
  return "🟢";
}

function entropyBandWord(band: ReturnType<typeof getEntropyBand>, language: Language): string {
  if (language === "ar") {
    if (band === "high") {
      return "مرتفع";
    }
    if (band === "elevated") {
      return "مرتفع نسبياً";
    }
    return "طبيعي";
  }
  if (band === "high") {
    return "High";
  }
  if (band === "elevated") {
    return "Elevated";
  }
  return "Normal";
}

function formatHeaderName(header: string) {
  return header
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

function threatTheme(threatLevel: string) {
  if (threatLevel === "low") {
    return {
      glow: "shadow-emerald-500/20",
      border: "border-emerald-400/30",
      text: "text-emerald-300",
      badge: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
      gradient:
        "from-emerald-950/80 via-slate-950 to-slate-950 md:from-emerald-500/20 md:via-cyan-500/10",
      pulse: "bg-emerald-300",
    };
  }

  if (threatLevel === "medium") {
    return {
      glow: "shadow-amber-500/20",
      border: "border-amber-300/30",
      text: "text-amber-200",
      badge: "border-amber-300/30 bg-amber-300/10 text-amber-100",
      gradient:
        "from-amber-950/80 via-slate-950 to-slate-950 md:from-amber-500/20 md:via-cyan-500/10",
      pulse: "bg-amber-300",
    };
  }

  return {
    glow: "shadow-red-500/25",
    border: "border-red-400/40",
    text: "text-red-300",
    badge: "border-red-300/30 bg-red-400/10 text-red-100",
    gradient:
      "from-red-950/80 via-slate-950 to-slate-950 md:from-red-500/25 md:via-fuchsia-500/10",
    pulse: "bg-red-300",
  };
}

function gradeColor(grade: string) {
  if (grade === "A") {
    return "text-emerald-300";
  }

  if (grade === "B" || grade === "C") {
    return "text-amber-200";
  }

  return "text-red-300";
}

function formatScanTimestamp(iso: string, language: Language): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { date: iso, time: "" };
  }

  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const date = `${y}/${mo}/${day}`;

  const h24 = d.getHours();
  const minutes = d.getMinutes();
  const isPm = h24 >= 12;
  const h12 = h24 % 12 || 12;
  const hh = String(h12).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const time =
    language === "ar" ? `${hh}:${mm}\u00a0${isPm ? "م" : "ص"}` : `${hh}:${mm}\u00a0${isPm ? "PM" : "AM"}`;

  return { date, time };
}

function getThreatLabel(threatLevel: string, t: ReturnType<typeof useLanguage>["t"]) {
  if (threatLevel === "low") {
    return t.lowThreat;
  }

  if (threatLevel === "medium") {
    return t.mediumThreat;
  }

  return t.highThreat;
}

function getSecurityVisibilityCardValue(
  overall: "full" | "partial" | "limited",
  t: ReturnType<typeof useLanguage>["t"],
) {
  if (overall === "full") {
    return t.visibilityCardHigh;
  }
  if (overall === "partial") {
    return t.visibilityCardPartial;
  }
  return t.visibilityCardLimited;
}

function getThreatDetected(threatLevel: string, t: ReturnType<typeof useLanguage>["t"]) {
  if (threatLevel === "low") {
    return t.lowThreatDetected;
  }

  if (threatLevel === "medium") {
    return t.mediumThreatDetected;
  }

  return t.highThreatDetected;
}

function infrastructureTrust(result: ScanResult, t: ReturnType<typeof useLanguage>["t"]) {
  if (result.threatLevel === "critical" || result.threatLevel === "high") {
    return {
      label: t.lowInfrastructureTrust,
      className: "border-red-400/30 bg-red-400/10 text-red-100",
    };
  }

  if (
    result.intelligence.reputation === "trusted" &&
    result.ssl.valid &&
    result.observableCoverage.overall === "full"
  ) {
    return {
      label: t.highInfrastructureTrust,
      className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
    };
  }

  return {
    label: t.moderateInfrastructureTrust,
    className: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  };
}

function getExecutiveLine(
  result: ScanResult,
  explanation: AIExplanation | null,
  language: "en" | "ar",
  t: ReturnType<typeof useLanguage>["t"],
) {
  const overview = explanation?.[language].executiveRiskOverview;

  if (overview) {
    return overview;
  }

  if (
    result.intelligence.reputation === "trusted" &&
    result.threatLevel === "low"
  ) {
    return t.trustedExecutiveLine;
  }

  if (result.redirects.suspicious || result.intelligence.reputation === "suspicious") {
    return t.suspiciousExecutiveLine;
  }

  return t.defaultExecutiveLine;
}

function localizedBoolean(value: boolean, t: ReturnType<typeof useLanguage>["t"]) {
  return value ? t.yes : t.no;
}

function getReputationBadgeText(
  result: ScanResult,
  language: "en" | "ar",
  t: ReturnType<typeof useLanguage>["t"],
) {
  const reputation = result.reputation;

  if (!reputation) {
    return null;
  }

  if (reputation.verdict === "malicious") {
    return language === "ar"
      ? `خبيث: ${reputation.malicious}/${reputation.totalVendors}`
      : `Malicious: ${reputation.malicious}/${reputation.totalVendors}`;
  }

  if (reputation.verdict === "suspicious") {
    const count = Math.max(reputation.malicious, reputation.suspicious);

    return language === "ar"
      ? `مشبوه: ${count}/${reputation.totalVendors}`
      : `Suspicious: ${count}/${reputation.totalVendors}`;
  }

  if (reputation.verdict === "clean") {
    return language === "ar"
      ? `فحص ${reputation.totalVendors} محرك — نظيف`
      : `${reputation.totalVendors} engines checked — clean`;
  }

  return language === "ar"
    ? `فحص ${reputation.totalVendors} محرك — ${t.unknown}`
    : `${reputation.totalVendors} engines checked — ${t.unknown}`;
}

function SeverityBadge({ severity }: { severity: Finding["severity"] }) {
  const color =
    severity === "critical" || severity === "high"
      ? "border-red-300/30 bg-red-400/10 text-red-200"
      : severity === "medium"
        ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
        : "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";

  return (
    <span
      className={`inline-flex h-7 items-center justify-center rounded-full border px-3 text-[11px] font-bold uppercase leading-none tracking-[0.12em] ${color}`}
      dir="ltr"
    >
      {severity}
    </span>
  );
}

function FindingCard({
  finding,
  index,
  result,
}: {
  finding: Finding;
  index: number;
  result: ScanResult;
}) {
  const VISIBLE_PLATFORM_TABS = 3;

  const { direction, language, t } = useLanguage();
  const remediation = useMemo(
    () => (finding.id ? getRemediationById(finding.id) : undefined),
    [finding.id],
  );
  const explanation = useMemo(
    () => (finding.id ? getFindingExplanation(finding.id) : undefined),
    [finding.id],
  );
  const biz = useMemo(
    () => (finding.id ? getBusinessImpact(finding.id) : undefined),
    [finding.id],
  );
  const resolved = useMemo(
    () => resolveTechnicalFix(result, finding.id, remediation),
    [result, finding.id, remediation],
  );
  const { snippets, findingFix, detected } = resolved;

  const [activePlatform, setActivePlatform] = useState<FixPlatform | null>(null);
  useEffect(() => {
    setActivePlatform(snippets[0]?.platform ?? null);
  }, [finding.id, snippets]);

  const activeSnippet =
    snippets.find((s) => s.platform === activePlatform) ?? snippets[0] ?? null;

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyKeyPrefix = finding.id ?? `finding-${index}`;

  const fixTimeShort = finding.id ? getFixTimeEstimate(finding.id) : undefined;
  const displayFixTime = fixTimeShort ?? remediation?.estimatedFixTime[language];

  const plainText =
    language === "ar"
      ? (explanation?.plainAr ?? remediation?.explanation.simple.ar ?? finding.message.ar)
      : (explanation?.plainEn ?? remediation?.explanation.simple.en ?? finding.message.en);

  const whyMatters =
    language === "ar"
      ? (explanation?.whyMattersAr ?? remediation?.explanation.technical.ar)
      : (explanation?.whyMattersEn ?? remediation?.explanation.technical.en);

  const businessLine =
    biz !== undefined
      ? language === "ar"
        ? biz.ar
        : biz.en
      : (remediation?.businessImpact[language] ?? finding.impact?.[language]);

  const title = remediation?.title[language] ?? finding.message[language];

  const priorityLabel =
    finding.severity === "critical" || finding.severity === "high"
      ? t.priorityLevelImmediate
      : finding.severity === "medium"
        ? t.priorityLevelThisWeek
        : t.priorityLevelLater;

  const diffDef = findingFix ? DIFFICULTY_LABELS[findingFix.difficulty] : null;
  const diffShort = diffDef ? (language === "ar" ? diffDef.ar : diffDef.en) : null;
  const diffDesc = diffDef ? (language === "ar" ? diffDef.descriptionAr : diffDef.descriptionEn) : null;

  async function copyActiveSnippet() {
    if (!activeSnippet?.code) {
      return;
    }

    const id = `${copyKeyPrefix}::${activeSnippet.platform}`;
    try {
      await navigator.clipboard.writeText(activeSnippet.code);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* ignore clipboard failures */
    }
  }

  const visibleSnippets = snippets.slice(0, VISIBLE_PLATFORM_TABS);
  const overflowSnippets = snippets.slice(VISIBLE_PLATFORM_TABS);
  const hasOverflow = overflowSnippets.length > 0;
  const copyActiveId = activeSnippet ? `${copyKeyPrefix}::${activeSnippet.platform}` : null;

  const layer1 = (
    <>
      <p
        className="bidi-safe mt-3 w-full overflow-hidden break-words text-start text-sm leading-7 text-slate-200"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {plainText}
      </p>
      {whyMatters ? (
        <p
          className="bidi-safe mt-2 w-full overflow-hidden break-words text-start text-sm leading-7 text-slate-300"
          dir={language === "ar" ? "rtl" : "ltr"}
        >
          <span className="font-semibold text-slate-200">{t.whyThisMattersLabel}</span>{" "}
          {whyMatters}
        </p>
      ) : null}
    </>
  );

  const layer2 = (
    <div className="mt-4 rounded-2xl border border-cyan-300/[0.12] bg-cyan-300/[0.045] p-3">
      <p className="bidi-safe text-start text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200/90">
        {t.layerBusinessImpact}
      </p>
      <p
        className="bidi-safe mt-2 text-start text-xs font-bold leading-6 text-amber-100/95"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {priorityLabel}
      </p>
      {displayFixTime ? (
        <p className="bidi-safe mt-2 text-start text-xs leading-6 text-slate-200" dir="ltr">
          ⏱ {displayFixTime}
        </p>
      ) : null}
      {businessLine !== undefined ? (
        <p
          className="bidi-safe mt-2 overflow-hidden break-words text-start text-xs leading-6 text-slate-300"
          dir={language === "ar" ? "rtl" : "ltr"}
        >
          💼 {businessLine}
        </p>
      ) : null}
    </div>
  );

  const technicalDetails = (
    <details className="group mt-4 rounded-2xl border border-white/10 bg-slate-950/50 transition open:border-cyan-300/25 open:bg-cyan-300/[0.035]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-start text-sm font-bold text-slate-100">
        <span className="bidi-safe min-w-0">
          🔧 {t.technicalFix}
        </span>
        <span className="shrink-0 text-cyan-200 transition duration-200 group-open:rotate-180">
          ⌄
        </span>
      </summary>
      <div className="space-y-4 border-t border-white/10 px-3 pb-3 pt-4">
        {remediation ? (
          <p
            className="bidi-safe overflow-hidden break-words text-start text-xs leading-6 text-slate-300"
            dir={language === "ar" ? "rtl" : "ltr"}
          >
            {remediation.recommendation[language]}
          </p>
        ) : finding.remediation ? (
          <p
            className="bidi-safe overflow-hidden break-words text-start text-xs leading-6 text-slate-300"
            dir={language === "ar" ? "rtl" : "ltr"}
          >
            {finding.remediation[language]}
          </p>
        ) : null}

        {findingFix && (diffShort || displayFixTime) ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0 text-start" dir={language === "ar" ? "rtl" : "ltr"}>
              <p className="bidi-safe text-[11px] leading-5 text-slate-400">
                <span className="font-bold text-slate-300">{t.difficultyLabel}</span>{" "}
                {diffShort ? (
                  <>
                    <span className="text-slate-200">{diffShort}</span>
                    {displayFixTime ? (
                      <span className="tabular-nums text-slate-300" dir="ltr">
                        {" "}
                        · {displayFixTime}
                      </span>
                    ) : null}
                  </>
                ) : (
                  displayFixTime && (
                    <span className="tabular-nums text-slate-200" dir="ltr">
                      ⏱ {displayFixTime}
                    </span>
                  )
                )}
              </p>
              {diffDesc ? (
                <p className="bidi-safe mt-1 text-[11px] leading-4 text-slate-500">{diffDesc}</p>
              ) : null}
            </div>
            {detected.detected &&
            activeSnippet &&
            activeSnippet.platform === detected.primary ? (
              <span
                className="inline-flex max-w-full shrink-0 items-center self-start rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold leading-none text-emerald-200/95 sm:self-center"
                dir="ltr"
              >
                {detected.label ? `${detected.label} · ` : ""}
                {t.detectedPlatform}
              </span>
            ) : null}
          </div>
        ) : null}

        {snippets.length > 0 ? (
          <>
            <p className="bidi-safe text-start text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {t.recommendedForStack}
            </p>

            <div className="flex flex-wrap gap-2">
              {visibleSnippets.map((tab) => {
                const active = tab.platform === activePlatform;
                const markDetected = detected.detected && tab.platform === detected.primary;

                return (
                  <button
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                      active
                        ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-100"
                        : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-cyan-300/20 hover:text-slate-200"
                    }`}
                    key={tab.platform}
                    type="button"
                    onClick={() => setActivePlatform(tab.platform)}
                  >
                    {tab.label}
                    {markDetected ? " ✓" : ""}
                  </button>
                );
              })}
            </div>

            {hasOverflow ? (
              <details className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-1">
                <summary className="cursor-pointer list-none px-2 py-2 text-start text-xs font-bold text-slate-300 marker:hidden [&::-webkit-details-marker]:hidden">
                  {t.otherPlatforms}
                  <span className="ms-1 text-cyan-300/80">▾</span>
                </summary>
                <div className="flex flex-wrap gap-2 border-t border-white/5 px-2 pb-2 pt-2">
                  {overflowSnippets.map((tab) => {
                    const active = tab.platform === activePlatform;
                    const markDetected = detected.detected && tab.platform === detected.primary;

                    return (
                      <button
                        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                          active
                            ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-100"
                            : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-cyan-300/20 hover:text-slate-200"
                        }`}
                        key={tab.platform}
                        type="button"
                        onClick={() => setActivePlatform(tab.platform)}
                      >
                        {tab.label}
                        {markDetected ? " ✓" : ""}
                      </button>
                    );
                  })}
                </div>
              </details>
            ) : null}

            {activeSnippet ? (
              <>
                <p className="bidi-safe text-start text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  {t.placeInsideLabel}
                </p>
                <p
                  className="bidi-safe -mt-2 text-start text-xs leading-6 text-slate-300"
                  dir={language === "ar" ? "rtl" : "ltr"}
                >
                  {language === "ar" ? activeSnippet.placementAr : activeSnippet.placement}
                </p>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
                    <span className="min-w-0 truncate text-xs font-bold text-slate-400">
                      {activeSnippet.label}
                    </span>
                    <button
                      className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-1 text-xs font-bold text-cyan-100 transition hover:bg-cyan-300/[0.1]"
                      type="button"
                      onClick={copyActiveSnippet}
                    >
                      {copyActiveId && copiedId === copyActiveId ? t.copiedSnippet : t.copySnippet}
                    </button>
                  </div>
                  <pre
                    className="max-w-full whitespace-pre-wrap break-words p-3 text-xs leading-relaxed text-slate-200 [overflow-wrap:anywhere]"
                    dir="ltr"
                  >
                    <code>{activeSnippet.code}</code>
                  </pre>
                </div>
              </>
            ) : null}

            {findingFix?.disclaimer ? (
              <p
                className="bidi-safe rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-[11px] leading-5 text-amber-100/95"
                dir={language === "ar" ? "rtl" : "ltr"}
              >
                ⚠ {language === "ar" ? findingFix.disclaimerAr ?? findingFix.disclaimer : findingFix.disclaimer}
              </p>
            ) : null}

            {findingFix && findingFix.risksReduced.length > 0 ? (
              <div>
                <p className="bidi-safe text-start text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  {t.fixesRisksLabel}
                </p>
                <ul className="mt-2 space-y-1.5 text-start text-xs leading-5 text-slate-300">
                  {(language === "ar" ? findingFix.risksReducedAr : findingFix.risksReduced).map((line) => (
                    <li className="bidi-safe flex gap-2" dir={language === "ar" ? "rtl" : "ltr"} key={line}>
                      <span className="shrink-0 text-emerald-400/90">✓</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <p
            className="bidi-safe text-start text-xs leading-6 text-slate-400"
            dir={language === "ar" ? "rtl" : "ltr"}
          >
            {t.noSnippetForFinding}
          </p>
        )}
      </div>
    </details>
  );

  return (
    <div
      className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-start text-sm sm:bg-white/[0.04] sm:p-5"
      key={`${finding.id ?? finding.severity}-${index}`}
    >
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex w-full flex-wrap items-center gap-2" dir={direction}>
          <SeverityBadge severity={finding.severity} />
          {displayFixTime ? (
            <span
              className="inline-flex h-7 items-center rounded-full border border-white/10 bg-white/[0.06] px-3 text-[11px] font-bold tabular-nums leading-none text-slate-200"
              dir="ltr"
            >
              {displayFixTime}
            </span>
          ) : null}
        </div>
        <h4
          className="bidi-safe w-full overflow-hidden break-words text-start text-sm font-bold leading-7 text-slate-100"
          dir={language === "ar" ? "rtl" : "ltr"}
        >
          {title}
        </h4>
      </div>

      {layer1}
      {layer2}
      {technicalDetails}
    </div>
  );
}

function ScanTimingLine({ result }: { result: ScanResult }) {
  const { t } = useLanguage();
  const ms = scanWallClockMs(result);
  if (ms === null) {
    return null;
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 px-4 py-3 shadow-lg shadow-cyan-500/5 sm:px-5 sm:py-4">
      <p className="bidi-safe text-start text-sm leading-7 text-slate-200" dir="ltr">
        <span aria-hidden className="me-2 inline-block">
          ⚡
        </span>
        {t.scanCompletedIn}{" "}
        <span className="font-semibold tabular-nums text-cyan-100">{ms}</span>
        ms
      </p>
    </div>
  );
}

function ThreatBanner({
  result,
  explanation,
}: {
  result: ScanResult;
  explanation: AIExplanation | null;
}) {
  const { language, t } = useLanguage();
  const theme = threatTheme(result.threatLevel);

  return (
    <section
      className={`relative overflow-hidden rounded-[2.5rem] border ${theme.border} bg-gradient-to-br ${theme.gradient} p-4 text-white shadow-2xl ${theme.glow} min-[390px]:p-5 sm:p-6 md:p-8`}
    >
      <div className="absolute end-[-8rem] top-[-8rem] h-56 w-56 rounded-full bg-cyan-300/[0.025] blur-xl sm:bg-cyan-300/[0.04] sm:blur-2xl md:h-72 md:w-72 md:bg-cyan-300/10 md:blur-3xl" />
      <div className="absolute bottom-[-10rem] start-[-6rem] h-56 w-56 rounded-full bg-fuchsia-400/[0.02] blur-xl sm:bg-fuchsia-400/[0.04] sm:blur-2xl md:h-72 md:w-72 md:bg-fuchsia-400/10 md:blur-3xl" />

      <div className="relative grid min-w-0 gap-6 sm:gap-8 xl:grid-cols-[1.4fr_0.6fr] xl:items-center">
        <div className="min-w-0 text-start">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`h-3 w-3 animate-pulse rounded-full ${theme.pulse}`} />
            <span
              className={`bidi-safe max-w-full rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase leading-5 tracking-[0.16em] min-[390px]:px-4 min-[390px]:text-xs sm:tracking-[0.25em] ${theme.badge}`}
            >
              {getThreatDetected(result.threatLevel, t)}
            </span>
            <span
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 min-[390px]:px-4 tabular-nums"
              dir="ltr"
            >
              {t.grade} {result.grade}
            </span>
          </div>

          <h2 className={`mt-5 break-words text-[2rem] font-black leading-tight tracking-tight min-[390px]:text-4xl md:mt-6 md:text-6xl ${theme.text}`}>
            {getThreatLabel(result.threatLevel, t)}
          </h2>
          <p className="bidi-safe mt-4 max-w-4xl overflow-hidden break-words text-start text-base leading-8 text-slate-100 md:text-xl">
            {getExecutiveLine(result, explanation, language, t)}
          </p>
          <p className="mt-3 max-w-full break-all text-start text-sm leading-6 text-slate-300 sm:text-slate-400" dir="ltr">
            {result.meta.finalUrl}
          </p>
        </div>

        <div className="grid min-w-0 gap-3 md:grid-cols-3 xl:grid-cols-1">
          <MetricCard
            label={t.securityVisibility}
            value={getSecurityVisibilityCardValue(result.observableCoverage.overall, t)}
            valueCompact
            valueClassName={`text-2xl leading-none sm:text-3xl ${
              result.observableCoverage.overall === "full"
                ? "text-emerald-200"
                : result.observableCoverage.overall === "partial"
                  ? "text-amber-200"
                  : "text-red-200"
            }`}
          >
            <div className="relative mt-3 h-2 w-full rounded-full bg-white/10">
              <div
                className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all duration-700"
                style={{
                  width:
                    result.observableCoverage.overall === "full"
                      ? "100%"
                      : result.observableCoverage.overall === "partial"
                        ? "60%"
                        : "30%",
                }}
              />
            </div>
          </MetricCard>
          <MetricCard
            className={gradeColor(result.grade)}
            label={t.score}
            value={String(result.score)}
            valueDir="ltr"
          />
          <MetricCard
            label={t.scanTimestamp}
            value=""
            splitDisplay={formatScanTimestamp(result.meta.scanTimestamp, language)}
          />
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  className = "",
  valueClassName = "text-4xl",
  valueDir,
  valueCompact = false,
  splitDisplay,
  children,
}: {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
  /** Force LTR for numeric scores / percentages */
  valueDir?: "ltr";
  /** Smaller, single-line value (Security Visibility card) */
  valueCompact?: boolean;
  /** Two-line timestamp-style display (date + time, no seconds) */
  splitDisplay?: { date: string; time: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-center sm:bg-slate-950/60 sm:p-5">
      <p className="bidi-safe min-h-5 text-center text-xs uppercase leading-5 tracking-[0.14em] text-slate-300 sm:text-slate-400">
        {label}
      </p>
      {splitDisplay ? (
        <div
          className="bidi-safe mt-2 flex min-w-0 flex-col items-center gap-1 text-center"
          dir={valueDir ?? "ltr"}
        >
          <p className="text-sm leading-tight text-slate-300 tabular-nums">{splitDisplay.date}</p>
          <p className="text-lg font-semibold leading-tight text-slate-100 tabular-nums">
            {splitDisplay.time}
          </p>
        </div>
      ) : (
        <p
          className={`bidi-safe mt-2 min-w-0 text-center tabular-nums ${
            valueCompact
              ? "whitespace-nowrap font-bold leading-none"
              : "break-words font-black"
          } ${valueClassName} ${className}`}
          dir={valueDir}
        >
          {value}
        </p>
      )}
      {children ? <div className="mt-auto w-full pt-3">{children}</div> : null}
    </div>
  );
}

function AIExplanationCard({
  explanation,
  loading,
  result,
}: {
  explanation: AIExplanation | null;
  loading: boolean;
  result: ScanResult;
}) {
  const { language, t } = useLanguage();
  const trust = infrastructureTrust(result, t);
  const theme = threatTheme(result.threatLevel);
  const selectedExplanation = explanation?.[language];

  const topSurface = useMemo(() => topFindings(result.findings, 3), [result.findings]);
  const topActions = useMemo(() => topFindings(result.findings, 3), [result.findings]);

  const overviewText = useMemo(() => {
    if (selectedExplanation?.executiveRiskOverview) {
      return selectedExplanation.executiveRiskOverview;
    }
    return getExecutiveLine(result, explanation, language, t);
  }, [selectedExplanation, result, explanation, language, t]);

  const exposureElevated = result.infrastructure.serverExposureScore > 48;
  const cdnLabel = result.infrastructure.cdn?.trim()
    ? result.infrastructure.cdn
    : t.cdnNoneShort;

  const assessmentCardClass =
    "flex min-h-0 min-w-0 flex-col rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-start sm:p-5";

  return (
    <section
      className={`rounded-[2rem] border ${theme.border} bg-slate-950/90 p-4 text-white shadow-2xl ${theme.glow} min-[390px]:p-5 md:p-7`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 text-start">
          <h3 className="bidi-safe break-words text-xl font-bold tracking-tight min-[390px]:text-2xl md:text-3xl">
            {t.executiveBrief}
          </h3>
          <p className="bidi-safe mt-2 max-w-3xl overflow-hidden break-words text-sm leading-7 text-slate-300 sm:text-slate-400">
            {t.aiDescription}
          </p>
        </div>

        <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2 rtl:justify-start">
          <span className={`bidi-safe inline-flex min-h-8 max-w-full items-center rounded-full border px-3 py-1.5 text-xs leading-5 ${theme.badge}`}>
            {getThreatLabel(result.threatLevel, t)} {t.risk}
          </span>
          <span className={`bidi-safe inline-flex min-h-8 max-w-full items-center rounded-full border px-3 py-1.5 text-xs leading-5 ${trust.className}`}>
            {trust.label}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="assessment-grid mt-6 min-w-0">
          {[0, 1, 2, 3].map((i) => (
            <div
              className="min-h-[148px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.05]"
              key={String(i)}
            />
          ))}
        </div>
      ) : (
        <div className="assessment-grid mt-6 min-w-0">
          <div className={assessmentCardClass}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-200/90">
              🔍 {t.overviewCard}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`bidi-safe inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase leading-none tracking-[0.12em] ${theme.badge}`}
              >
                {getThreatLabel(result.threatLevel, t)}
              </span>
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-300" dir="ltr">
              {t.score}: {result.score}/95 · {t.grade} {result.grade}
            </p>
            <p className="mt-1 text-xs leading-6 text-slate-400">
              {t.securityVisibility}: {getSecurityVisibilityCardValue(result.observableCoverage.overall, t)}
            </p>
            <p
              className="bidi-safe mt-3 text-sm leading-7 text-slate-100"
              dir={language === "ar" ? "rtl" : "ltr"}
            >
              {overviewText}
            </p>
          </div>

          <div className={assessmentCardClass}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-200/90">
              ⚔️ {t.attackSurfaceCard}
            </p>
            {topSurface.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {topSurface.map((f, idx) => (
                  <li
                    className="bidi-safe flex gap-2 text-start text-xs leading-6 text-slate-200 sm:text-sm"
                    dir={language === "ar" ? "rtl" : "ltr"}
                    key={`surface-${idx}-${f.severity}`}
                  >
                    <span className="shrink-0" aria-hidden>
                      {findingSeverityDot(f.severity)}
                    </span>
                    <span className="min-w-0">
                      <span className="font-bold uppercase text-slate-400">{f.severity}</span> —{" "}
                      {f.message[language]}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                className="bidi-safe mt-3 text-sm leading-7 text-emerald-200/90"
                dir={language === "ar" ? "rtl" : "ltr"}
              >
                ✅ {t.noAttackSurfaceDetected}
              </p>
            )}
          </div>

          <div className={assessmentCardClass}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-200/90">
              🏗️ {t.infrastructureTrustCard}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.technologies.slice(0, 8).map((tech) => (
                <span
                  className="inline-flex max-w-full items-center break-all rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-[11px] leading-4 text-cyan-100"
                  dir="ltr"
                  key={tech}
                >
                  {tech}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-300" dir="ltr">
              {t.tlsSummaryLabel}: {result.ssl.protocol || t.unknown} ·{" "}
              {result.ssl.valid ? t.yes : t.no}
            </p>
            <p className="mt-1 text-xs leading-6 text-slate-400" dir={language === "ar" ? "rtl" : "ltr"}>
              {t.cdnActiveLabel}: {cdnLabel}
            </p>
            <p className="mt-1 text-xs font-semibold leading-6 text-slate-300">
              {exposureElevated ? t.exposureHighLabel : t.exposureLowLabel}
            </p>
          </div>

          <div className={assessmentCardClass}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-200/90">
              ✅ {t.actionsCard}
            </p>
            {topActions.length > 0 ? (
              <div className="mt-3 space-y-3 text-start text-sm leading-6 text-slate-200">
                {topActions.map((f, idx) => {
                  const est = f.id ? getFixTimeEstimate(f.id) : undefined;
                  return (
                    <div
                      className="bidi-safe flex flex-col gap-1 border-b border-white/5 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                      dir={language === "ar" ? "rtl" : "ltr"}
                      key={`action-${idx}-${f.severity}`}
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-cyan-200/90">{idx + 1}.</span>{" "}
                        {f.message[language]}
                      </div>
                      {est ? (
                        <span
                          className="shrink-0 self-start rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-300"
                          dir="ltr"
                        >
                          {est}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p
                className="bidi-safe mt-3 text-sm leading-7 text-slate-400"
                dir={language === "ar" ? "rtl" : "ltr"}
              >
                {t.noRankedActionsBrief}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function CriticalFindings({ result }: { result: ScanResult }) {
  const { t } = useLanguage();
  const findings = result.findings;
  const urgentCount = findings.filter(
    (f) => f.severity === "critical" || f.severity === "high",
  ).length;
  const weekCount = findings.filter((f) => f.severity === "medium").length;
  const laterCount = findings.filter(
    (f) => f.severity === "low" || f.severity === "informational",
  ).length;
  const effortKey = getActionPlanEffortBandKey(findings);
  const effortLabel = effortBandLabel(t, effortKey);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-4 shadow-2xl shadow-red-500/5 sm:bg-slate-950/80 sm:p-5 md:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 text-start">
          <p className="text-xs uppercase tracking-[0.18em] text-red-300 sm:tracking-[0.25em]">
            {t.criticalFindings}
          </p>
          <h3 className="bidi-safe mt-2 break-words text-xl font-bold text-white min-[390px]:text-2xl">
            {t.securityActionPlan}
          </h3>
        </div>
        <span className="inline-flex min-h-8 items-center self-start rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs leading-none text-slate-300 sm:self-auto">
          {findings.length} {t.totalFindings}
        </span>
      </div>

      {findings.length > 0 ? (
        <div className="bidi-safe mt-4 flex flex-wrap gap-x-4 gap-y-2 text-start text-xs leading-6 text-slate-200 sm:text-sm">
          <span>{interpolate(t.actionPlanUrgent, { count: urgentCount })}</span>
          <span>{interpolate(t.actionPlanThisWeek, { count: weekCount })}</span>
          <span>{interpolate(t.actionPlanLater, { count: laterCount })}</span>
          <span className="tabular-nums text-slate-300">
            {interpolate(t.actionPlanTotalEffort, { band: effortLabel })}
          </span>
        </div>
      ) : null}

      <div className="mt-5 grid min-w-0 items-start gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {findings.length > 0 ? (
          findings.map((finding, index) => (
            <FindingCard
              finding={finding}
              index={index}
              key={`${finding.id ?? finding.severity}-${index}`}
              result={result}
            />
          ))
        ) : (
          <div className="bidi-safe rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-start text-sm leading-7 text-emerald-100 min-[390px]:p-5 lg:col-span-2 xl:col-span-3">
            {t.noHighPriorityFindings}
          </div>
        )}
      </div>
    </section>
  );
}

function intelligenceReputationLabel(
  rep: ScanResult["intelligence"]["reputation"],
  language: Language,
): string {
  if (language === "ar") {
    if (rep === "trusted") {
      return "موثوق";
    }
    if (rep === "suspicious") {
      return "مشبوه";
    }
    return "محايد";
  }
  if (rep === "trusted") {
    return "Trusted";
  }
  if (rep === "suspicious") {
    return "Suspicious";
  }
  return "Neutral";
}

function DomainSignalBlock({
  icon,
  headline,
  explanation,
  footnote,
}: {
  icon: string;
  headline: string;
  explanation: string;
  footnote?: string | null;
}) {
  const { language } = useLanguage();
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-start sm:bg-white/[0.04] sm:p-5">
      <p
        className="bidi-safe text-start text-sm font-semibold leading-7 text-slate-100"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        <span aria-hidden className="me-2">
          {icon}
        </span>
        {headline}
      </p>
      <p
        className="bidi-safe mt-2 text-start text-xs leading-6 text-slate-300 sm:text-sm sm:leading-7 sm:text-slate-400"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {explanation}
      </p>
      {footnote ? (
        <p
          className="bidi-safe mt-2 text-start text-[11px] leading-5 text-slate-500 sm:text-xs"
          dir={language === "ar" ? "rtl" : "ltr"}
        >
          {footnote}
        </p>
      ) : null}
    </div>
  );
}

function DomainIntelligence({ result }: { result: ScanResult }) {
  const { language, t } = useLanguage();
  const reputationBadge = getReputationBadgeText(result, language, t);
  const entropyBand = getEntropyBand(result.intelligence.entropy);
  const entropyIcon = entropyStatusIcon(entropyBand);
  const repIcon = reputationStatusIcon(result.intelligence.reputation);
  const typoIcon = result.intelligence.typosquatting ? "⚠️" : "✅";
  const tldIcon = result.intelligence.suspiciousTld ? "⚠️" : "✅";
  const punyIcon = result.intelligence.punycode ? "⚠️" : "✅";

  const reputationHeadline = `${t.reputation}: ${intelligenceReputationLabel(result.intelligence.reputation, language)}`;
  const vendorLine = reputationBadge;
  const showVendorUnderPuny =
    Boolean(vendorLine) &&
    !result.intelligence.punycode &&
    result.reputation?.verdict === "clean";
  const reputationFootnote = vendorLine && !showVendorUnderPuny ? vendorLine : null;
  const punyFootnote = showVendorUnderPuny ? vendorLine : null;

  const typosquatHeadline = `${t.typosquatting}: ${
    result.intelligence.typosquatting ? t.likely : t.unlikely
  }`;

  const entropyHeadline = `${t.urlEntropy}: ${result.intelligence.entropy.toFixed(2)} — ${entropyBandWord(entropyBand, language)}`;

  const punyHeadline = `${t.punycodeIdn}: ${
    result.intelligence.punycode ? t.yes : t.noneDetected
  }`;

  const tldHeadline = `${t.suspiciousTld}: ${localizedBoolean(result.intelligence.suspiciousTld, t)}`;

  return (
    <section className="grid min-w-0 items-start gap-5 xl:grid-cols-[1fr_0.9fr]">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-4 shadow-2xl shadow-cyan-500/5 sm:bg-slate-950/80 sm:p-5 md:p-7">
        <p className="text-start text-xs uppercase tracking-[0.18em] text-cyan-300 sm:tracking-[0.25em]">
          {t.domainIntelligence}
        </p>
        <h3 className="bidi-safe mt-2 break-words text-start text-xl font-bold text-white min-[390px]:text-2xl">
          {t.reputationSignals}
        </h3>
        <p
          className="bidi-safe mt-3 text-start text-xs leading-6 text-slate-400 sm:text-sm"
          dir={language === "ar" ? "rtl" : "ltr"}
        >
          {t.domain}: <span className="font-semibold text-slate-200" dir="ltr">{result.intelligence.domain}</span>
        </p>
        <div className="mt-5 space-y-3">
          <DomainSignalBlock
            explanation={getReputationExplanation(result, language)}
            footnote={reputationFootnote}
            headline={reputationHeadline}
            icon={repIcon}
          />
          <DomainSignalBlock
            explanation={getTyposquattingExplanation(result, language)}
            headline={typosquatHeadline}
            icon={typoIcon}
          />
          <DomainSignalBlock
            explanation={getEntropyExplanation(result, language)}
            headline={entropyHeadline}
            icon={entropyIcon}
          />
          <DomainSignalBlock
            explanation={getPunycodeExplanation(result, language)}
            footnote={punyFootnote}
            headline={punyHeadline}
            icon={punyIcon}
          />
          <DomainSignalBlock
            explanation={getSuspiciousTldExplanation(result, language)}
            headline={tldHeadline}
            icon={tldIcon}
          />
        </div>
        {result.intelligence.phishingKeywords.length > 0 ? (
          <p className="bidi-safe mt-4 overflow-hidden break-words rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-start text-sm leading-7 text-amber-100 min-[390px]:p-5">
            {t.phishingKeywords}: {result.intelligence.phishingKeywords.join(", ")}
          </p>
        ) : null}
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-4 shadow-2xl shadow-cyan-500/5 sm:bg-slate-950/80 sm:p-5 md:p-7">
        <p className="text-start text-xs uppercase tracking-[0.18em] text-cyan-300 sm:tracking-[0.25em]">
          {t.infrastructure}
        </p>
        <h3 className="bidi-safe mt-2 break-words text-start text-xl font-bold text-white min-[390px]:text-2xl">
          {t.technologyFingerprint}
        </h3>
        {result.technologies.length > 0 ? (
          <ul className="mt-5 space-y-3">
            {result.technologies.map((technology, idx) => {
              const { risk, line } = getTechnologyContextLine(technology, result, language);
              const riskBadgeClass =
                risk === "safe"
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                  : risk === "warning"
                    ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                    : "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
              return (
                <li
                  className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-start sm:bg-white/[0.04] sm:p-5"
                  key={`${technology}-${idx}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2" dir="ltr">
                    <span className="min-w-0 break-all text-sm font-semibold text-slate-100">{technology}</span>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${riskBadgeClass}`}
                    >
                      {techRiskLabel(risk, language)}
                    </span>
                  </div>
                  <p
                    className="bidi-safe mt-2 text-start text-xs leading-6 text-slate-300 sm:text-sm sm:text-slate-400"
                    dir={language === "ar" ? "rtl" : "ltr"}
                  >
                    {line}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="bidi-safe mt-5 text-start text-sm leading-7 text-slate-300 sm:text-slate-400">{t.noFingerprint}</p>
        )}
        <p className="bidi-safe mt-5 overflow-hidden break-words rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-start text-sm leading-7 text-slate-200 min-[390px]:p-5 sm:bg-white/[0.04] sm:text-slate-300">
          {t.server} {result.meta.server || t.notDisclosed}
        </p>
      </div>
    </section>
  );
}

function TechnicalDetails({ result }: { result: ScanResult }) {
  const { t } = useLanguage();
  const presentHeaders = Object.entries(result.headers);
  const tlsRows = [
    [t.valid, localizedBoolean(result.ssl.valid, t)],
    [t.selfSigned, localizedBoolean(result.ssl.selfSigned, t)],
    [t.issuer, result.ssl.issuer || t.unknown],
    [t.daysLeft, String(result.ssl.daysLeft)],
    [t.tlsVersion, result.ssl.protocol || t.unknown],
    [t.cipher, result.ssl.cipher || t.unknown],
    [
      t.weakCrypto,
      localizedBoolean(result.ssl.weakProtocol || result.ssl.weakCipher, t),
    ],
  ];

  return (
    <section className="grid min-w-0 items-start gap-5 xl:grid-cols-2">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-4 min-[390px]:p-5 sm:bg-slate-950/80 md:p-7">
        <h3 className="bidi-safe text-start text-xl font-bold text-white">{t.tlsAndRedirects}</h3>
        <div className="mt-5 grid min-w-0 items-start gap-5 lg:grid-cols-2">
          <dl className="space-y-3 text-sm text-slate-300">
            {tlsRows.map(([label, value]) => (
              <div className="grid min-w-0 grid-cols-1 items-start gap-1 min-[390px]:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] min-[390px]:gap-4" key={label}>
                <dt className="bidi-safe min-w-0 text-start leading-6 text-slate-400 sm:text-slate-500">
                  {label}
                </dt>
                <dd className="bidi-safe min-w-0 break-words text-end leading-6 text-slate-200">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div>
            <p className="bidi-safe text-start text-sm leading-6 text-slate-300 sm:text-slate-400">
              {t.suspiciousRedirects}:{" "}
              {localizedBoolean(result.redirects.suspicious, t)}
            </p>
            <ol className="mt-3 max-h-56 space-y-2 overflow-auto pe-1 text-sm text-slate-300">
              {result.redirects.chain.map((step) => (
                <li
                  className="min-w-0 rounded-xl border border-white/10 bg-white/[0.07] p-3 sm:bg-white/[0.04]"
                  key={`${step.statusCode}-${step.url}`}
                >
                  <span className="font-semibold text-cyan-200" dir="ltr">{step.statusCode}</span>{" "}
                  <span className="inline-block max-w-full break-all text-start" dir="ltr">{step.url}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-4 min-[390px]:p-5 sm:bg-slate-950/80 md:p-7">
        <h3 className="bidi-safe text-start text-xl font-bold text-white">{t.securityHeaders}</h3>
        <div className="mt-5 grid min-w-0 items-start gap-2 md:grid-cols-2">
          {presentHeaders.map(([header, present]) => (
            <div
              className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm sm:bg-white/[0.04]"
              key={header}
            >
              <span className="min-w-0 break-words text-start leading-6 text-slate-300" dir="ltr">
                {formatHeaderName(header)}
              </span>
              <span
                className={
                  present
                    ? "shrink-0 font-semibold leading-none text-emerald-300"
                    : "shrink-0 font-semibold leading-none text-red-300"
                }
              >
                {present ? t.present : t.missing}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ReportCard({
  result,
  loading,
  explanation,
  aiLoading,
  scanId,
  scanToken,
}: ReportCardProps) {
  const { language, t } = useLanguage();
  if (loading) {
    return (
      <section className="rounded-[2.5rem] border border-cyan-400/20 bg-slate-950/90 p-5 text-center shadow-2xl shadow-cyan-500/10 transition min-[390px]:p-6 sm:p-10">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-300" />
        <h2 className="bidi-safe mt-5 text-xl font-semibold text-white min-[390px]:text-2xl">
          {t.scanningTarget}
        </h2>
        <p className="bidi-safe mt-2 leading-7 text-slate-300 sm:text-slate-400">
          {t.scanningTargetSubtitle}
        </p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="rounded-[2rem] border border-dashed border-cyan-400/20 bg-slate-950/65 p-5 text-center shadow-sm shadow-cyan-500/[0.018] transition min-[390px]:p-6 sm:bg-slate-950/50 sm:p-8">
        <h2 className="bidi-safe text-lg font-semibold text-white min-[390px]:text-xl">
          {t.reportEmptyTitle}
        </h2>
        <p className="bidi-safe mt-3 text-sm leading-7 text-slate-300/85 sm:text-base">
          {t.reportEmptySubtitle}
        </p>
      </section>
    );
  }

  return (
    <section className="w-full min-w-0 space-y-6 sm:space-y-8">
      <h2 className="bidi-safe text-center text-xl font-semibold text-white min-[390px]:text-2xl">
        {t.reportEmptyTitle}
      </h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end rtl:sm:justify-start">
        <DownloadReportButton
          locale={language}
          result={result}
          scanId={scanId}
          scanToken={scanToken}
        />
      </div>
      <ThreatBanner result={result} explanation={explanation} />
      <ScoreBreakdown result={result} />
      <AIExplanationCard
        explanation={explanation}
        loading={aiLoading}
        result={result}
      />
      <CriticalFindings result={result} />
      <DomainIntelligence result={result} />
      <ScanTimingLine result={result} />
      <TechnicalDetails result={result} />
    </section>
  );
}
