"use client";

import AnalyzePanel from "@/components/AnalyzePanel";
import { useLanguage } from "@/components/LanguageProvider";
import PublicShell from "@/components/PublicShell";

export default function HomeShell() {
  const { t } = useLanguage();

  return (
    <PublicShell>
      <section className="mx-auto w-full max-w-3xl space-y-3 px-1 text-balance text-center sm:space-y-4 sm:px-0">
        <h1 className="text-[1.7rem] font-black leading-tight tracking-tight text-slate-950 transition dark:text-white min-[390px]:text-3xl sm:text-4xl lg:text-5xl">
          {t.heroTitle}
        </h1>
        <p className="bidi-safe mx-auto max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 min-[390px]:text-base sm:text-lg sm:leading-8">
          {t.heroSubtitle}
        </p>
      </section>

      <AnalyzePanel />
    </PublicShell>
  );
}
