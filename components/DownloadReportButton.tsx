"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { generatePDF } from "@/lib/pdf/v5/index";
import type { PdfExportMeta } from "@/lib/pdf/phaseB/mapScanResult";
import type { ScanResult } from "@/lib/types";

type DownloadReportButtonProps = {
  result: ScanResult;
  locale: "en" | "ar";
  scanId?: string;
  scanToken?: string;
};

function safeFilenameDomain(domain: string): string {
  const d = domain.replace(/[^a-zA-Z0-9.-]+/g, "_").replace(/^\.+|\.+$/g, "").slice(0, 80);
  return d === "" ? "scan" : d;
}

export default function DownloadReportButton({
  result,
  locale,
  scanId,
  scanToken,
}: DownloadReportButtonProps) {
  console.log("[PDF V2 Button] result:", result);
  const { setLanguage } = useLanguage();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [showArNotice, setShowArNotice] = useState(false);

  const labels =
    locale === "ar"
      ? {
          idle: "تحميل التقرير",
          loading: "جارٍ الإنشاء...",
          error: "فشل — حاول مجدداً",
        }
      : {
          idle: "Download Report",
          loading: "Generating...",
          error: "Failed — try again",
        };

  const buttonText = state === "loading" ? labels.loading : state === "error" ? labels.error : labels.idle;

  async function runDownload(downloadLocale: "en" | "ar") {
    setState("loading");
    try {
      const meta: PdfExportMeta = {
        scanId: scanId !== undefined && scanId !== "" ? scanId : "-",
        scanToken: scanToken !== undefined && scanToken !== "" ? scanToken : "-",
      };
      const blob = await generatePDF(result, downloadLocale, meta);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const domain = safeFilenameDomain(result.intelligence.domain);
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `cyberguardian-${domain}-${date}.pdf`;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 4000);
      setState("idle");
    } catch (error) {
      console.error("[PDF V2 Button] error:", error);
      setState("error");
    }
  }

  function handleMainClick() {
    if (locale === "ar") {
      setShowArNotice(true);
      return;
    }
    void runDownload("en");
  }

  async function handleDownloadEnglishFromNotice() {
    setShowArNotice(false);
    setLanguage("en");
    await runDownload("en");
  }

  return (
    <>
      <button
        className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-cyan-300/30 bg-cyan-400 px-6 font-bold text-slate-950 shadow-2xl shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        disabled={state === "loading"}
        onClick={handleMainClick}
        type="button"
      >
        {state === "loading" ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
        ) : null}
        {buttonText}
      </button>

      {showArNotice ? (
        <ArabicPdfNoticeModal
          downloading={state === "loading"}
          onClose={() => setShowArNotice(false)}
          onDownloadEnglish={() => {
            void handleDownloadEnglishFromNotice();
          }}
        />
      ) : null}
    </>
  );
}

function ArabicPdfNoticeModal({
  onClose,
  onDownloadEnglish,
  downloading,
}: {
  onClose: () => void;
  onDownloadEnglish: () => void;
  downloading: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-cyan-400/25 bg-slate-950/95 p-6 text-right shadow-xl shadow-cyan-500/10 backdrop-blur-sm"
        dir="rtl"
        role="dialog"
        aria-labelledby="ar-pdf-notice-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/15 text-cyan-600 dark:border-cyan-400/35 dark:bg-cyan-400/10 dark:text-cyan-300"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h3
              id="ar-pdf-notice-title"
              className="text-lg font-semibold text-slate-900 dark:text-white"
            >
              تقارير PDF العربية قيد التحسين
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              نعمل حالياً على تحسين جودة العرض في التقارير العربية.
              يمكنك تحميل التقرير باللغة الإنجليزية في الوقت الحالي،
              أو الاكتفاء بعرض نتائج الفحص في المتصفح.
            </p>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300/40 bg-transparent px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/60"
            onClick={onClose}
            type="button"
          >
            إغلاق
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/15 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={downloading}
            onClick={onDownloadEnglish}
            type="button"
          >
            {downloading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
            ) : null}
            تحميل التقرير بالإنجليزية
          </button>
        </div>
      </div>
    </div>
  );
}
