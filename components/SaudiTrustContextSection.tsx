"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { deriveSaudiSignals } from "@/lib/saudiTrustContext";
import {
  SAUDI_CONTEXT_SECTION,
  SAUDI_REPORTING_LINE,
  SAUDI_TLD_COPY,
} from "@/lib/saudiTrustCopy";
import type { EmailTrustIntelligence } from "@/lib/types";

export function SaudiTrustContextSection({
  domain,
  emailTrust,
}: {
  domain: string;
  emailTrust?: EmailTrustIntelligence;
}) {
  const { language } = useLanguage();
  const signals = deriveSaudiSignals({ domain, emailTrust });

  if (!signals.hasSaudiContext) {
    return null;
  }

  const dir = language === "ar" ? "rtl" : "ltr";

  // Supporting observations follow the context line. Order: TLD, then the
  // Haseen reference line (a context reference — NOT the Email section chip).
  const observations: string[] = [];
  if (signals.tld !== "none") {
    observations.push(SAUDI_TLD_COPY[signals.tld][language]);
  }
  if (signals.hasHaseenSignal) {
    observations.push(SAUDI_REPORTING_LINE[language]);
  }

  return (
    <section
      role="region"
      aria-label={SAUDI_CONTEXT_SECTION.title[language]}
      className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-4 shadow-2xl shadow-cyan-500/5 min-[390px]:p-5 sm:bg-slate-950/80 md:p-7"
    >
      <p
        dir={dir}
        className="bidi-safe text-start text-xs font-semibold uppercase tracking-wider text-cyan-300/80"
      >
        {SAUDI_CONTEXT_SECTION.kicker[language]}
      </p>
      <h3
        dir={dir}
        className="bidi-safe mt-2 break-words text-start text-xl font-bold text-white min-[390px]:text-2xl"
      >
        {SAUDI_CONTEXT_SECTION.title[language]}
      </h3>

      <p
        dir={dir}
        className="bidi-safe mt-3 break-words text-start text-sm leading-6 text-slate-300"
      >
        {SAUDI_CONTEXT_SECTION.contextLine[language]}
      </p>

      {observations.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {observations.map((line, idx) => (
            <li
              key={idx}
              dir={dir}
              className="bidi-safe break-words text-start text-xs leading-5 text-slate-400"
            >
              • {line}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
