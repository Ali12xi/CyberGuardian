export type ConfidenceState =
  | "observed"
  | "inferred"
  | "partial"
  | "masked"
  | "hidden";

export type ConfidenceContext =
  | "headers"
  | "server"
  | "infrastructure"
  | "reputationVendor"
  | "reputationHeuristic"
  | "tls"
  | "redirectChain"
  | "redirectIntent";

export type ConfidenceReasonCode =
  | "unable_to_verify_antibot"
  | "limited_observable_surface"
  | "edge_proxy"
  | "redirect_timeout"
  | "tls_partial"
  | "stage_failed";

export type ConfidenceLabel = {
  en: string;
  ar: string;
};

export type ConfidenceExplanation = {
  en: string;
  ar: string;
};

export type ConfidenceDimension = {
  context: ConfidenceContext;
  state: ConfidenceState;
  reasonCode?: ConfidenceReasonCode;
};

export type ConfidenceReport = {
  headers: ConfidenceDimension;
  server: ConfidenceDimension;
  infrastructure: ConfidenceDimension;
  reputationVendor: ConfidenceDimension;
  reputationHeuristic: ConfidenceDimension;
  tls: ConfidenceDimension;
  redirectChain: ConfidenceDimension;
  redirectIntent: ConfidenceDimension;
};
