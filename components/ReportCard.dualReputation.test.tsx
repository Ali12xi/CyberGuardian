import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { getReputationExplanation } from "@/lib/domainSignals";
import type { ReputationResult, ScanResult } from "@/lib/types";

vi.mock("@/components/LanguageProvider", () => ({
  useLanguage: () => ({ language: "en" }),
}));

const DUAL_REPUTATION_COPY = {
  vendorLabel: {
    en: "Vendor Reputation (VirusTotal)",
    ar: "سمعة المورد (VirusTotal)",
  },
  heuristicLabel: {
    en: "Domain Pattern Analysis",
    ar: "تحليل أنماط النطاق",
  },
  vendorVerdicts: {
    clean: { en: "Clean", ar: "نظيف" },
    suspicious: { en: "Suspicious", ar: "مشبوه" },
    malicious: { en: "Malicious", ar: "ضار" },
    unknown: { en: "Unknown", ar: "غير معروف" },
  },
} as const;

function DualReputationFixture({
  vendorReputation,
  heuristicReputation,
  vendorEngineLine,
}: {
  vendorReputation: ReputationResult | null;
  heuristicReputation: ScanResult["intelligence"]["reputation"];
  vendorEngineLine: string | null;
}) {
  const language = "en" as const;
  const heuristicResult = {
    intelligence: { reputation: heuristicReputation },
  } as ScanResult;

  return (
    <div>
      {vendorReputation && vendorEngineLine ? (
        <div data-testid="vendor-row">
          <p>
            {DUAL_REPUTATION_COPY.vendorLabel[language]}:{" "}
            {DUAL_REPUTATION_COPY.vendorVerdicts[vendorReputation.verdict][language]}
          </p>
          <p>{vendorEngineLine}</p>
        </div>
      ) : null}
      <div data-testid="heuristic-row">
        <p>
          {DUAL_REPUTATION_COPY.heuristicLabel[language]}: {heuristicReputation}
        </p>
        <p>{getReputationExplanation(heuristicResult, language)}</p>
      </div>
    </div>
  );
}

describe("Dual Reputation Display (Sprint 3 Day 5)", () => {
  it("hides vendor row when result.reputation is null", () => {
    const html = renderToStaticMarkup(
      <DualReputationFixture
        heuristicReputation="neutral"
        vendorEngineLine={null}
        vendorReputation={null}
      />,
    );
    expect(html).not.toContain("Vendor Reputation (VirusTotal)");
    expect(html).toContain("Domain Pattern Analysis");
    expect(html).toContain("local heuristics");
  });

  it("renders vendor row first with engine audit line when vendor data present", () => {
    const vendorReputation: ReputationResult = {
      malicious: 0,
      suspicious: 0,
      harmless: 91,
      undetected: 0,
      reputation: 0,
      totalVendors: 91,
      verdict: "clean",
    };
    const html = renderToStaticMarkup(
      <DualReputationFixture
        heuristicReputation="neutral"
        vendorEngineLine="91 engines checked — clean"
        vendorReputation={vendorReputation}
      />,
    );
    expect(html.indexOf("Vendor Reputation (VirusTotal)")).toBeLessThan(
      html.indexOf("Domain Pattern Analysis"),
    );
    expect(html).toContain("Clean");
    expect(html).toContain("91 engines checked — clean");
    expect(html).not.toMatch(/%/);
  });

  it("vendor verdict labels are bilingual", () => {
    expect(DUAL_REPUTATION_COPY.vendorVerdicts.clean.en).toBe("Clean");
    expect(DUAL_REPUTATION_COPY.vendorVerdicts.clean.ar).toBe("نظيف");
    expect(DUAL_REPUTATION_COPY.vendorVerdicts.malicious.ar).toBe("ضار");
  });
});
