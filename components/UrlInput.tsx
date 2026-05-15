"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import type { AnalyzeApiResponse, AnalyzeOkPayload } from "@/lib/types";

type UrlInputProps = {
  onScanStart: () => void;
  onScanComplete: (payload: AnalyzeOkPayload) => void;
  onLoadingChange: (loading: boolean) => void;
};

export default function UrlInput({
  onScanStart,
  onScanComplete,
  onLoadingChange,
}: UrlInputProps) {
  const { language, t } = useLanguage();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!url.trim()) {
      setError(t.emptyUrl);
      return;
    }

    setLoading(true);
    onLoadingChange(true);
    setError("");
    onScanStart();

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      const data = (await response.json()) as AnalyzeApiResponse;

      if (!response.ok || !data.ok) {
        setError(data.ok ? t.networkError : data.error[language]);
        return;
      }

      onScanComplete({
        result: data.result,
        scanId: data.scanId,
        scanToken: data.scanToken,
      });
    } catch {
      setError(t.networkError);
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  }

  return (
    <form
      className="w-full rounded-3xl border border-cyan-400/[0.16] bg-white/90 p-4 shadow-xl shadow-cyan-950/[0.06] backdrop-blur-sm transition dark:bg-slate-950/85 dark:shadow-cyan-500/[0.035] min-[390px]:p-5 sm:bg-white/80 sm:backdrop-blur sm:dark:bg-slate-950/75"
      dir={language === "ar" ? "rtl" : "ltr"}
      onSubmit={handleSubmit}
    >
      <label
        className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
        htmlFor="url"
      >
        {t.urlLabel}
      </label>
      {/* LTR row: keeps URL field + primary button in stable physical positions for all locales */}
      <div className="flex min-w-0 flex-col gap-3 md:flex-row" dir="ltr">
        <input
          className="min-h-12 min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white/30 px-4 text-start text-sm text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-white/50 focus:ring-2 focus:ring-cyan-400/[0.16] disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-950/60 min-[390px]:text-base"
          id="url"
          name="url"
          onChange={(event) => setUrl(event.target.value)}
          placeholder={t.urlPlaceholder}
          type="url"
          value={url}
          dir="ltr"
          disabled={loading}
        />
        <button
          className="inline-flex min-h-12 w-full min-w-[44px] items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-6 font-semibold text-slate-950 shadow-lg shadow-cyan-500/[0.12] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
              {t.scanning}
            </>
          ) : (
            t.analyze
          )}
        </button>
      </div>
      {error ? (
        <div
          className="bidi-safe mt-4 overflow-hidden rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-start text-sm leading-7 text-red-700 transition dark:text-red-200"
          role="alert"
        >
          <p>{error}</p>
        </div>
      ) : null}
    </form>
  );
}
