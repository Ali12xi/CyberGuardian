import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CouldntVerifyPanel } from "@/components/CouldntVerifyPanel";
import type { ConfidenceReport } from "@/lib/confidence/types";

vi.mock("@/components/LanguageProvider", () => ({
  useLanguage: () => ({ language: "en" as const }),
}));

const allObservedReport: ConfidenceReport = {
  headers: { context: "headers", state: "observed" },
  server: { context: "server", state: "observed" },
  infrastructure: { context: "infrastructure", state: "observed" },
  reputationVendor: { context: "reputationVendor", state: "observed" },
  reputationHeuristic: { context: "reputationHeuristic", state: "inferred" },
  tls: { context: "tls", state: "observed" },
  redirectChain: { context: "redirectChain", state: "observed" },
  redirectIntent: { context: "redirectIntent", state: "inferred" },
};

const maskedHeadersReport: ConfidenceReport = {
  ...allObservedReport,
  headers: {
    context: "headers",
    state: "masked",
    reasonCode: "edge_proxy",
  },
};

function renderPanel(report: ConfidenceReport) {
  return renderToStaticMarkup(createElement(CouldntVerifyPanel, { report }));
}

describe("CouldntVerifyPanel — Sprint 3 Day 2", () => {
  it("renders title in panel", () => {
    const html = renderPanel(maskedHeadersReport);
    expect(html).toContain('role="status"');
    expect(html).toContain("What We Could Verify");
  });

  it("renders expanded mode when at least one dimension is non-observed", () => {
    const html = renderPanel(maskedHeadersReport);
    expect(html).toContain("Security Headers");
    expect(html).toContain("Masked");
  });

  it("does NOT render numeric confidence values in DOM", () => {
    const html = renderPanel(maskedHeadersReport);
    expect(html).not.toMatch(/\b\d{1,3}%\b.*confidence/i);
    expect(html).not.toMatch(/confidence:\s*\d/i);
  });

  it("uses role=status (not severity)", () => {
    const html = renderPanel(maskedHeadersReport);
    expect(html).toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  });
});
