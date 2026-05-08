export type Severity = "critical" | "high" | "medium" | "low" | "informational";
export type ThreatLevel = "low" | "medium" | "high" | "critical";
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

export type ScanResult = {
  score: number;
  grade: string;
  confidence: number;
  threatLevel: ThreatLevel;
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
    suspicious: boolean;
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
    }
  | {
      ok: false;
      error: {
        en: string;
        ar: string;
      };
    };

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
