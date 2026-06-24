"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { getSignalLabels } from "@/lib/signalLabels";
import type { InfrastructureDetection } from "@/lib/types";

const SECTION_COPY = {
  kicker: {
    en: "🔍 Detection Signals",
    ar: "🔍 إشارات الاكتشاف",
  },
  title: {
    en: "Detection Signals",
    ar: "إشارات الاكتشاف",
  },
  subtitle: {
    en: "Passive patterns supporting infrastructure inference — not direct origin confirmation.",
    ar: "أنماط سلبية تدعم استنتاج البنية التحتية — وليس تأكيدًا مباشرًا للمصدر.",
  },
  categories: {
    cdn: { en: "CDN", ar: "شبكة توصيل المحتوى" },
    cloud: { en: "Cloud", ar: "سحابة" },
    hosting: { en: "Hosting", ar: "استضافة" },
    waf: { en: "WAF", ar: "جدار حماية التطبيقات" },
    reverseProxy: { en: "Reverse Proxy", ar: "وكيل عكسي" },
    framework: { en: "Framework", ar: "إطار عمل" },
    asn: { en: "Network (ASN)", ar: "شبكة (ASN)" },
    ipOwner: { en: "IP Owner", ar: "مالك IP" },
    server: { en: "Server", ar: "خادم" },
  },
  moreSignals: {
    en: (n: number) => `+ ${n} additional signal patterns`,
    ar: (n: number) => `+ ${n} نمط إشارات إضافي`,
  },
} as const;

const CATEGORY_PRIORITY: InfrastructureDetection["category"][] = [
  "cdn",
  "waf",
  "reverseProxy",
  "cloud",
  "hosting",
  "framework",
  "server",
  "asn",
  "ipOwner",
];

const MAX_VENDORS_SHOWN = 5;

type VendorGroup = {
  name: string;
  categories: InfrastructureDetection["category"][];
  signals: string[];
  sortScore: number;
};

function dedupeByVendor(detections: InfrastructureDetection[]): VendorGroup[] {
  const groups = new Map<string, VendorGroup>();

  for (const det of detections) {
    const existing = groups.get(det.name);
    if (existing) {
      if (!existing.categories.includes(det.category)) {
        existing.categories.push(det.category);
      }
      for (const sig of det.signals) {
        if (!existing.signals.includes(sig)) {
          existing.signals.push(sig);
        }
      }
      if (det.confidence > existing.sortScore) {
        existing.sortScore = det.confidence;
      }
    } else {
      groups.set(det.name, {
        name: det.name,
        categories: [det.category],
        signals: [...det.signals],
        sortScore: det.confidence,
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (b.sortScore !== a.sortScore) {
      return b.sortScore - a.sortScore;
    }
    const aIdx = Math.min(...a.categories.map((c) => CATEGORY_PRIORITY.indexOf(c)));
    const bIdx = Math.min(...b.categories.map((c) => CATEGORY_PRIORITY.indexOf(c)));
    return aIdx - bIdx;
  });
}

type DetectionSignalsSectionProps = {
  detections: InfrastructureDetection[];
};

export function DetectionSignalsSection({ detections }: DetectionSignalsSectionProps) {
  const { language } = useLanguage();

  if (!detections || detections.length === 0) {
    return null;
  }

  const grouped = dedupeByVendor(detections);

  if (grouped.length === 0) {
    return null;
  }

  const visible = grouped.slice(0, MAX_VENDORS_SHOWN);
  const hidden = grouped.length - MAX_VENDORS_SHOWN;

  return (
    <section
      role="region"
      aria-label={SECTION_COPY.title[language]}
      className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-4 min-[390px]:p-5 sm:bg-slate-950/80 md:p-7"
    >
      <p className="bidi-safe text-start text-xs font-semibold uppercase tracking-wider text-cyan-300/80">
        {SECTION_COPY.kicker[language]}
      </p>
      <h3 className="bidi-safe mt-2 text-start text-xl font-bold text-white">
        {SECTION_COPY.title[language]}
      </h3>
      <p className="bidi-safe mt-2 text-start text-xs text-slate-400">
        {SECTION_COPY.subtitle[language]}
      </p>

      <ul className="mt-5 space-y-3">
        {visible.map((group) => {
          const labels = getSignalLabels(group.signals);
          const categoryLabels = group.categories
            .map((c) => SECTION_COPY.categories[c][language])
            .join(" · ");

          return (
            <li
              key={group.name}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-3 sm:p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span dir="ltr" className="text-sm font-semibold text-white/90">
                  {group.name}
                </span>
                <span className="bidi-safe text-xs text-slate-400">{categoryLabels}</span>
              </div>
              <ul className="mt-2 space-y-1">
                {labels.map((label, idx) => (
                  <li key={idx} className="bidi-safe text-start text-xs text-slate-300">
                    • {label[language]}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>

      {hidden > 0 ? (
        <p className="bidi-safe mt-3 text-start text-xs text-slate-500">
          {SECTION_COPY.moreSignals[language](hidden)}
        </p>
      ) : null}
    </section>
  );
}
