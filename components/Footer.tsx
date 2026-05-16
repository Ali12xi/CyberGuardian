"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

const PRIVACY_LABELS = {
  en: "Privacy & Usage",
  ar: "الخصوصية والاستخدام",
} as const;

export default function Footer() {
  const { language, t } = useLanguage();

  return (
    <footer className="mt-auto px-2 pb-2 pt-6 text-center text-xs text-slate-500 dark:text-slate-400 sm:dark:text-slate-500">
      <div className="mx-auto mb-4 h-px max-w-xl overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div className="h-full w-1/2 animate-pulse bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent rtl:bg-gradient-to-l" />
      </div>
      <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
        <span className="font-semibold text-slate-600 dark:text-slate-300 sm:dark:text-slate-400">
          {t.footerEngineeredBy}
        </span>
        <span className="hidden h-1 w-1 rounded-full bg-cyan-400/50 sm:block" />
        <span>{t.footerVersion}</span>
        <span className="hidden h-1 w-1 rounded-full bg-cyan-400/50 sm:block" />
        <span>{t.footerCopyright}</span>
        <span className="hidden h-1 w-1 rounded-full bg-cyan-400/50 sm:block" />
        <Link
          className="text-slate-500 transition hover:text-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
          href={`/${language}/privacy`}
        >
          {PRIVACY_LABELS[language]}
        </Link>
      </div>
    </footer>
  );
}
