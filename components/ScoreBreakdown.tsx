"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { calculateCategoryScores, type CategoryColor, type ScoreCategory } from "@/lib/categoryScores";
import type { ScanResult } from "@/lib/types";

function CategoryGlyph({ icon, className }: { icon: string; className?: string }) {
  const cn = `h-5 w-5 shrink-0 ${className ?? ""}`;

  switch (icon) {
    case "ti-lock":
      return (
        <svg aria-hidden className={cn} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <path d="M5 13a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 16a1 1 0 102 0 1 1 0 00-2 0" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 11V7a4 4 0 118 0v4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "ti-shield-check":
      return (
        <svg aria-hidden className={cn} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <path d="M12 3l7 4v5c0 5-3.5 9-7 11-3.5-2-7-6-7-11V7l7-4z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "ti-server":
      return (
        <svg aria-hidden className={cn} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <path d="M4 6h16v4H4V6zM4 14h16v4H4v-4z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 8h.01M7 16h.01" strokeLinecap="round" />
        </svg>
      );
    case "ti-circle-check":
      return (
        <svg aria-hidden className={cn} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <path d="M12 21a9 9 0 100-18 9 9 0 000 18z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "ti-arrow-right":
      return (
        <svg aria-hidden className={cn} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return <span aria-hidden className={cn} />;
  }
}

function colorStyles(color: CategoryColor): {
  bar: string;
  border: string;
  icon: string;
} {
  if (color === "green") {
    return {
      bar: "bg-gradient-to-r from-emerald-500 to-emerald-400",
      border: "border-emerald-400/25",
      icon: "text-emerald-300",
    };
  }
  if (color === "amber") {
    return {
      bar: "bg-gradient-to-r from-amber-500 to-amber-400",
      border: "border-amber-400/25",
      icon: "text-amber-200",
    };
  }
  return {
    bar: "bg-gradient-to-r from-red-600 to-red-500",
    border: "border-red-400/35",
    icon: "text-red-300",
  };
}

function CategoryCard({ category, language }: { category: ScoreCategory; language: "en" | "ar" }) {
  const label = language === "ar" ? category.labelAr : category.labelEn;
  const note = language === "ar" ? category.noteAr : category.noteEn;
  const tooltip = language === "ar" ? category.tooltipAr : category.tooltipEn;
  const styles = colorStyles(category.color);
  const width = `${Math.max(0, Math.min(100, category.score))}%`;

  return (
    <div
      className={`min-w-0 rounded-2xl border bg-slate-950/60 p-3 shadow-inner transition hover:border-cyan-300/20 sm:p-4 ${styles.border}`}
      title={tooltip}
    >
      <div className="flex items-start gap-2">
        <CategoryGlyph className={styles.icon} icon={category.icon} />
        <div className="min-w-0 flex-1">
          <p className="bidi-safe text-start text-xs font-bold leading-5 text-slate-100 sm:text-sm">{label}</p>
          <p className="mt-2 text-end font-black tabular-nums text-lg leading-none text-white sm:text-xl" dir="ltr">
            {category.score}
            <span className="ms-0.5 text-xs font-bold text-slate-400">%</span>
          </p>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10" dir="ltr">
        <div className={`h-full rounded-full ${styles.bar}`} style={{ width }} />
      </div>

      <p
        className="bidi-safe mt-2 text-start text-[11px] leading-5 text-slate-400 sm:text-xs sm:leading-5"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {note}
      </p>
    </div>
  );
}

function Legend() {
  const { t } = useLanguage();

  return (
    <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-start">
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] leading-5 text-slate-400 sm:text-xs">
        <span className="text-emerald-300/90">{t.scoreBreakdownLegendGood}</span>
        <span className="text-amber-200/90">{t.scoreBreakdownLegendNeeds}</span>
        <span className="text-red-300/90">{t.scoreBreakdownLegendDanger}</span>
      </div>
      <p className="bidi-safe max-w-4xl text-[11px] leading-5 text-slate-500 sm:text-xs">{t.scoreBreakdownLegendFootnote}</p>
    </div>
  );
}

export function ScoreBreakdown({ result }: { result: ScanResult }) {
  const { language, t } = useLanguage();
  const categories = useMemo(() => calculateCategoryScores(result), [result]);

  return (
    <section className="w-full min-w-0 rounded-[2rem] border border-white/10 bg-slate-950/90 p-4 shadow-2xl shadow-cyan-500/5 sm:bg-slate-950/80 sm:p-5 md:p-7">
      <div className="min-w-0 text-start">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-300 sm:tracking-[0.25em]">
          {t.scoreBreakdownKicker}
        </p>
        <h3 className="bidi-safe mt-2 break-words text-xl font-bold text-white min-[390px]:text-2xl">
          {t.scoreBreakdownTitle}
        </h3>
        <p className="bidi-safe mt-2 max-w-3xl text-sm leading-7 text-slate-400">{t.scoreBreakdownSubtitle}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-3">
        {categories.map((cat) => (
          <CategoryCard category={cat} key={cat.id} language={language} />
        ))}
      </div>

      <Legend />
    </section>
  );
}
