"use client";

import AnalyzePanel from "@/components/AnalyzePanel";
import { useLanguage } from "@/components/LanguageProvider";
import PublicShell from "@/components/PublicShell";

export default function HomeShell() {
  const { t } = useLanguage();

  return (
    <PublicShell>
      <section className="relative isolate mx-auto w-full max-w-3xl overflow-hidden rounded-[2rem] px-3 py-3 text-balance text-center sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute inset-0 z-0 rounded-[2rem] opacity-20 [background-image:linear-gradient(rgba(34,211,238,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.14)_1px,transparent_1px)] [background-size:34px_34px] dark:opacity-[0.14]" />
        <div className="pointer-events-none absolute inset-x-10 top-0 z-0 h-px bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent rtl:bg-gradient-to-l" />
        <p
          className="relative z-10 mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.045] px-3 py-1 text-[0.68rem] font-semibold text-cyan-700 shadow-sm shadow-cyan-500/[0.02] dark:text-cyan-100 sm:mb-5"
          dir="ltr"
        >
          <span className="rounded-full bg-cyan-300/[0.08] px-2 py-0.5 font-black tracking-[0.1em] text-cyan-700 dark:text-cyan-100" dir="ltr">
            {t.heroVersion}
          </span>
          <span className="bidi-safe" dir="auto">
            {t.heroVersionLabel}
          </span>
        </p>
        <h1 className="relative z-10 text-[1.7rem] font-black leading-tight tracking-[-0.035em] text-slate-950 transition dark:text-white min-[390px]:text-3xl sm:text-4xl lg:text-5xl">
          {t.heroTitle}
        </h1>
        <p className="bidi-safe relative z-10 mx-auto mt-4 max-w-2xl whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300/90 min-[390px]:text-base sm:mt-5 sm:text-lg sm:leading-8">
          {t.heroSubtitle}
        </p>
      </section>

      <AnalyzePanel />
    </PublicShell>
  );
}
