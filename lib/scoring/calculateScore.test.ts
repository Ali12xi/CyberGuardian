import { describe, it, expect } from "vitest";
import { calculateDeterministicScore } from "@/lib/scoring/calculateScore";
import type { ScanResult } from "@/lib/types";

/**
 * Canonical healthy trust posture. The engine recomputes score/grade/threat/
 * coverage/hash, so the output-shaped fields below carry placeholder values
 * only to satisfy the ScanResult type; they are never read by the engine.
 */
const base: ScanResult = {
  score: 0,
  grade: "A",
  threatLevel: "low",
  scoreBreakdown: {
    positives: [],
    penalties: [],
    ceilings: [],
    rawScore: 0,
    finalScore: 0,
    grade: "A",
    attenuationProfile: "standard",
    redirectAnalysis: { hops: 1, intent: "standard", chain: ["https://example.com/"], crossDomain: false },
  },
  observableCoverage: {
    tls: "full",
    headers: "full",
    infrastructure: "full",
    reputation: "full",
    overall: "full",
  },
  deterministicHash: "",
  ssl: {
    valid: true,
    selfSigned: false,
    issuer: "Example CA",
    daysLeft: 200,
    protocol: "TLSv1.3",
    cipher: "TLS_AES_256_GCM_SHA384",
    weakProtocol: false,
    weakCipher: false,
  },
  headers: {
    "strict-transport-security": true,
    "content-security-policy": true,
    "x-frame-options": true,
    "x-content-type-options": true,
  },
  intelligence: {
    domain: "example.com",
    reputation: "trusted",
    suspiciousTld: false,
    punycode: false,
    typosquatting: false,
    phishingKeywords: [],
    excessiveSubdomains: false,
    entropy: 3,
    dnsRisk: "low",
    activePhishingIndicators: false,
  },
  infrastructure: {
    cdn: "cloudfront",
    waf: "aws-waf",
    hostingProvider: "aws",
    cloudProvider: "aws",
    asn: "AS16509",
    reverseProxy: "",
    framework: "",
    ipOwner: "Amazon",
    confidence: 80,
    detections: [],
    serverExposureScore: 25,
    redirectTrust: "trusted",
  },
  technologies: [],
  reputation: {
    malicious: 0,
    suspicious: 0,
    harmless: 80,
    undetected: 5,
    reputation: 90,
    totalVendors: 85,
    verdict: "clean",
  },
  redirects: {
    chain: [{ url: "https://example.com/", statusCode: 200 }],
    suspicious: false,
    analysis: { hops: 1, intent: "standard", chain: ["https://example.com/"], crossDomain: false },
  },
  meta: {
    responseTime: 100,
    statusCode: 200,
    finalUrl: "https://example.com/",
    server: "",
    scanTimestamp: "2026-01-01T00:00:00Z",
    stages: {
      dns: { name: "dns", status: "completed", durationMs: 10 },
      tls: { name: "tls", status: "completed", durationMs: 10 },
      headers: { name: "headers", status: "completed", durationMs: 10 },
      redirects: { name: "redirects", status: "completed", durationMs: 10 },
      infrastructure: { name: "infrastructure", status: "completed", durationMs: 10 },
      aiSummary: { name: "aiSummary", status: "completed", durationMs: 10 },
    },
  },
  findings: [],
};

describe("calculateDeterministicScore — constitutional trust invariants", () => {
  it("Perfect transport, full coverage, all headers → high trust verdict (A grade, low threat)", () => {
    const result = calculateDeterministicScore(base);

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.grade).toBe("A");
    expect(result.threatLevel).toBe("low");
  });

  it("Good HTTPS with 2 missing headers → moderate verdict (still low threat)", () => {
    const input: ScanResult = {
      ...base,
      headers: {
        "strict-transport-security": true,
        "x-content-type-options": true,
      },
    };

    const result = calculateDeterministicScore(input);

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.score).toBeLessThanOrEqual(84);
    expect(result.threatLevel).toBe("low");
  });

  it("Trust boundary: HTTP-only sites cannot exceed the transport ceiling", () => {
    const input: ScanResult = {
      ...base,
      meta: { ...base.meta, finalUrl: "http://example.com/" },
    };

    const result = calculateDeterministicScore(input);

    expect(result.score).toBeLessThanOrEqual(30);
    expect(result.grade).toBe("F");
    expect(result.threatLevel).toBe("high");
  });

  it("Trust boundary: HTTPS with invalid certificate caps trust at 45", () => {
    const input: ScanResult = {
      ...base,
      ssl: { ...base.ssl, valid: false },
    };

    const result = calculateDeterministicScore(input);

    expect(result.score).toBeLessThanOrEqual(45);
    expect(result.threatLevel).toBe("high");
  });

  it("Hard risk: weak TLS protocol or cipher elevates threat regardless of score", () => {
    const input: ScanResult = {
      ...base,
      ssl: { ...base.ssl, weakProtocol: true, weakCipher: true },
    };

    const result = calculateDeterministicScore(input);

    expect(result.threatLevel).toBe("high");
  });

  it("Edge-managed sites with hidden headers receive inferred credit, not punishment", () => {
    // NOTE: ScanResult.infrastructure.cdn/waf are typed `string`, so the
    // "no edge" case uses empty strings ("") rather than null to remove edge
    // signals while satisfying the type. Empty strings are falsy in the engine.
    const edgeManaged: ScanResult = {
      ...base,
      headers: {},
      infrastructure: { ...base.infrastructure, cdn: "cloudflare", waf: "cloudflare" },
    };
    const noEdge: ScanResult = {
      ...base,
      headers: {},
      infrastructure: { ...base.infrastructure, cdn: "", waf: "" },
    };

    const edgeResult = calculateDeterministicScore(edgeManaged);
    const noEdgeResult = calculateDeterministicScore(noEdge);

    expect(edgeResult.score).toBeGreaterThan(noEdgeResult.score);
    expect(edgeResult.threatLevel).not.toBe("high");
  });

  it("Partial visibility caps trust: site cannot exceed 88 (or 82 without edge hardening)", () => {
    const input: ScanResult = {
      ...base,
      meta: {
        ...base.meta,
        stages: {
          ...base.meta.stages,
          headers: { name: "headers", status: "partial", durationMs: 10 },
        },
      },
    };

    const result = calculateDeterministicScore(input);

    expect(result.observableCoverage.overall).toBe("partial");
    expect(result.score).toBeLessThanOrEqual(88);
  });

  it("Deterministic engine: same input always produces same trust verdict", () => {
    const first = calculateDeterministicScore(base);
    const second = calculateDeterministicScore(base);

    expect(first).toEqual(second);

    const withDifferentTimestamp: ScanResult = {
      ...base,
      meta: { ...base.meta, scanTimestamp: "2099-12-31T00:00:00Z" },
    };

    expect(calculateDeterministicScore(withDifferentTimestamp)).toEqual(first);
  });

  it("Malicious reputation hard-caps trust and sits atop the threat hierarchy", () => {
    const input: ScanResult = {
      ...base,
      // base.reputation is typed ReputationResult | null; it is present in base.
      reputation: { ...base.reputation!, verdict: "malicious" },
    };

    const result = calculateDeterministicScore(input);

    expect(result.score).toBeLessThanOrEqual(20);
    expect(result.grade).toBe("F");
    expect(result.threatLevel).toBe("critical");
  });

  it("Anti-fear invariant: suspicious redirect alone is capped at MEDIUM threat", () => {
    const input: ScanResult = {
      ...base,
      redirects: {
        ...base.redirects,
        analysis: { ...base.redirects.analysis, intent: "suspicious" },
      },
    };

    const result = calculateDeterministicScore(input);

    expect(result.threatLevel).toBe("medium");
    expect(result.threatLevel).not.toBe("high");
  });

  it("Trust boundary: critical findings cap score at 60 regardless of healthy signals", () => {
    // Finding requires only `severity` and `message` (see lib/types.ts).
    const input: ScanResult = {
      ...base,
      findings: [
        {
          severity: "critical",
          message: { en: "Test critical finding", ar: "اختبار" },
        },
      ],
    };

    const result = calculateDeterministicScore(input);

    expect(result.score).toBeLessThanOrEqual(60);
    expect(result.threatLevel).toBe("critical");
  });

  it("Anti-fear invariant: high-severity finding alone does NOT imply high threat", () => {
    const input: ScanResult = {
      ...base,
      findings: [
        {
          severity: "high",
          message: { en: "Test high finding", ar: "اختبار" },
        },
      ],
    };

    const result = calculateDeterministicScore(input);

    expect(result.score).toBeLessThanOrEqual(75);
    expect(result.threatLevel).not.toBe("high");
  });

  it("Anti-overcompensation: coverage credit bundle never exceeds 16", () => {
    const input: ScanResult = {
      ...base,
      headers: {},
      meta: {
        ...base.meta,
        stages: {
          ...base.meta.stages,
          headers: { name: "headers", status: "partial", durationMs: 10 },
        },
      },
    };

    const result = calculateDeterministicScore(input);

    const coverageCreditIds = [
      "observabilityAwareTransportCredit",
      "observableEdgeHardening",
      "edgeManagedHeaderSurface",
    ];
    const creditTotal = result.scoreBreakdown.positives
      .filter((item) => coverageCreditIds.includes(item.id))
      .reduce((sum, item) => sum + item.value, 0);

    expect(creditTotal).toBeLessThanOrEqual(16);
  });

  it("Limited observability path degrades gracefully without crashing", () => {
    const input: ScanResult = {
      ...base,
      meta: {
        ...base.meta,
        stages: {
          ...base.meta.stages,
          tls: { name: "tls", status: "failed", durationMs: 10 },
          headers: { name: "headers", status: "failed", durationMs: 10 },
          infrastructure: { name: "infrastructure", status: "failed", durationMs: 10 },
        },
      },
    };

    const result = calculateDeterministicScore(input);

    expect(result.observableCoverage.overall).toBe("limited");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(94);

    const second = calculateDeterministicScore(input);
    expect(result).toEqual(second);
  });
});
