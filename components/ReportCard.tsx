"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { generateCyberGuardianPdf } from "@/lib/pdf";
import { getRemediationById, type RemediationEntry } from "@/lib/remediation";
import type { AIExplanation, Finding, ScanResult } from "@/lib/types";

type ReportCardProps = {
  result: ScanResult | null;
  loading: boolean;
  explanation: AIExplanation | null;
  aiLoading: boolean;
};

type PlatformKey = keyof RemediationEntry["codeExamples"];

const PLATFORM_LABELS: Record<PlatformKey, string> = {
  vercel: "Vercel",
  nginx: "Nginx",
  apache: "Apache",
  cloudflare: "Cloudflare",
};

const FIX_LABELS = {
  en: {
    businessImpact: "Business Impact",
    howToFix: "How to Fix",
    copy: "Copy",
    copied: "Copied",
    estimatedFixTime: "Fix time",
    difficulty: "Difficulty",
    riskReduction: "Risk reduction",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    high: "High",
    low: "Low",
    advisory: "Recommended action",
  },
  ar: {
    businessImpact: "التأثير على الموقع",
    howToFix: "طريقة الإصلاح",
    copy: "نسخ",
    copied: "تم النسخ",
    estimatedFixTime: "وقت الإصلاح",
    difficulty: "الصعوبة",
    riskReduction: "تقليل الخطر",
    easy: "سهل",
    medium: "متوسط",
    hard: "صعب",
    high: "مرتفع",
    low: "منخفض",
    advisory: "الإجراء الموصى به",
  },
} as const;

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

function getThreatLabel(threatLevel: string, t: ReturnType<typeof useLanguage>["t"]) {
  if (threatLevel === "low") {
    return t.lowThreat;
  }

  if (threatLevel === "medium") {
    return t.mediumThreat;
  }

  return t.highThreat;
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
    result.confidence >= 80
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
    return overview.split(language === "ar" ? "。" : ".")[0] + ".";
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

function getCriticalFindings(findings: Finding[]) {
  const critical = findings.filter(
    (finding) => finding.severity === "critical" || finding.severity === "high",
  );

  return critical.length > 0 ? critical : findings.slice(0, 3);
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

function getAvailableCodeTabs(codeExamples: RemediationEntry["codeExamples"]) {
  return (Object.keys(PLATFORM_LABELS) as PlatformKey[])
    .map((key) => ({
      key,
      label: PLATFORM_LABELS[key],
      code: codeExamples[key],
    }))
    .filter((tab): tab is { key: PlatformKey; label: string; code: string } =>
      Boolean(tab.code),
    );
}

function MetadataBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="bidi-safe inline-flex min-h-8 items-center rounded-full border border-cyan-300/15 bg-cyan-300/[0.05] px-3 py-1 text-[11px] font-semibold leading-5 text-cyan-100/90">
      <span className="text-slate-400">{label}:</span>
      <span className="ms-1 text-slate-100">{value}</span>
    </span>
  );
}

function FindingCard({
  finding,
  index,
}: {
  finding: Finding;
  index: number;
}) {
  const { direction, language } = useLanguage();
  const labels = FIX_LABELS[language];
  const remediation = useMemo(
    () => (finding.id ? getRemediationById(finding.id) : undefined),
    [finding.id],
  );
  const tabs = useMemo(
    () => (remediation ? getAvailableCodeTabs(remediation.codeExamples) : []),
    [remediation],
  );
  const [activeTabKey, setActiveTabKey] = useState<PlatformKey | null>(
    tabs[0]?.key ?? null,
  );
  const [copied, setCopied] = useState(false);
  const activeTab = tabs.find((tab) => tab.key === activeTabKey) ?? tabs[0];

  if (!remediation) {
    return (
      <div
        className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-start text-sm sm:bg-white/[0.04] sm:p-5"
        key={`${finding.severity}-${index}`}
      >
        <div className="flex w-full justify-start" dir={direction}>
          <SeverityBadge severity={finding.severity} />
        </div>
        <p
          className="bidi-safe mt-4 w-full overflow-hidden break-words text-start text-sm leading-7 text-slate-200"
          dir={language === "ar" ? "rtl" : "ltr"}
        >
          {finding.message[language]}
        </p>
        {finding.impact ? (
          <p
            className="bidi-safe mt-3 w-full overflow-hidden break-words text-start text-xs leading-6 text-slate-300 sm:text-slate-400"
            dir={language === "ar" ? "rtl" : "ltr"}
          >
            {finding.impact[language]}
          </p>
        ) : null}
      </div>
    );
  }

  async function handleCopy() {
    if (!activeTab?.code || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(activeTab.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div
      className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-start text-sm sm:bg-white/[0.04] sm:p-5"
      key={`${finding.id ?? finding.severity}-${index}`}
    >
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex w-full justify-start" dir={direction}>
          <SeverityBadge severity={finding.severity} />
        </div>
        <h4
          className="bidi-safe w-full overflow-hidden break-words text-start text-sm font-bold leading-7 text-slate-100"
          dir={language === "ar" ? "rtl" : "ltr"}
        >
          {finding.message[language]}
        </h4>
      </div>

      <p
        className="bidi-safe mt-3 w-full overflow-hidden break-words text-start text-sm leading-7 text-slate-300"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {remediation.explanation.simple[language]}
      </p>

      <div className="mt-4 rounded-2xl border border-cyan-300/[0.12] bg-cyan-300/[0.045] p-3">
        <p className="bidi-safe text-start text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200/90">
          {labels.businessImpact}
        </p>
        <p
          className="bidi-safe mt-2 overflow-hidden break-words text-start text-xs leading-6 text-slate-300"
          dir={language === "ar" ? "rtl" : "ltr"}
        >
          {remediation.businessImpact[language]}
        </p>
      </div>

      <details className="group mt-4 rounded-2xl border border-white/10 bg-slate-950/50 transition open:border-cyan-300/25 open:bg-cyan-300/[0.035]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-start text-sm font-bold text-slate-100">
          <span className="bidi-safe min-w-0">{labels.howToFix}</span>
          <span className="shrink-0 text-cyan-200 transition duration-200 group-open:rotate-180">
           ⌄
          </span>
        </summary>
        <div className="space-y-4 border-t border-white/10 px-3 pb-3 pt-4">
          <p className="bidi-safe text-start text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {labels.advisory}
          </p>
          <p
            className="bidi-safe overflow-hidden break-words text-start text-xs leading-6 text-slate-300"
            dir={language === "ar" ? "rtl" : "ltr"}
          >
            {remediation.recommendation[language]}
          </p>

          {tabs.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                  const active = tab.key === activeTab?.key;

                  return (
                    <button
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        active
                          ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-100"
                          : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-cyan-300/20 hover:text-slate-200"
                      }`}
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTabKey(tab.key)}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
                  <span className="text-xs font-bold text-slate-400">
                    {activeTab?.label}
                  </span>
                  <button
                    className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-1 text-xs font-bold text-cyan-100 transition hover:bg-cyan-300/[0.1]"
                    type="button"
                    onClick={handleCopy}
                  >
                    {copied ? labels.copied : labels.copy}
                  </button>
                </div>
                <pre
                  className="max-w-full overflow-x-auto p-3 text-xs leading-6 text-slate-200"
                  dir="ltr"
                >
                  <code>{activeTab?.code}</code>
                </pre>
              </div>
            </>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <MetadataBadge
              label={labels.estimatedFixTime}
              value={remediation.estimatedFixTime[language]}
            />
            <MetadataBadge
              label={labels.difficulty}
              value={labels[remediation.difficulty]}
            />
            <MetadataBadge
              label={labels.riskReduction}
              value={labels[remediation.riskReduction]}
            />
          </div>
        </div>
      </details>
    </div>
  );
}

function ScanTimeline({
  result,
  aiComplete,
}: {
  result: ScanResult;
  aiComplete: boolean;
}) {
  const { t, direction } = useLanguage();
  const stages = [
    t.stages.dns,
    t.stages.tls,
    t.stages.redirects,
    t.stages.headers,
    t.stages.threat,
    aiComplete ? t.stages.aiDone : t.stages.aiProgress,
  ];

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-4 shadow-2xl shadow-cyan-500/5 min-[390px]:p-5 sm:bg-slate-950/80">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className={`min-w-0 ${direction === "rtl" ? "text-right" : "text-left"}`}>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300 sm:tracking-[0.25em]">
            {t.liveScanTimeline}
          </p>
          <h3 className="bidi-safe mt-2 break-words text-xl font-semibold text-white">
            {t.deterministicPipeline}
          </h3>
        </div>
        <p className="text-sm text-slate-300 sm:text-slate-400">
          {result.meta.responseTime}ms {t.runtime}
        </p>
      </div>

      <div className="mt-5 grid min-w-0 items-start gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {stages.map((stage, index) => (
          <div
            className="group flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-start transition hover:border-cyan-300/30 hover:bg-cyan-300/5 sm:bg-white/[0.04]"
            key={stage}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-300/10 text-sm font-bold text-emerald-200 shadow-lg shadow-emerald-500/10"
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              {stage === t.stages.aiProgress ? "..." : "✓"}
            </span>
            <span className="bidi-safe min-w-0 overflow-hidden break-words text-sm leading-6 text-slate-200">
              {stage}
            </span>
          </div>
        ))}
      </div>
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
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 min-[390px]:px-4">
              {t.grade} {result.grade}
            </span>
          </div>

          <h2 className={`mt-5 break-words text-[2rem] font-black leading-tight tracking-tight min-[390px]:text-4xl md:mt-6 md:text-6xl ${theme.text}`}>
            {getThreatLabel(result.threatLevel, t)}
          </h2>
          <p className="bidi-safe mt-4 max-w-4xl overflow-hidden break-words text-start text-base leading-8 text-slate-100 md:text-xl">
            {getExecutiveLine(result, explanation, language, t)}
          </p>
          <p className="mt-3 max-w-full break-all text-left text-sm leading-6 text-slate-300 sm:text-slate-400" dir="ltr">
            {result.meta.finalUrl}
          </p>
        </div>

        <div className="grid min-w-0 gap-3 md:grid-cols-3 xl:grid-cols-1">
          <MetricCard label={t.confidence} value={`${result.confidence}%`}>
            <div className="mt-3 h-2 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all duration-700"
                style={{ width: `${result.confidence}%` }}
              />
            </div>
          </MetricCard>
          <MetricCard
            className={gradeColor(result.grade)}
            label={t.score}
            value={String(result.score)}
          />
          <MetricCard
            label={t.scanTimestamp}
            value={new Date(result.meta.scanTimestamp).toLocaleString(language)}
            valueClassName="text-sm leading-6"
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
  children,
}: {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-center sm:bg-slate-950/60 sm:p-5">
      <p className="bidi-safe min-h-5 text-center text-xs uppercase leading-5 tracking-[0.14em] text-slate-300 sm:text-slate-400">
        {label}
      </p>
      <p className={`bidi-safe mt-2 min-w-0 break-words text-center font-black ${valueClassName} ${className}`}>
        {value}
      </p>
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
  const { language, t, direction } = useLanguage();
  const trust = infrastructureTrust(result, t);
  const theme = threatTheme(result.threatLevel);
  const selectedExplanation = explanation?.[language];
  const sections = selectedExplanation
    ? [
        {
          title: t.executiveRiskOverview,
          content: selectedExplanation.executiveRiskOverview,
        },
        {
          title: t.attackSurfaceAnalysis,
          content: selectedExplanation.attackSurfaceAnalysis,
        },
        {
          title: t.infrastructureTrustAssessment,
          content: selectedExplanation.infrastructureTrustAssessment,
        },
      ]
    : [];

  return (
    <section
      className={`rounded-[2rem] border ${theme.border} bg-slate-950/90 p-4 text-white shadow-2xl ${theme.glow} min-[390px]:p-5 md:p-7`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 text-start">
          <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-300 sm:tracking-[0.3em]">
            {t.aiSummary}
          </p>
          <h3 className="bidi-safe mt-3 break-words text-xl font-bold tracking-tight min-[390px]:text-2xl md:text-3xl">
            {t.executiveBrief}
          </h3>
          <p className="bidi-safe mt-2 max-w-3xl overflow-hidden break-words text-sm leading-7 text-slate-300 sm:text-slate-400">
            {t.aiDescription}
          </p>
        </div>

        <div
          className={`flex min-w-0 flex-wrap gap-2 ${direction === "rtl" ? "lg:justify-start" : "lg:justify-end"}`}
        >
          <span className={`bidi-safe inline-flex min-h-8 max-w-full items-center rounded-full border px-3 py-1.5 text-xs leading-5 ${theme.badge}`}>
            {getThreatLabel(result.threatLevel, t)} {t.risk}
          </span>
          <span className={`bidi-safe inline-flex min-h-8 max-w-full items-center rounded-full border px-3 py-1.5 text-xs leading-5 ${trust.className}`}>
            {trust.label}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid min-w-0 items-start gap-3 lg:grid-cols-3">
          {t.aiStages.map((stage, index) => (
            <div
              className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.07] p-4 sm:bg-white/[0.04]"
              key={stage}
            >
              <div className="flex items-center gap-3 text-start">
                <span
                  className={`h-2.5 w-2.5 animate-pulse rounded-full ${theme.pulse}`}
                  style={{ animationDelay: `${index * 160}ms` }}
                />
                <span className="bidi-safe min-w-0 text-sm leading-6 text-slate-200">
                  {stage}
                </span>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-300"
                  style={{ animationDelay: `${index * 120}ms` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {selectedExplanation ? (
        <div className="mt-6 space-y-4">
          {sections.map((section, index) => (
            <details
              className="group min-w-0 rounded-2xl border border-white/10 bg-white/[0.07] p-4 transition open:border-cyan-300/30 open:bg-cyan-300/[0.06] min-[390px]:p-5 sm:bg-white/[0.04]"
              key={section.title}
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-start text-base font-semibold text-white min-[390px]:gap-4 sm:text-lg">
                <span className="bidi-safe min-w-0">{section.title}</span>
                <span className="shrink-0 text-sm text-cyan-200 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p
                className="bidi-safe mt-4 overflow-hidden break-words text-start text-sm leading-8 text-slate-300"
                dir={direction}
              >
                {section.content}
              </p>
            </details>
          ))}

          <details className="group min-w-0 rounded-2xl border border-white/10 bg-white/[0.07] p-4 transition open:border-cyan-300/30 open:bg-cyan-300/[0.06] min-[390px]:p-5 sm:bg-white/[0.04]" open>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-start text-base font-semibold text-white min-[390px]:gap-4 sm:text-lg">
              <span className="bidi-safe min-w-0">{t.recommendedSecurityActions}</span>
              <span className="shrink-0 text-sm text-cyan-200 transition group-open:rotate-45">
                +
              </span>
            </summary>
            <ul className="mt-4 space-y-3 text-start text-sm leading-7 text-slate-300">
              {selectedExplanation.recommendedSecurityActions.map((recommendation) => (
                <li className="bidi-safe overflow-hidden break-words rounded-xl bg-white/[0.07] p-4 sm:bg-white/[0.04]" key={recommendation}>
                  {recommendation}
                </li>
              ))}
            </ul>
          </details>
        </div>
      ) : null}
    </section>
  );
}

function CriticalFindings({ result }: { result: ScanResult }) {
  const { t } = useLanguage();
  const findings = getCriticalFindings(result.findings);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-4 shadow-2xl shadow-red-500/5 sm:bg-slate-950/80 sm:p-5 md:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 text-start">
          <p className="text-xs uppercase tracking-[0.18em] text-red-300 sm:tracking-[0.25em]">
            {t.criticalFindings}
          </p>
          <h3 className="bidi-safe mt-2 break-words text-xl font-bold text-white min-[390px]:text-2xl">
            {t.priorityRemediationQueue}
          </h3>
        </div>
        <span className="inline-flex min-h-8 items-center self-start rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs leading-none text-slate-300 sm:self-auto">
          {result.findings.length} {t.totalFindings}
        </span>
      </div>

      <div className="mt-5 grid min-w-0 items-start gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {findings.length > 0 ? (
          findings.map((finding, index) => (
            <FindingCard
              finding={finding}
              index={index}
              key={`${finding.id ?? finding.severity}-${index}`}
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

function DomainIntelligence({ result }: { result: ScanResult }) {
  const { language, t } = useLanguage();
  const reputationBadge = getReputationBadgeText(result, language, t);
  const domainRows = [
    [t.domain, result.intelligence.domain],
    [t.reputation, result.intelligence.reputation],
    [t.suspiciousTld, localizedBoolean(result.intelligence.suspiciousTld, t)],
    [t.punycodeIdn, localizedBoolean(result.intelligence.punycode, t)],
    [t.typosquatting, result.intelligence.typosquatting ? t.likely : t.no],
    [t.urlEntropy, String(result.intelligence.entropy)],
  ];

  return (
    <section className="grid min-w-0 items-start gap-5 xl:grid-cols-[1fr_0.9fr]">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-4 shadow-2xl shadow-cyan-500/5 sm:bg-slate-950/80 sm:p-5 md:p-7">
        <p className="text-start text-xs uppercase tracking-[0.18em] text-cyan-300 sm:tracking-[0.25em]">
          {t.domainIntelligence}
        </p>
        <h3 className="bidi-safe mt-2 break-words text-start text-xl font-bold text-white min-[390px]:text-2xl">
          {t.reputationSignals}
        </h3>
        <dl className="mt-5 grid min-w-0 items-start gap-3 md:grid-cols-2">
          {domainRows.map(([label, value]) => (
            <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-start sm:bg-white/[0.04] sm:p-5" key={label}>
              <dt className="bidi-safe text-start text-xs uppercase leading-5 tracking-[0.16em] text-slate-400 sm:text-slate-500">
                {label}
              </dt>
              <dd className="bidi-safe mt-3 overflow-hidden break-words text-start text-sm font-semibold leading-6 text-slate-100">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        {result.intelligence.phishingKeywords.length > 0 ? (
          <p className="bidi-safe mt-4 overflow-hidden break-words rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-start text-sm leading-7 text-amber-100 min-[390px]:p-5">
            {t.phishingKeywords}: {result.intelligence.phishingKeywords.join(", ")}
          </p>
        ) : null}
        {reputationBadge ? (
          <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08] p-4 text-start min-[390px]:p-5 sm:bg-cyan-300/10">
            <span className="bidi-safe inline-flex max-w-full overflow-hidden break-words rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold leading-5 text-cyan-100">
              {reputationBadge}
            </span>
            <p className="bidi-safe mt-3 text-xs leading-6 text-slate-300 sm:text-slate-400">
              {language === "ar"
                ? "نتائج السمعة هي إشارات استخباراتية وليست حكمًا نهائيًا."
                : "Reputation results are intelligence signals, not deterministic proof."}
            </p>
          </div>
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
          <div className="mt-5 flex flex-wrap gap-2">
            {result.technologies.map((technology) => (
              <span
                className="inline-flex min-h-9 max-w-full items-center break-all rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm leading-5 text-cyan-100 min-[390px]:px-4"
                key={technology}
                dir="ltr"
              >
                {technology}
              </span>
            ))}
          </div>
        ) : (
          <p className="bidi-safe mt-5 text-start text-sm leading-7 text-slate-300 sm:text-slate-400">{t.noFingerprint}</p>
        )}
        <p className="bidi-safe mt-5 overflow-hidden break-words rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-start text-sm leading-7 text-slate-200 min-[390px]:p-5 sm:bg-white/[0.04] sm:text-slate-300">
          {t.server}: {result.meta.server || t.notDisclosed}
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
                  <span className="inline-block max-w-full break-all text-left" dir="ltr">{step.url}</span>
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
              <span className="min-w-0 break-words text-left leading-6 text-slate-300" dir="ltr">
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
}: ReportCardProps) {
  const { language, t } = useLanguage();
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [exportError, setExportError] = useState(false);

  async function handleExport() {
    if (!result || exporting) {
      return;
    }

    setExporting(true);
    setExported(false);
    setExportError(false);

    try {
      await generateCyberGuardianPdf({
        result,
        explanation,
        language,
        t,
      });
      setExported(true);
      window.setTimeout(() => setExported(false), 3000);
    } catch {
      setExportError(true);
      window.setTimeout(() => setExportError(false), 4000);
    } finally {
      setExporting(false);
    }
  }

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
      <section className="rounded-[2rem] border border-dashed border-cyan-400/20 bg-white/75 p-5 text-center shadow-sm shadow-cyan-950/[0.02] transition dark:bg-slate-950/65 min-[390px]:p-6 sm:bg-white/55 sm:p-8 sm:dark:bg-slate-950/50">
        <h2 className="bidi-safe text-lg font-semibold text-slate-950 dark:text-white min-[390px]:text-xl">
          {t.reportEmptyTitle}
        </h2>
        <p className="bidi-safe mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300/85 sm:text-base">
          {t.reportEmptySubtitle}
        </p>
      </section>
    );
  }

  return (
    <section className="w-full min-w-0 space-y-6 sm:space-y-8">
      <h2 className="bidi-safe text-center text-xl font-semibold text-slate-950 dark:text-white min-[390px]:text-2xl">
        {t.reportEmptyTitle}
      </h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        {exported ? (
          <div className="bidi-safe max-w-full overflow-hidden break-words rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-start text-sm font-semibold leading-6 text-emerald-200 shadow-lg shadow-emerald-500/10">
            {t.reportExportedSuccessfully}
          </div>
        ) : null}
        {exportError ? (
          <div className="bidi-safe max-w-full overflow-hidden break-words rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-start text-sm font-semibold leading-6 text-amber-100 shadow-lg shadow-amber-500/10">
            {t.exportFailed}
          </div>
        ) : null}
        <button
          className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-cyan-300/30 bg-cyan-400 px-6 font-bold text-slate-950 shadow-2xl shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          disabled={exporting}
          onClick={handleExport}
          type="button"
        >
          {exporting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
          ) : null}
          {exporting ? t.exportingReport : t.exportReport}
        </button>
      </div>
      <ThreatBanner result={result} explanation={explanation} />
      <AIExplanationCard
        explanation={explanation}
        loading={aiLoading}
        result={result}
      />
      <CriticalFindings result={result} />
      <DomainIntelligence result={result} />
      <ScanTimeline result={result} aiComplete={Boolean(explanation)} />
      <TechnicalDetails result={result} />
    </section>
  );
}
