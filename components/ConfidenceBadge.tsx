"use client";

import type { ConfidenceExplanation, ConfidenceLabel } from "@/lib/confidence/types";

type ConfidenceBadgeProps = {
  label: ConfidenceLabel;
  explanation: ConfidenceExplanation;
  language: "en" | "ar";
};

export function ConfidenceBadge({ label, explanation, language }: ConfidenceBadgeProps) {
  return (
    <div
      role="status"
      className="inline-flex items-center gap-2 text-xs"
      aria-label={label[language]}
    >
      <span className="font-medium opacity-75">{label[language]}</span>
      <span className="cursor-help text-[0.7rem] opacity-60" title={explanation[language]}>
        ⓘ
      </span>
    </div>
  );
}
