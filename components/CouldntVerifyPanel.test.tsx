import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CouldntVerifyPanel } from "@/components/CouldntVerifyPanel";
import type { ConfidenceReport } from "@/lib/confidence/types";

vi.mock("@/components/LanguageProvider", () => ({
  useLanguage: () => ({ language: "en" }),
}));

const productionRealisticReport: ConfidenceReport = {
  headers: { context: "headers", state: "observed" },
  server: { context: "server", state: "observed" },
  infrastructure: { context: "infrastructure", state: "inferred" },
  reputationVendor: { context: "reputationVendor", state: "observed" },
  reputationHeuristic: { context: "reputationHeuristic", state: "inferred" },
  tls: { context: "tls", state: "observed" },
  redirectChain: { context: "redirectChain", state: "observed" },
  redirectIntent: { context: "redirectIntent", state: "inferred" },
};

const maskedHeadersReport: ConfidenceReport = {
  ...productionRealisticReport,
  headers: {
    context: "headers",
    state: "masked",
    reasonCode: "edge_proxy",
  },
};

const onlyInferredReport: ConfidenceReport = {
  headers: { context: "headers", state: "observed" },
  server: { context: "server", state: "observed" },
  infrastructure: { context: "infrastructure", state: "inferred" },
  reputationVendor: { context: "reputationVendor", state: "observed" },
  reputationHeuristic: { context: "reputationHeuristic", state: "inferred" },
  tls: { context: "tls", state: "observed" },
  redirectChain: { context: "redirectChain", state: "observed" },
  redirectIntent: { context: "redirectIntent", state: "inferred" },
};

describe("CouldntVerifyPanel — Sprint 3 Day 2.5 (C-lite two-tier)", () => {
  it("renders panel title", () => {
    const html = renderToStaticMarkup(<CouldntVerifyPanel report={maskedHeadersReport} />);
    expect(html).toContain("What We Could Verify");
  });

  it("renders Tier 1 dimensions with full weight (label + state)", () => {
    const html = renderToStaticMarkup(<CouldntVerifyPanel report={maskedHeadersReport} />);
    expect(html).toContain("Security Headers");
    expect(html).toContain("Masked");
  });

  it("renders Tier 2 inferred contexts as muted background list", () => {
    const html = renderToStaticMarkup(<CouldntVerifyPanel report={productionRealisticReport} />);
    expect(html).toContain("Additional inferred analysis");
    expect(html).toContain("Domain Signals");
    expect(html).toContain("Redirect Intent");
    expect(html).toContain("Infrastructure");
  });

  it("shows only Tier 2 when no notable visibility limits exist", () => {
    const html = renderToStaticMarkup(<CouldntVerifyPanel report={onlyInferredReport} />);
    expect(html).toContain("Additional inferred analysis");
    expect(html).not.toContain(">Masked<");
    expect(html).not.toContain(">Partial<");
    expect(html).not.toContain(">Hidden<");
  });

  it("does NOT render numeric confidence values in DOM", () => {
    const html = renderToStaticMarkup(<CouldntVerifyPanel report={maskedHeadersReport} />);
    expect(html).not.toMatch(/\b\d{1,3}%\b.*confidence/i);
    expect(html).not.toMatch(/confidence:\s*\d/i);
  });

  it("uses role=status (not severity)", () => {
    const html = renderToStaticMarkup(<CouldntVerifyPanel report={maskedHeadersReport} />);
    expect(html).toContain('role="status"');
  });
});
