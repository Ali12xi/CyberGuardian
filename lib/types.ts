export type Severity = "critical" | "high" | "medium" | "low" | "informational";
export type ThreatLevel = "low" | "medium" | "high" | "critical";
export type Grade = "A" | "B" | "C" | "D" | "F";
export type ScanStageName =
  | "dns"
  | "tls"
  | "headers"
  | "redirects"
  | "infrastructure"
  | "aiSummary";
export type ScanStageStatus = "pending" | "completed" | "partial" | "failed" | "timeout";

export type ScanStageState = {
  name: ScanStageName;
  status: ScanStageStatus;
  durationMs: number;
  reason?: string;
};

export type InfrastructureDetection = {
  category:
    | "cdn"
    | "cloud"
    | "hosting"
    | "waf"
    | "reverseProxy"
    | "framework"
    | "asn"
    | "ipOwner"
    | "server";
  name: string;
  confidence: number;
  signals: string[];
};

export type ReputationResult = {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  reputation: number;
  totalVendors: number;
  verdict: "clean" | "suspicious" | "malicious" | "unknown";
};

export type Finding = {
  id?: string;
  severity: Severity;
  message: {
    en: string;
    ar: string;
  };
  impact?: {
    en: string;
    ar: string;
  };
  remediation?: {
    en: string;
    ar: string;
  };
};

export type RedirectStep = {
  url: string;
  statusCode: number;
};

/** How redirect behavior should influence scoring and threat (intent-based, not binary). */
export type RedirectIntent = "standard" | "infrastructure" | "suspicious";

export type RedirectAnalysis = {
  hops: number;
  intent: RedirectIntent;
  /** URLs visited in order (matches `redirects.chain` steps). */
  chain: string[];
  /** True when any consecutive step moves between different registrable domains (observability signal). */
  crossDomain: boolean;
};

export type ScoreItem = {
  id: string;
  label: string;
  labelAr: string;
  value: number;
  reason: string;
};

export type AttenuationProfile =
  | "standard"
  | "edge-managed"
  | "enterprise-edge"
  | "limited-observability";

export type ScoreBreakdown = {
  positives: ScoreItem[];
  penalties: ScoreItem[];
  ceilings: ScoreItem[];
  rawScore: number;
  finalScore: number;
  grade: Grade;
  attenuationProfile: AttenuationProfile;
  /** Same values as `ScanResult.redirects.analysis` for PDF/AI/score transparency. */
  redirectAnalysis: RedirectAnalysis;
};

export type ObservableCoverage = {
  tls: "full" | "partial" | "failed";
  headers: "full" | "partial" | "failed";
  infrastructure: "full" | "partial" | "limited";
  reputation: "full" | "not-checked";
  overall: "full" | "partial" | "limited";
};

export type ScanResult = {
  score: number;
  grade: Grade;
  threatLevel: ThreatLevel;
  scoreBreakdown: ScoreBreakdown;
  observableCoverage: ObservableCoverage;
  deterministicHash: string;
  ssl: {
    valid: boolean;
    selfSigned: boolean;
    issuer: string;
    daysLeft: number;
    protocol: string;
    cipher: string;
    weakProtocol: boolean;
    weakCipher: boolean;
  };
  headers: Record<string, boolean>;
  intelligence: {
    domain: string;
    reputation: "trusted" | "neutral" | "suspicious";
    suspiciousTld: boolean;
    punycode: boolean;
    typosquatting: boolean;
    phishingKeywords: string[];
    excessiveSubdomains: boolean;
    entropy: number;
    dnsRisk: "low" | "medium" | "high";
    activePhishingIndicators: boolean;
  };
  infrastructure: {
    cdn: string;
    waf: string;
    hostingProvider: string;
    cloudProvider: string;
    asn: string;
    reverseProxy: string;
    framework: string;
    ipOwner: string;
    confidence: number;
    detections: InfrastructureDetection[];
    serverExposureScore: number;
    redirectTrust: "trusted" | "neutral" | "suspicious";
  };
  technologies: string[];
  reputation: ReputationResult | null;
  redirects: {
    chain: RedirectStep[];
    /** @deprecated Prefer `analysis.intent === "suspicious"`; kept for backward compatibility. */
    suspicious: boolean;
    analysis: RedirectAnalysis;
  };
  meta: {
    responseTime: number;
    statusCode: number;
    finalUrl: string;
    server: string;
    scanTimestamp: string;
    stages: Record<ScanStageName, ScanStageState>;
  };
  findings: Finding[];
};

export type AIExplanationContent = {
  executiveRiskOverview: string;
  attackSurfaceAnalysis: string;
  infrastructureTrustAssessment: string;
  recommendedSecurityActions: string[];
};

export type AIExplanation = {
  en: AIExplanationContent;
  ar: AIExplanationContent;
};

export type AnalyzeApiResponse =
  | {
      ok: true;
      result: ScanResult;
      scanId: string;
      scanToken: string;
    }
  | {
      ok: false;
      error: {
        en: string;
        ar: string;
      };
    };

export type AnalyzeOkPayload = Pick<
  Extract<AnalyzeApiResponse, { ok: true }>,
  "result" | "scanId" | "scanToken"
>;

export type ExplainApiResponse =
  | {
      ok: true;
      explanation: AIExplanation;
    }
  | {
      ok: false;
      error: {
        en: string;
        ar: string;
      };
    };
