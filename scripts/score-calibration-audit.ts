/**
 * Calibration audit using representative ScanResult shapes (no live fetch: scanner is server-only).
 * Run: npx tsx scripts/score-calibration-audit.ts
 */
import { calculateDeterministicScore } from "../lib/scoring/calculateScore";
import type { ScanResult, ScanStageName, ScanStageState } from "../lib/types";

const done = (name: ScanStageName, reason?: string): ScanStageState => ({
  name,
  status: "completed",
  durationMs: 120,
  ...(reason ? { reason } : {}),
});

const partial = (name: ScanStageName, reason?: string): ScanStageState => ({
  name,
  status: "partial",
  durationMs: 120,
  ...(reason ? { reason } : {}),
});

function stages(
  headers: ScanStageState,
  infrastructure: ScanStageState = done("infrastructure"),
): ScanResult["meta"]["stages"] {
  return {
    dns: done("dns"),
    tls: done("tls"),
    headers,
    redirects: done("redirects"),
    infrastructure,
    aiSummary: done("aiSummary"),
  };
}

function baseScan(overrides: Partial<ScanResult>): ScanResult {
  const emptyBreakdown: ScanResult["scoreBreakdown"] = {
    positives: [],
    penalties: [],
    ceilings: [],
    rawScore: 0,
    finalScore: 0,
    grade: "F",
    attenuationProfile: "standard",
    redirectAnalysis: {
      hops: 0,
      intent: "standard",
      chain: [],
      crossDomain: false,
    },
  };

  const base: ScanResult = {
    score: 0,
    grade: "F",
    threatLevel: "low",
    scoreBreakdown: emptyBreakdown,
    observableCoverage: {
      tls: "full",
      headers: "full",
      infrastructure: "full",
      reputation: "not-checked",
      overall: "full",
    },
    deterministicHash: "",
    ssl: {
      valid: true,
      selfSigned: false,
      issuer: "CN=Test CA",
      daysLeft: 90,
      protocol: "TLSv1.3",
      cipher: "TLS_AES_256_GCM_SHA384",
      weakProtocol: false,
      weakCipher: false,
    },
    headers: {
      "strict-transport-security": false,
      "content-security-policy": false,
      "x-frame-options": false,
      "x-content-type-options": false,
      "referrer-policy": false,
      "permissions-policy": false,
    },
    intelligence: {
      domain: "example.com",
      reputation: "neutral",
      suspiciousTld: false,
      punycode: false,
      typosquatting: false,
      phishingKeywords: [],
      excessiveSubdomains: false,
      entropy: 3.2,
      dnsRisk: "low",
      activePhishingIndicators: false,
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
      confidence: 60,
      detections: [],
      serverExposureScore: 25,
      redirectTrust: "neutral",
    },
    technologies: [],
    reputation: null,
    redirects: {
      chain: [{ url: "https://example.com/", statusCode: 200 }],
      suspicious: false,
      analysis: {
        hops: 1,
        intent: "standard",
        chain: ["https://example.com/"],
        crossDomain: false,
      },
    },
    meta: {
      responseTime: 200,
      statusCode: 200,
      finalUrl: "https://example.com/",
      server: "nginx",
      scanTimestamp: new Date().toISOString(),
      stages: stages(done("headers")),
    },
    findings: [],
  };

  return {
    ...base,
    ...overrides,
    meta: { ...base.meta, ...overrides.meta },
    ssl: { ...base.ssl, ...overrides.ssl },
    headers: { ...base.headers, ...overrides.headers },
    intelligence: { ...base.intelligence, ...overrides.intelligence },
    infrastructure: { ...base.infrastructure, ...overrides.infrastructure },
    redirects: { ...base.redirects, ...overrides.redirects },
  } as ScanResult;
}

/** ~google.com: strong TLS, limited header surface, CDN signals, moderate–high exposure metadata */
const googleLike = baseScan({
  meta: {
    finalUrl: "https://www.google.com/",
    statusCode: 200,
    stages: stages(partial("headers", "limited_observable_surface")),
  },
  intelligence: { domain: "google.com", reputation: "trusted" },
  infrastructure: {
    cdn: "Google",
    waf: "",
    serverExposureScore: 68,
    detections: [{ category: "cdn", name: "Google", confidence: 85, signals: ["edge"] }],
  },
  ssl: { issuer: "Google Trust Services", protocol: "TLSv1.3" },
} as unknown as Partial<ScanResult>);

/** ~claude.ai / chatgpt.ai: completed header stage but typical AI landing pages often ship fewer static security headers */
const claudeLike = baseScan({
  meta: { finalUrl: "https://claude.ai/", stages: stages(done("headers")) },
  intelligence: { domain: "claude.ai", reputation: "neutral" },
  infrastructure: {
    cdn: "Cloudflare",
    waf: "Cloudflare",
    serverExposureScore: 52,
    detections: [
      { category: "waf", name: "Cloudflare", confidence: 90, signals: [] },
      { category: "cdn", name: "Cloudflare", confidence: 88, signals: [] },
    ],
  },
} as unknown as Partial<ScanResult>);

const chatgptLike = baseScan({
  meta: { finalUrl: "https://chatgpt.com/", stages: stages(done("headers")) },
  intelligence: { domain: "chatgpt.com", reputation: "neutral" },
  infrastructure: {
    cdn: "Cloudflare",
    waf: "Cloudflare",
    serverExposureScore: 50,
    detections: [{ category: "waf", name: "Cloudflare", confidence: 88, signals: [] }],
  },
} as unknown as Partial<ScanResult>);

/** ~amazon.sa: regional storefront, full observability, exposure + missing headers pattern */
const amazonSaLike = baseScan({
  meta: { finalUrl: "https://amazon.sa/", stages: stages(done("headers")) },
  intelligence: { domain: "amazon.sa", reputation: "neutral" },
  infrastructure: {
    cdn: "CloudFront",
    cloudProvider: "AWS",
    serverExposureScore: 55,
    detections: [{ category: "cdn", name: "Amazon CloudFront", confidence: 82, signals: [] }],
  },
} as unknown as Partial<ScanResult>);

/** google.com-style: full stages, strong TLS, CDN edge, only two tracked security headers visible on HTML surface */
const googleFullEdgeLike = baseScan({
  meta: {
    finalUrl: "https://www.google.com/",
    statusCode: 200,
    stages: stages(done("headers")),
  },
  intelligence: { domain: "google.com", reputation: "trusted" },
  headers: {
    "strict-transport-security": true,
    "content-security-policy": true,
    "x-frame-options": false,
    "x-content-type-options": false,
    "referrer-policy": false,
    "permissions-policy": false,
  },
  infrastructure: {
    cdn: "Google",
    waf: "",
    serverExposureScore: 52,
    detections: [{ category: "cdn", name: "Google", confidence: 85, signals: ["edge"] }],
  },
  ssl: { issuer: "Google Trust Services", protocol: "TLSv1.3" },
} as unknown as Partial<ScanResult>);

/** github.com-style: full TLS, Fastly/GitHub edge, moderate header gaps, low exposure */
const githubLike = baseScan({
  meta: { finalUrl: "https://github.com/", stages: stages(done("headers")) },
  intelligence: { domain: "github.com", reputation: "trusted" },
  infrastructure: {
    cdn: "GitHub",
    reverseProxy: "Fastly",
    serverExposureScore: 32,
    detections: [
      { category: "cdn", name: "Fastly", confidence: 80, signals: [] },
      { category: "reverseProxy", name: "Varnish", confidence: 55, signals: [] },
    ],
  },
} as unknown as Partial<ScanResult>);

const CASES: { label: string; result: ScanResult }[] = [
  { label: "google.com (partial headers)", result: googleLike },
  { label: "google.com (full edge, 2 headers)", result: googleFullEdgeLike },
  { label: "github.com (representative)", result: githubLike },
  { label: "claude.ai (representative)", result: claudeLike },
  { label: "chatgpt.com (representative)", result: chatgptLike },
  { label: "amazon.sa (representative)", result: amazonSaLike },
];

function auditOne(label: string, input: ScanResult) {
  const a = calculateDeterministicScore(structuredClone(input));
  const b = calculateDeterministicScore(structuredClone(input));
  const stable =
    a.score === b.score &&
    a.grade === b.grade &&
    a.threatLevel === b.threatLevel &&
    JSON.stringify(a.scoreBreakdown) === JSON.stringify(b.scoreBreakdown) &&
    JSON.stringify(a.observableCoverage) === JSON.stringify(b.observableCoverage);

  return {
    label,
    deterministicPair: stable,
    score: a.score,
    grade: a.grade,
    threatLevel: a.threatLevel,
    attenuationProfile: a.scoreBreakdown.attenuationProfile,
    observableCoverage: a.observableCoverage,
    rawScore: a.scoreBreakdown.rawScore,
    positives: a.scoreBreakdown.positives.map((p) => ({ id: p.id, value: p.value })),
    penalties: a.scoreBreakdown.penalties.map((p) => ({ id: p.id, value: p.value })),
    ceilings: a.scoreBreakdown.ceilings.map((c) => ({ id: c.id, value: c.value })),
  };
}

for (const { label, result } of CASES) {
  console.log("\n==========\n" + label);
  console.log(JSON.stringify(auditOne(label, result), null, 2));
}
