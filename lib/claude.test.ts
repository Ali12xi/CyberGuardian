import { describe, it, expect } from "vitest";
import { generateLocalSecurityExplanation } from "@/lib/claude";
import type { ScanResult } from "@/lib/types";

const baseHealthyResult = {
  threatLevel: "low" as const,
  score: 85,
  observableCoverage: { overall: "full" as const },
  headers: {
    "strict-transport-security": true,
    "content-security-policy": true,
    "x-frame-options": true,
    "x-content-type-options": true,
  },
  ssl: {
    valid: true,
    weakProtocol: false,
    weakCipher: false,
    protocol: "TLSv1.3",
    cipher: "TLS_AES_256_GCM_SHA384",
  },
  intelligence: {
    reputation: "trusted" as const,
    suspiciousTld: false,
    punycode: false,
    typosquatting: false,
    phishingKeywords: [] as string[],
  },
  technologies: ["nginx", "next.js"],
  redirects: { suspicious: false },
  findings: [],
} as unknown as ScanResult;

const baseCriticalResult = {
  ...baseHealthyResult,
  threatLevel: "critical" as const,
  score: 25,
  ssl: { valid: false, weakProtocol: true, weakCipher: true, protocol: "TLSv1.2", cipher: "RC4" },
  intelligence: {
    ...baseHealthyResult.intelligence,
    reputation: "malicious" as const,
  },
} as unknown as ScanResult;

const baseMinimalResult = {
  threatLevel: "low" as const,
  score: 70,
  observableCoverage: { overall: "limited" as const },
  headers: {},
  ssl: { valid: true, weakProtocol: false, weakCipher: false, protocol: "TLSv1.3", cipher: "TLS_AES_256_GCM_SHA384" },
  intelligence: {
    reputation: "neutral" as const,
    suspiciousTld: false,
    punycode: false,
    typosquatting: false,
    phishingKeywords: [] as string[],
  },
  technologies: [] as string[],
  redirects: { suspicious: false },
  findings: [],
} as unknown as ScanResult;

describe("generateLocalSecurityExplanation — deterministic bilingual trust narration", () => {
  it("Narrative populates both languages with full content shape", () => {
    const result = generateLocalSecurityExplanation(baseHealthyResult);

    expect(typeof result.en.executiveRiskOverview).toBe("string");
    expect(result.en.executiveRiskOverview.length).toBeGreaterThan(0);
    expect(typeof result.en.attackSurfaceAnalysis).toBe("string");
    expect(result.en.attackSurfaceAnalysis.length).toBeGreaterThan(0);
    expect(typeof result.en.infrastructureTrustAssessment).toBe("string");
    expect(result.en.infrastructureTrustAssessment.length).toBeGreaterThan(0);
    expect(Array.isArray(result.en.recommendedSecurityActions)).toBe(true);
    expect(result.en.recommendedSecurityActions.length).toBeGreaterThan(0);

    expect(typeof result.ar.executiveRiskOverview).toBe("string");
    expect(result.ar.executiveRiskOverview.length).toBeGreaterThan(0);
    expect(typeof result.ar.attackSurfaceAnalysis).toBe("string");
    expect(result.ar.attackSurfaceAnalysis.length).toBeGreaterThan(0);
    expect(typeof result.ar.infrastructureTrustAssessment).toBe("string");
    expect(result.ar.infrastructureTrustAssessment.length).toBeGreaterThan(0);
    expect(Array.isArray(result.ar.recommendedSecurityActions)).toBe(true);
  });

  it("Critical threat produces critical-tier overview (tokens + distinctness)", () => {
    const criticalResult = generateLocalSecurityExplanation(baseCriticalResult);

    expect(criticalResult.en.executiveRiskOverview).toContain("critical");
    expect(criticalResult.en.executiveRiskOverview).toContain("25");
  });

  it("Low threat produces low-tier overview that differs from critical", () => {
    const lowResult = generateLocalSecurityExplanation(baseHealthyResult);
    const criticalResult = generateLocalSecurityExplanation(baseCriticalResult);

    expect(lowResult.en.executiveRiskOverview).not.toBe(criticalResult.en.executiveRiskOverview);
    expect(lowResult.ar.executiveRiskOverview).not.toBe(criticalResult.ar.executiveRiskOverview);

    expect(lowResult.en.executiveRiskOverview).toContain("low");
    expect(lowResult.en.executiveRiskOverview).toContain("85");
  });

  it("Minimal scan with empty signals produces complete narrative without throw", () => {
    expect(() => generateLocalSecurityExplanation(baseMinimalResult)).not.toThrow();

    const result = generateLocalSecurityExplanation(baseMinimalResult);

    expect(result.en.executiveRiskOverview.length).toBeGreaterThan(0);
    expect(result.en.attackSurfaceAnalysis.length).toBeGreaterThan(0);
    expect(result.en.infrastructureTrustAssessment.length).toBeGreaterThan(0);
    expect(result.en.recommendedSecurityActions.length).toBeGreaterThan(0);
    expect(result.ar.executiveRiskOverview.length).toBeGreaterThan(0);
  });

  it("Same input produces semantically equal narrative (deterministic projection)", () => {
    const immutableInput = JSON.parse(JSON.stringify(baseHealthyResult)) as ScanResult;

    const a = generateLocalSecurityExplanation(immutableInput);
    const b = generateLocalSecurityExplanation(immutableInput);

    expect(a).toEqual(b);
  });

  it("Arabic recommendedSecurityActions array structure is preserved", () => {
    const result = generateLocalSecurityExplanation(baseHealthyResult);

    expect(Array.isArray(result.ar.recommendedSecurityActions)).toBe(true);
    expect(result.ar.recommendedSecurityActions.length).toBeGreaterThan(0);
    for (const action of result.ar.recommendedSecurityActions) {
      expect(typeof action).toBe("string");
      expect(action.length).toBeGreaterThan(0);
    }
  });

  it("Even minimal scans always produce at least one recommended action", () => {
    const result = generateLocalSecurityExplanation(baseMinimalResult);

    expect(result.en.recommendedSecurityActions.length).toBeGreaterThan(0);
    expect(result.ar.recommendedSecurityActions.length).toBeGreaterThan(0);
  });
});
