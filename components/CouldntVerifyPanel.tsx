"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { explainConfidence, getConfidenceLabel } from "@/lib/confidence/semantics";
import type { ConfidenceContext, ConfidenceReport } from "@/lib/confidence/types";

const PANEL_COPY = {
  title: {
    en: "What We Could Verify",
    ar: "ما تمكنّا من التحقق منه",
  },
  allObserved: {
    en: "Full visibility on scanned surface — all dimensions observed directly.",
    ar: "رؤية كاملة على سطح الفحص — جميع الأبعاد تمت مراقبتها مباشرة.",
  },
  contextLabels: {
    headers: { en: "Security Headers", ar: "رؤوس الأمان" },
    server: { en: "Server", ar: "الخادم" },
    infrastructure: { en: "Infrastructure", ar: "البنية التحتية" },
    reputationVendor: { en: "Vendor Reputation", ar: "سمعة المورد" },
    reputationHeuristic: { en: "Domain Signals", ar: "إشارات النطاق" },
    tls: { en: "TLS", ar: "TLS" },
    redirectChain: { en: "Redirect Chain", ar: "سلسلة التوجيه" },
    redirectIntent: { en: "Redirect Intent", ar: "نية التوجيه" },
  },
} as const;

const DISPLAY_ORDER: ConfidenceContext[] = [
  "headers",
  "tls",
  "redirectChain",
  "server",
  "infrastructure",
  "reputationVendor",
  "reputationHeuristic",
  "redirectIntent",
];

type CouldntVerifyPanelProps = {
  report: ConfidenceReport;
};

export function CouldntVerifyPanel({ report }: CouldntVerifyPanelProps) {
  const { language } = useLanguage();

  const nonObservedDimensions = DISPLAY_ORDER.filter((ctx) => report[ctx].state !== "observed");

  const allObserved = nonObservedDimensions.length === 0;

  return (
    <section
      role="status"
      className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-5 md:p-6"
      aria-label={PANEL_COPY.title[language]}
    >
      <h3 className="bidi-safe text-start text-base font-semibold text-white/90">
        {PANEL_COPY.title[language]}
      </h3>

      {allObserved ? (
        <p className="bidi-safe mt-2 text-start text-sm text-slate-400">
          {PANEL_COPY.allObserved[language]}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {nonObservedDimensions.map((ctx) => {
            const dim = report[ctx];
            const stateLabel = getConfidenceLabel(dim.state);
            const explanation = explainConfidence(ctx, dim);
            const contextLabel = PANEL_COPY.contextLabels[ctx];

            return (
              <li
                key={ctx}
                className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <span className="bidi-safe block text-start font-medium text-white/90">
                    {contextLabel[language]}
                  </span>
                  <span className="bidi-safe mt-1 block text-start text-xs text-slate-400">
                    {explanation[language]}
                  </span>
                </div>
                <span
                  className="shrink-0 text-xs font-medium text-white/70"
                  aria-label={stateLabel[language]}
                >
                  {stateLabel[language]}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
