"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  const nextLanguage = language === "en" ? "ar" : "en";

  return (
    <button
      className="min-h-10 rounded-full border border-cyan-400/30 bg-slate-950/90 px-3 py-2 text-sm font-semibold text-cyan-50 shadow-lg shadow-cyan-500/10 transition hover:border-cyan-300 hover:bg-cyan-400/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 min-[390px]:px-4 sm:bg-slate-950/80 sm:text-cyan-100"
      onClick={() => setLanguage(nextLanguage)}
      type="button"
    >
      {t.languageToggle}
    </button>
  );
}
