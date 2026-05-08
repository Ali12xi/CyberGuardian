"use client";

import { useCallback, useEffect, useState } from "react";
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
      <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step, index) => {
          const completed = index < currentStep;
          const active = index === currentStep;

          return (
            <div
              className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 text-start transition sm:p-4 ${
                completed
                  ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                  : active
                    ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100 shadow-lg shadow-cyan-500/10"
                    : "border-white/10 bg-white/[0.04] text-slate-500"
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
              <span className="bidi-safe min-w-0 text-sm font-semibold leading-6">
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function AnalyzePanel() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [pendingResult, setPendingResult] = useState<ScanResult | null>(null);
  const [explanation, setExplanation] = useState<AIExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [progressLeaving, setProgressLeaving] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

  const generateExplanation = useCallback(async (scanResult: ScanResult) => {
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

      setExplanation(data.explanation);
    } catch {
      // The API generates a local summary when Claude cannot respond. Network
      // interruption simply leaves the staged intelligence panel in place.
    } finally {
      setAiLoading(false);
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
          void generateExplanation(pendingResult);
        }
      }, FADE_DURATION_MS);
    }, STEP_DURATION_MS);

    return () => window.clearTimeout(completionTimer);
  }, [generateExplanation, loading, pendingResult, progressStep, progressVisible]);

  function handleScanStart() {
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

  return (
    <div className="space-y-6">
      <UrlInput
        onLoadingChange={handleLoadingChange}
        onScanComplete={handleScanComplete}
        onScanStart={handleScanStart}
      />
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
    </div>
  );
}
