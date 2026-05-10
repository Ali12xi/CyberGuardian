"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import ReportCard from "@/components/ReportCard";
import UrlInput from "@/components/UrlInput";
import type { AIExplanation, ExplainApiResponse, ScanResult } from "@/lib/types";

const STEP_DURATION_MS = 800;
const FADE_DURATION_MS = 250;

const SCAN_PROGRESS_STEPS = {
  en: [
    "Validating URL...",
    "Resolving DNS...",
    "Analyzing TLS...",
    "Checking headers...",
    "Analyzing infrastructure...",
    "Generating intelligence...",
  ],
  ar: [
    "جاري التحقق من الرابط...",
    "فحص DNS...",
    "تحليل TLS والشهادة...",
    "فحص Security Headers...",
    "تحليل الـ Infrastructure...",
    "توليد التقرير الذكي...",
  ],
} as const;

function ScanProgress({
  currentStep,
  leaving,
}: {
  currentStep: number;
  leaving: boolean;
}) {
  const { direction, language } = useLanguage();
  const steps = SCAN_PROGRESS_STEPS[language];

  return (
    <section
      className={`rounded-[2rem] border border-cyan-400/20 bg-slate-950/90 p-4 text-white shadow-2xl shadow-cyan-500/10 transition duration-300 sm:p-5 md:p-6 ${
        leaving ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
      }`}
      dir={direction}
    >
      <div className="grid min-w-0 gap-2.5 sm:gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {steps.map((step, index) => {
          const completed = index < currentStep;
          const active = index === currentStep;

          return (
            <div
              className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 text-start transition sm:p-4 ${
                completed
                  ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                  : active
                    ? "border-cyan-300/40 bg-cyan-300/[0.08] text-cyan-50 shadow-lg shadow-cyan-500/10 sm:bg-cyan-300/10 sm:text-cyan-100"
                    : "border-white/10 bg-white/[0.07] text-slate-300 sm:bg-white/[0.04] sm:text-slate-500"
              }`}
              key={step}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current/30">
                {completed ? (
                  <span className="text-sm font-black text-emerald-300">✓</span>
                ) : active ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-100/30 border-t-cyan-100" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                )}
              </span>
              <span className="bidi-safe min-w-0 overflow-hidden break-words text-sm font-semibold leading-6">
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const { t } = useLanguage();

  return (
    <section className="mx-auto mt-9 w-full max-w-5xl space-y-4 px-1 text-center sm:mt-11 sm:space-y-5 sm:px-0 lg:mt-12">
      <h2 className="bidi-safe text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
        {t.howItWorksTitle}
      </h2>
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        {t.howItWorksCards.map((card, index) => (
          <article
            className="group rounded-3xl border border-cyan-300/[0.11] bg-white/80 p-4 text-start shadow-lg shadow-cyan-950/[0.025] backdrop-blur-sm transition dark:bg-slate-950/65 dark:shadow-cyan-500/[0.018] sm:p-5"
            key={card.title}
          >
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-2xl border border-cyan-300/[0.14] bg-cyan-300/[0.05] text-xs font-black text-cyan-700 dark:text-cyan-100">
              {index + 1}
            </div>
            <h3 className="bidi-safe text-base font-bold text-slate-950 dark:text-white">
              {card.title}
            </h3>
            <p className="bidi-safe mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300/90">
              {card.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function AnalyzePanel() {
  const { t } = useLanguage();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [pendingResult, setPendingResult] = useState<ScanResult | null>(null);
  const [explanation, setExplanation] = useState<AIExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [progressLeaving, setProgressLeaving] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [formResetKey, setFormResetKey] = useState(0);
  const explanationRequestVersion = useRef(0);

  const generateExplanation = useCallback(async (
    scanResult: ScanResult,
    requestVersion: number,
  ) => {
    setAiLoading(true);

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ result: scanResult }),
      });
      const data = (await response.json()) as ExplainApiResponse;

      if (!response.ok || !data.ok) {
        return;
      }

      if (explanationRequestVersion.current === requestVersion) {
        setExplanation(data.explanation);
      }
    } catch {
      // The API generates a local summary when Claude cannot respond. Network
      // interruption simply leaves the staged intelligence panel in place.
    } finally {
      if (explanationRequestVersion.current === requestVersion) {
        setAiLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!progressVisible || progressStep >= SCAN_PROGRESS_STEPS.en.length - 1) {
      return;
    }

    const timer = window.setTimeout(() => {
      setProgressStep((current) =>
        Math.min(current + 1, SCAN_PROGRESS_STEPS.en.length - 1),
      );
    }, STEP_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [progressStep, progressVisible]);

  useEffect(() => {
    const finalStep = SCAN_PROGRESS_STEPS.en.length - 1;

    if (!progressVisible || loading || progressStep !== finalStep) {
      return;
    }

    const completionTimer = window.setTimeout(() => {
      setProgressLeaving(true);

      window.setTimeout(() => {
        setProgressVisible(false);
        setProgressLeaving(false);
        setProgressStep(0);

        if (pendingResult) {
          setResult(pendingResult);
          setPendingResult(null);
          void generateExplanation(
            pendingResult,
            explanationRequestVersion.current,
          );
        }
      }, FADE_DURATION_MS);
    }, STEP_DURATION_MS);

    return () => window.clearTimeout(completionTimer);
  }, [generateExplanation, loading, pendingResult, progressStep, progressVisible]);

  function handleScanStart() {
    explanationRequestVersion.current += 1;
    setResult(null);
    setPendingResult(null);
    setExplanation(null);
    setAiLoading(false);
    setProgressStep(0);
    setProgressLeaving(false);
    setProgressVisible(true);
  }

  function handleScanComplete(scanResult: ScanResult) {
    setPendingResult(scanResult);
  }

  function handleLoadingChange(nextLoading: boolean) {
    setLoading(nextLoading);
  }

  function handleNewScan() {
    explanationRequestVersion.current += 1;
    setResult(null);
    setPendingResult(null);
    setExplanation(null);
    setAiLoading(false);
    setLoading(false);
    setProgressVisible(false);
    setProgressLeaving(false);
    setProgressStep(0);
    setFormResetKey((current) => current + 1);
  }

  const showHowItWorks = !result && !pendingResult && !progressVisible;
  const showPostScanAction = Boolean(result) && !progressVisible;

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-7">
      <UrlInput
        key={formResetKey}
        onLoadingChange={handleLoadingChange}
        onScanComplete={handleScanComplete}
        onScanStart={handleScanStart}
      />
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {t.heroBadges.map((badge) => (
          <span
            className="bidi-safe rounded-full border border-cyan-300/[0.12] bg-cyan-300/[0.035] px-3 py-1.5 text-xs font-semibold leading-5 text-cyan-700 shadow-sm shadow-cyan-500/[0.018] dark:text-cyan-100/85 sm:px-4"
            key={badge}
          >
            {badge}
          </span>
        ))}
      </div>
      {progressVisible ? (
        <ScanProgress currentStep={progressStep} leaving={progressLeaving} />
      ) : (
        <ReportCard
          aiLoading={aiLoading}
          explanation={explanation}
          loading={loading}
          result={result}
        />
      )}
      {showPostScanAction ? (
        <section className="mx-auto w-full max-w-xl rounded-3xl border border-cyan-300/[0.12] bg-white/80 p-4 text-center shadow-lg shadow-cyan-950/[0.03] backdrop-blur-sm dark:bg-slate-950/65 dark:shadow-cyan-500/[0.02] sm:p-5">
          <h2 className="bidi-safe text-base font-bold text-slate-950 dark:text-white sm:text-lg">
            {t.postScanTitle}
          </h2>
          <button
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.08] px-5 text-sm font-bold text-cyan-700 transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.12] focus:outline-none focus:ring-2 focus:ring-cyan-300/40 dark:text-cyan-100"
            type="button"
            onClick={handleNewScan}
          >
            {t.postScanButton}
          </button>
        </section>
      ) : null}
      {showHowItWorks ? <HowItWorksSection /> : null}
    </div>
  );
}
