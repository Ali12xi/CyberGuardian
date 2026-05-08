"use client";

import AnalyzePanel from "@/components/AnalyzePanel";
import { useLanguage } from "@/components/LanguageProvider";
import PublicShell from "@/components/PublicShell";

export default function HomeShell() {
  const { t } = useLanguage();

  return (
    <PublicShell>
      <section className="mx-auto max-w-3xl space-y-3 text-balance text-center sm:space-y-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-950 transition dark:text-white min-[390px]:text-3xl sm:text-4xl lg:text-5xl">
          {t.heroTitle}
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
          {t.heroSubtitle}
        </p>
      </section>

      <AnalyzePanel />
    </PublicShell>
  );
}
