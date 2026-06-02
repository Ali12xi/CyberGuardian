"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { explainConfidence, getConfidenceLabel } from "@/lib/confidence/semantics";
import type { ConfidenceContext, ConfidenceReport } from "@/lib/confidence/types";

const TIER_1_STATES = ["masked", "partial", "hidden"] as const;

const PANEL_COPY = {
  title: {
    en: "What We Could Verify",
    ar: "ما تمكنّا من التحقق منه",
  },
  allObserved: {
    en: "Full visibility on scanned surface — all dimensions observed directly.",
    ar: "رؤية كاملة على سطح الفحص — جميع الأبعاد تمت مراقبتها مباشرة.",
  },
  inferredHeader: {
    en: "Additional inferred analysis:",
    ar: "تحليلات استنتاجية إضافية:",
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

  const tier1Contexts = DISPLAY_ORDER.filter((ctx) =>
    TIER_1_STATES.includes(report[ctx].state as (typeof TIER_1_STATES)[number]),
  );

  const tier2Contexts = DISPLAY_ORDER.filter((ctx) => report[ctx].state === "inferred");

  const showCompactReassurance = tier1Contexts.length === 0 && tier2Contexts.length === 0;

  return (
    <section
      role="status"
      className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-5 md:p-6"
      aria-label={PANEL_COPY.title[language]}
    >
      <h3 className="bidi-safe text-start text-base font-semibold text-white/90">
        {PANEL_COPY.title[language]}
      </h3>

      {showCompactReassurance ? (
        <p className="bidi-safe mt-2 text-start text-sm text-slate-400">
          {PANEL_COPY.allObserved[language]}
        </p>
      ) : null}

      {tier1Contexts.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {tier1Contexts.map((ctx) => {
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
      ) : null}

      {tier2Contexts.length > 0 ? (
        <div className={tier1Contexts.length > 0 ? "mt-4 border-t border-white/5 pt-3" : "mt-3"}>
          <p className="bidi-safe text-start text-xs text-slate-300">
            {PANEL_COPY.inferredHeader[language]}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            {tier2Contexts.map((ctx, idx) => {
              const contextLabel = PANEL_COPY.contextLabels[ctx];

              return (
                <span
                  key={ctx}
                  className="bidi-safe inline-flex items-center text-xs text-slate-300"
                >
                  {idx > 0 ? <span className="me-2 text-slate-500 opacity-50">·</span> : null}
                  {contextLabel[language]}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
