import { describe, expect, it } from "vitest";
import { inferScanConfidence, getAllowedStates } from "@/lib/confidence/semantics";
import type { ConfidenceContext } from "@/lib/confidence/types";
import type { ScanResult } from "@/lib/types";

function createHeadersStage(
  status: ScanResult["meta"]["stages"]["headers"]["status"],
  reason?: string,
) {
  return { name: "headers" as const, status, durationMs: 0, reason };
}

function baseScan(overrides: {
  observableCoverage?: Partial<ScanResult["observableCoverage"]>;
  meta?: Partial<Omit<ScanResult["meta"], "stages">> & {
    stages?: Partial<ScanResult["meta"]["stages"]>;
  };
  infrastructure?: Partial<ScanResult["infrastructure"]>;
  intelligence?: Partial<ScanResult["intelligence"]> | null;
  reputation?: ScanResult["reputation"];
  redirects?: Partial<ScanResult["redirects"]>;
  ssl?: ScanResult["ssl"] | null;
  technologies?: string[];
} = {}): ScanResult {
  const stages: ScanResult["meta"]["stages"] = {
    dns: { name: "dns", status: "completed", durationMs: 0 },
    tls: { name: "tls", status: "completed", durationMs: 0 },
    headers: { name: "headers", status: "completed", durationMs: 0 },
    redirects: { name: "redirects", status: "completed", durationMs: 0 },
    infrastructure: { name: "infrastructure", status: "completed", durationMs: 0 },
    aiSummary: { name: "aiSummary", status: "pending", durationMs: 0 },
    ...overrides.meta?.stages,
  };

  return {
    score: 80,
    grade: "B",
    threatLevel: "low",
    scoreBreakdown: {
      positives: [],
      penalties: [],
      ceilings: [],
      rawScore: 80,
      finalScore: 80,
      grade: "B",
      attenuationProfile: "standard",
      redirectAnalysis: {
        hops: 0,
        intent: "standard",
        chain: [],
        crossDomain: false,
      },
    },
    observableCoverage: {
      tls: "full",
      headers: "full",
      infrastructure: "full",
      reputation: "full",
      overall: "full",
      ...overrides.observableCoverage,
    },
    deterministicHash: "test-hash",
    ssl: overrides.ssl === null ? undefined! : {
      valid: true,
      selfSigned: false,
      issuer: "Let's Encrypt",
      daysLeft: 90,
      protocol: "TLSv1.3",
      cipher: "TLS_AES_256_GCM_SHA384",
      weakProtocol: false,
      weakCipher: false,
      ...overrides.ssl,
    },
    headers: {},
    intelligence:
      overrides.intelligence === null
        ? undefined!
        : {
            domain: "example.com",
            reputation: "neutral",
            suspiciousTld: false,
            punycode: false,
            typosquatting: false,
            phishingKeywords: [],
            excessiveSubdomains: false,
            entropy: 2.5,
            dnsRisk: "low",
            activePhishingIndicators: false,
            ...overrides.intelligence,
          },
    infrastructure: {
      cdn: "",
      waf: "",
      hostingProvider: "",
      cloudProvider: "",
      asn: "",
      reverseProxy: "",
      framework: "",
      ipOwner: "",
      confidence: 0,
      detections: [],
      serverExposureScore: 0,
      redirectTrust: "neutral",
      ...overrides.infrastructure,
    },
    technologies: overrides.technologies ?? [],
    reputation: overrides.reputation ?? null,
    redirects: {
      chain: [],
      suspicious: false,
      analysis: {
        hops: 0,
        intent: "standard",
        chain: [],
        crossDomain: false,
      },
      ...overrides.redirects,
    },
    meta: {
      responseTime: 100,
      statusCode: 200,
      finalUrl: "https://example.com",
      server: "",
      scanTimestamp: "2026-06-01T00:00:00.000Z",
      ...overrides.meta,
      stages,
    },
    findings: [],
  };
}

describe("inferScanConfidence", () => {
  it("Article 57 — Headers + antibot reason → masked", () => {
    const result = baseScan({
      observableCoverage: { headers: "partial", overall: "partial" },
      meta: {
        stages: {
          headers: createHeadersStage("partial", "unable_to_verify_antibot"),
        },
      },
    });

    const report = inferScanConfidence(result);

    expect(report.headers.state).toBe("masked");
    expect(report.headers.reasonCode).toBe("unable_to_verify_antibot");
  });

  it("Article 58 — Headers full + CDN → masked", () => {
    const result = baseScan({
      observableCoverage: { headers: "full", overall: "full" },
      infrastructure: { cdn: "Cloudflare" },
    });

    const report = inferScanConfidence(result);

    expect(report.headers.state).toBe("masked");
    expect(report.headers.reasonCode).toBe("edge_proxy");
  });

  it("Article 59 — Headers full + no CDN → observed", () => {
    const result = baseScan({
      observableCoverage: { headers: "full", overall: "full" },
      infrastructure: { cdn: "", waf: "" },
    });

    const report = inferScanConfidence(result);

    expect(report.headers.state).toBe("observed");
  });

  it("Article 60 — Headers failed → hidden", () => {
    const result = baseScan({
      observableCoverage: { headers: "failed", overall: "limited" },
    });

    const report = inferScanConfidence(result);

    expect(report.headers.state).toBe("hidden");
  });

  it("Article 61 — Server + CDN → masked", () => {
    const result = baseScan({
      meta: { server: "nginx" },
      infrastructure: { cdn: "Cloudflare" },
    });

    const report = inferScanConfidence(result);

    expect(report.server.state).toBe("masked");
    expect(report.server.reasonCode).toBe("edge_proxy");
  });

  it("Article 62 — No server + detections → inferred", () => {
    const result = baseScan({
      meta: { server: "" },
      infrastructure: {
        cdn: "Cloudflare",
        detections: [
          {
            category: "cdn",
            name: "Cloudflare",
            confidence: 85,
            signals: ["cloudflare_edge_headers"],
          },
        ],
      },
    });

    const report = inferScanConfidence(result);

    expect(report.server.state).toBe("inferred");
  });

  it("Article 63 — Vendor reputation present → observed", () => {
    const result = baseScan({
      observableCoverage: { reputation: "full", overall: "full" },
      reputation: {
        malicious: 0,
        suspicious: 0,
        harmless: 70,
        undetected: 0,
        reputation: 0,
        totalVendors: 70,
        verdict: "clean",
      },
    });

    const report = inferScanConfidence(result);

    expect(report.reputationVendor.state).toBe("observed");
  });

  it("Article 64 — Vendor reputation null → hidden", () => {
    const result = baseScan({
      reputation: null,
      observableCoverage: { reputation: "not-checked", overall: "partial" },
    });

    const report = inferScanConfidence(result);

    expect(report.reputationVendor.state).toBe("hidden");
  });

  it("Article 65 — Heuristic always inferred (when domain present)", () => {
    const result = baseScan({
      intelligence: { reputation: "neutral" },
    });

    const report = inferScanConfidence(result);

    expect(report.reputationHeuristic.state).toBe("inferred");
  });

  it("Article 66 — TLS partial → partial", () => {
    const result = baseScan({
      observableCoverage: { tls: "partial", overall: "partial" },
    });

    const report = inferScanConfidence(result);

    expect(report.tls.state).toBe("partial");
  });

  it("Article 67 — TLS failed → hidden", () => {
    const result = baseScan({
      observableCoverage: { tls: "failed", overall: "limited" },
    });

    const report = inferScanConfidence(result);

    expect(report.tls.state).toBe("hidden");
  });

  it("Article 68 — Redirect chain complete → observed + intent inferred", () => {
    const result = baseScan({
      redirects: {
        chain: [
          { url: "https://example.com", statusCode: 301 },
          { url: "https://www.example.com", statusCode: 200 },
        ],
      },
      meta: {
        stages: {
          redirects: { name: "redirects", status: "completed", durationMs: 0 },
        },
      },
    });

    const report = inferScanConfidence(result);

    expect(report.redirectChain.state).toBe("observed");
    expect(report.redirectIntent.state).toBe("inferred");
  });

  it("Article 69 — Deterministic confidence inference", () => {
    const input = baseScan({
      observableCoverage: {
        tls: "full",
        headers: "full",
        infrastructure: "full",
        reputation: "full",
        overall: "full",
      },
      meta: { server: "nginx" },
      reputation: {
        malicious: 0,
        suspicious: 0,
        harmless: 10,
        undetected: 0,
        reputation: 0,
        totalVendors: 10,
        verdict: "clean",
      },
    });

    const immutableInput = JSON.parse(JSON.stringify(input)) as ScanResult;
    const first = inferScanConfidence(immutableInput);
    const second = inferScanConfidence(immutableInput);

    expect(first).toEqual(second);
  });

  it("Article 70 — No numeric semantics in ConfidenceReport", () => {
    const result = baseScan({
      infrastructure: {
        cdn: "Cloudflare",
        confidence: 92,
        detections: [
          {
            category: "cdn",
            name: "Cloudflare",
            confidence: 92,
            signals: ["cf-ray"],
          },
        ],
      },
    });

    const report = inferScanConfidence(result);
    const json = JSON.stringify(report);

    expect(json).not.toMatch(/"score":\s*\d/);
    expect(json).not.toMatch(/"confidenceValue":\s*\d/);
    expect(json).not.toMatch(/"percent":\s*\d/);
    expect(json).not.toMatch(/"weight":\s*\d/);

    const validStates = ["observed", "inferred", "partial", "masked", "hidden"];
    for (const context of Object.keys(report)) {
      const dim = report[context as ConfidenceContext];
      expect(typeof dim.state).toBe("string");
      expect(validStates).toContain(dim.state);
    }
  });

  it("Article 71 — Context-state pairing discipline", () => {
    expect(getAllowedStates("tls")).not.toContain("masked");
    expect(getAllowedStates("reputationHeuristic")).not.toContain("observed");
    expect(getAllowedStates("redirectIntent")).not.toContain("observed");
    expect(getAllowedStates("headers")).not.toContain("inferred");
    expect(getAllowedStates("reputationVendor")).not.toContain("inferred");

    const contexts = [
      "headers",
      "server",
      "infrastructure",
      "reputationVendor",
      "reputationHeuristic",
      "tls",
      "redirectChain",
      "redirectIntent",
    ] as const;

    for (const ctx of contexts) {
      expect(getAllowedStates(ctx).length).toBeGreaterThan(0);
    }
  });
});
