"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  const nextLanguage = language === "en" ? "ar" : "en";

  return (
    <button
      className="rounded-full border border-cyan-400/30 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-lg shadow-cyan-500/10 transition hover:border-cyan-300 hover:bg-cyan-400/10"
      onClick={() => setLanguage(nextLanguage)}
      type="button"
    >
      {t.languageToggle}
    </button>
  );
}
