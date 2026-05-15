import type { ObservableCoverage, ScanResult } from "@/lib/types";

function isPartial(status: string) {
  return status === "partial" || status === "timeout";
}

export function calculateObservableCoverage(result: ScanResult): ObservableCoverage {
  const tlsStage = result.meta.stages.tls.status;
  const headersStage = result.meta.stages.headers.status;
  const infraStage = result.meta.stages.infrastructure.status;

  const tls: ObservableCoverage["tls"] =
    tlsStage === "completed" ? "full" : isPartial(tlsStage) ? "partial" : "failed";
  const headers: ObservableCoverage["headers"] =
    headersStage === "completed" ? "full" : isPartial(headersStage) ? "partial" : "failed";
  const infrastructure: ObservableCoverage["infrastructure"] =
    infraStage === "completed" ? "full" : isPartial(infraStage) ? "partial" : "limited";
  const reputation: ObservableCoverage["reputation"] = result.reputation ? "full" : "not-checked";

  const overall: ObservableCoverage["overall"] =
    tls === "failed" || headers === "failed" || infrastructure === "limited"
      ? "limited"
      : tls === "partial" ||
          headers === "partial" ||
          infrastructure === "partial" ||
          reputation === "not-checked"
        ? "partial"
        : "full";

  return {
    tls,
    headers,
    infrastructure,
    reputation,
    overall,
  };
}
