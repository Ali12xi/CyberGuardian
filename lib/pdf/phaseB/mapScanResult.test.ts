import { describe, it, expect } from "vitest";
import { mapScanResult, type ScanResultForPdf } from "@/lib/pdf/phaseB/mapScanResult";

const baseResult = {
  score: 75,
  grade: "B" as const,
  threatLevel: "low" as const,
  deterministicHash: "abc123",
  intelligence: { domain: "example.com" },
  technologies: [],
  findings: [],
  meta: {
    finalUrl: "https://example.com",
    scanTimestamp: "2024-01-01T00:00:00Z",
    stages: {},
  },
  ssl: { protocol: "TLSv1.3" },
  infrastructure: {
    hostingProvider: "aws",
    cloudProvider: "aws",
    reverseProxy: "",
    framework: "",
    waf: "aws-waf",
    cdn: "cloudfront",
    detections: [],
    serverExposureScore: 25,
  },
  observableCoverage: { overall: "full" as const },
  scoreBreakdown: { positives: [] },
} as unknown as ScanResultForPdf;

function findingsFixture(count: number): ScanResultForPdf {
  const severities = ["critical", "high", "medium", "low", "informational"] as const;
  const findings = Array.from({ length: count }, (_, i) => ({
    severity: severities[i % severities.length],
    message: { en: `Finding ${i}`, ar: `نتيجة ${i}` },
  }));

  return { ...baseResult, findings } as unknown as ScanResultForPdf;
}

describe("mapScanResult — semantic projection contract", () => {
  it("Core report fields are present in mapped output", () => {
    const result = mapScanResult(baseResult);

    expect(result.domain).toBeDefined();
    expect(result.grade).toBeDefined();
    expect(result.maxScore).toBe(95);
    expect(typeof result.score).toBe("number");
    expect(result.timestampUtc).toBeDefined();
    expect(result.threatPillLabel).toBeDefined();
    expect(typeof result.overviewSummaryEn).toBe("string");
    expect(result.overviewSummaryEn.length).toBeGreaterThan(0);
    expect(typeof result.overviewSummaryAr).toBe("string");
    expect(result.overviewSummaryAr.length).toBeGreaterThan(0);
  });

  it("Bilingual En/Ar pairs are both non-empty (structural, not content)", () => {
    const result = mapScanResult(baseResult);

    const pairs = [
      ["overviewSummaryEn", "overviewSummaryAr"],
      ["visibilityEn", "visibilityAr"],
      ["infraCdnEn", "infraCdnAr"],
      ["exposureEn", "exposureAr"],
    ] as const;

    for (const [enKey, arKey] of pairs) {
      expect(typeof result[enKey]).toBe("string");
      expect((result[enKey] as string).length).toBeGreaterThan(0);
      expect(typeof result[arKey]).toBe("string");
      expect((result[arKey] as string).length).toBeGreaterThan(0);
    }
  });

  it("scoreRows is an array; rows preserve label/score/note shape when present", () => {
    const result = mapScanResult(baseResult);

    expect(Array.isArray(result.scoreRows)).toBe(true);
    for (const row of result.scoreRows) {
      expect(typeof row.labelEn).toBe("string");
      expect(typeof row.labelAr).toBe("string");
      expect(typeof row.score).toBe("number");
      expect(typeof row.noteEn).toBe("string");
      expect(typeof row.noteAr).toBe("string");
    }
  });

  it("Export metadata reflects input pdfScanId/pdfScanToken or fallback dash", () => {
    const inputA = {
      ...baseResult,
      pdfScanId: "scan-abc",
      pdfScanToken: "token-xyz",
    } as unknown as ScanResultForPdf;
    const inputB = { ...baseResult } as unknown as ScanResultForPdf;

    const a = mapScanResult(inputA);
    const b = mapScanResult(inputB);

    expect(a.scanId).toBe("scan-abc");
    expect(a.scanToken).toBe("token-xyz");
    expect(b.scanId).toBe("-");
    expect(b.scanToken).toBe("-");
  });

  it("Distinct threat levels produce distinct visuals (no flat differentiation)", () => {
    const lowFixture = { ...baseResult, threatLevel: "low" } as unknown as ScanResultForPdf;
    const highFixture = { ...baseResult, threatLevel: "high" } as unknown as ScanResultForPdf;

    const low = mapScanResult(lowFixture);
    const high = mapScanResult(highFixture);

    expect(low.threatPillLabel).toBeDefined();
    expect(high.threatPillLabel).toBeDefined();
    expect(low.threatAccentColor).not.toBe(high.threatAccentColor);
    expect(low.threatPillLabel).not.toBe(high.threatPillLabel);
  });

  it("Findings map to severity-labeled lines respecting the 4-line cap", () => {
    const result = mapScanResult(findingsFixture(5));

    expect(result.attackLines.length).toBeLessThanOrEqual(4);
    for (const line of result.attackLines) {
      expect(typeof line.severityLabel).toBe("string");
      expect(line.severityLabel).toBe(line.severityLabel.toUpperCase());
    }
  });

  it("Zero findings yields empty arrays without throwing, summary still populated", () => {
    const input = { ...baseResult, findings: [] } as unknown as ScanResultForPdf;

    expect(() => mapScanResult(input)).not.toThrow();

    const result = mapScanResult(input);

    expect(result.attackLines).toEqual([]);
    expect(result.actionLines).toEqual([]);
    expect(result.compactPlanOnPage3).toBe(true);
    expect(result.compactPlanRows).toEqual([]);
    expect(result.planChunks).toEqual([]);
    expect(typeof result.overviewSummaryEn).toBe("string");
    expect(result.overviewSummaryEn.length).toBeGreaterThan(0);
  });

  it("Same input produces deeply equal output (deterministic projection)", () => {
    const immutableInput = JSON.parse(JSON.stringify(baseResult)) as unknown as ScanResultForPdf;

    const a = mapScanResult(immutableInput);
    const b = mapScanResult(immutableInput);

    expect(a).toEqual(b);
  });
});
