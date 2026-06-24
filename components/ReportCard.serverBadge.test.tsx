import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { explainConfidence, getConfidenceLabel } from "@/lib/confidence/semantics";
import type { ConfidenceExplanation, ConfidenceLabel, ConfidenceReport } from "@/lib/confidence/types";

function resolveServerConfidence(report: ConfidenceReport | null): {
  label: ConfidenceLabel;
  explanation: ConfidenceExplanation;
} | null {
  if (!report) {
    return null;
  }
  const dim = report.server;
  if (dim.state === "observed" || dim.state === "inferred") {
    return null;
  }
  return {
    label: getConfidenceLabel(dim.state),
    explanation: explainConfidence("server", dim),
  };
}

function ServerLineFixture({
  serverValue,
  serverConfidence,
}: {
  serverValue: string;
  serverConfidence: ReturnType<typeof resolveServerConfidence>;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p>
        Server:{" "}
        <span dir="ltr">{serverValue}</span>
      </p>
      {serverConfidence ? (
        <div className="shrink-0">
          <ConfidenceBadge
            explanation={serverConfidence.explanation}
            label={serverConfidence.label}
            language="en"
          />
        </div>
      ) : null}
    </div>
  );
}

const baseReport: ConfidenceReport = {
  headers: { context: "headers", state: "observed" },
  server: { context: "server", state: "observed" },
  infrastructure: { context: "infrastructure", state: "inferred" },
  reputationVendor: { context: "reputationVendor", state: "observed" },
  reputationHeuristic: { context: "reputationHeuristic", state: "inferred" },
  tls: { context: "tls", state: "observed" },
  redirectChain: { context: "redirectChain", state: "observed" },
  redirectIntent: { context: "redirectIntent", state: "inferred" },
};

describe("Server Line Confidence (Sprint 3 Day 3)", () => {
  it("renders inline Masked badge for edge-proxied server; suppresses badge for observed and inferred", () => {
    const maskedReport: ConfidenceReport = {
      ...baseReport,
      server: { context: "server", state: "masked", reasonCode: "edge_proxy" },
    };
    const inferredReport: ConfidenceReport = {
      ...baseReport,
      server: { context: "server", state: "inferred" },
    };

    const maskedConfidence = resolveServerConfidence(maskedReport);
    expect(maskedConfidence).not.toBeNull();

    const maskedHtml = renderToStaticMarkup(
      <ServerLineFixture serverConfidence={maskedConfidence} serverValue="nginx" />,
    );
    expect(maskedHtml).toContain("Masked");
    expect(maskedHtml).toContain('role="status"');
    expect(maskedHtml).toContain('dir="ltr"');

    expect(resolveServerConfidence(baseReport)).toBeNull();
    expect(resolveServerConfidence(inferredReport)).toBeNull();

    const observedHtml = renderToStaticMarkup(
      <ServerLineFixture
        serverConfidence={resolveServerConfidence(baseReport)}
        serverValue="nginx"
      />,
    );
    expect(observedHtml).not.toContain("Masked");
  });
});
