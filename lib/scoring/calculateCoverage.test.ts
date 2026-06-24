import { describe, it, expect } from "vitest";
import { calculateObservableCoverage } from "@/lib/scoring/calculateCoverage";
import type { ScanResult } from "@/lib/types";

describe("calculateObservableCoverage", () => {
  it("returns full coverage when all stages complete and reputation present", () => {
    const result = {
      meta: { stages: { tls: { status: "completed" }, headers: { status: "completed" }, infrastructure: { status: "completed" } } },
      reputation: {},
    } as unknown as ScanResult;

    const coverage = calculateObservableCoverage(result);

    expect(coverage.tls).toBe("full");
    expect(coverage.headers).toBe("full");
    expect(coverage.infrastructure).toBe("full");
    expect(coverage.reputation).toBe("full");
    expect(coverage.overall).toBe("full");
  });

  it("returns partial coverage when all stages are partial", () => {
    const result = {
      meta: { stages: { tls: { status: "partial" }, headers: { status: "partial" }, infrastructure: { status: "partial" } } },
      reputation: {},
    } as unknown as ScanResult;

    const coverage = calculateObservableCoverage(result);

    expect(coverage.tls).toBe("partial");
    expect(coverage.headers).toBe("partial");
    expect(coverage.infrastructure).toBe("partial");
    expect(coverage.overall).toBe("partial");
  });

  it("returns limited coverage when all stages failed and reputation absent", () => {
    const result = {
      meta: { stages: { tls: { status: "failed" }, headers: { status: "failed" }, infrastructure: { status: "failed" } } },
      reputation: undefined,
    } as unknown as ScanResult;

    const coverage = calculateObservableCoverage(result);

    expect(coverage.tls).toBe("failed");
    expect(coverage.infrastructure).toBe("limited");
    expect(coverage.reputation).toBe("not-checked");
    expect(coverage.overall).toBe("limited");
  });

  it("produces deterministic output for mixed stages", () => {
    const result = {
      meta: { stages: { tls: { status: "completed" }, headers: { status: "timeout" }, infrastructure: { status: "completed" } } },
      reputation: {},
    } as unknown as ScanResult;

    const first = calculateObservableCoverage(result);
    const second = calculateObservableCoverage(result);

    expect(first).toEqual(second);
    expect(first.headers).toBe("partial");
    expect(first.overall).toBe("partial");
  });
});
