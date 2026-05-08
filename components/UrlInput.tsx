"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import type { AnalyzeApiResponse, ScanResult } from "@/lib/types";

type UrlInputProps = {
  onScanStart: () => void;
  onScanComplete: (result: ScanResult) => void;
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

      onScanComplete(data.result);
    } catch {
      setError(t.networkError);
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  }

  return (
    <form
      className="w-full rounded-3xl border border-cyan-400/20 bg-white/80 p-4 shadow-2xl shadow-cyan-950/10 backdrop-blur transition dark:bg-slate-950/80 dark:shadow-cyan-500/5 min-[390px]:p-5"
      onSubmit={handleSubmit}
    >
      <label
        className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
        htmlFor="url"
      >
        {t.urlLabel}
      </label>
      <div className="flex min-w-0 flex-col gap-3 md:flex-row">
        <input
          className="min-h-12 min-w-0 flex-1 rounded-2xl border border-slate-300 bg-transparent px-4 text-sm text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:text-white min-[390px]:text-base"
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
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-6 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
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
