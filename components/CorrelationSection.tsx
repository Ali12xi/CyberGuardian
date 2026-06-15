"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { deriveCorrelation } from "@/lib/correlation";
import { CORRELATION_SECTION, LAYER_LABELS } from "@/lib/correlationCopy";
import type { ScanResult } from "@/lib/types";

export function CorrelationSection({ result }: { result: ScanResult }) {
  const { language } = useLanguage();
  const correlation = deriveCorrelation(result);

  if (!correlation.hasCorrelation) {
    return null;
  }

  const dir = language === "ar" ? "rtl" : "ltr";

  return (
    <section
      role="region"
      aria-label={CORRELATION_SECTION.title[language]}
      className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-4 shadow-2xl shadow-cyan-500/5 min-[390px]:p-5 sm:bg-slate-950/80 md:p-7"
    >
      <p
        dir={dir}
        className="bidi-safe text-start text-xs font-semibold uppercase tracking-wider text-cyan-300/80"
      >
        {CORRELATION_SECTION.kicker[language]}
      </p>
      <h3
        dir={dir}
        className="bidi-safe mt-2 break-words text-start text-xl font-bold text-white min-[390px]:text-2xl"
      >
        {CORRELATION_SECTION.title[language]}
      </h3>

      <p
        dir={dir}
        className="bidi-safe mt-3 break-words text-start text-sm leading-6 text-slate-300"
      >
        {CORRELATION_SECTION.intro[language]}
      </p>

      <ul className="mt-3 space-y-2">
        {correlation.layers.map((layer) => (
          <li
            key={layer}
            dir={dir}
            className="bidi-safe break-words text-start text-xs leading-5 text-slate-400"
          >
            • {LAYER_LABELS[layer][language]}
          </li>
        ))}
      </ul>
    </section>
  );
}
