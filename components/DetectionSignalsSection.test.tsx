import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DetectionSignalsSection } from "@/components/DetectionSignalsSection";
import type { InfrastructureDetection } from "@/lib/types";

vi.mock("@/components/LanguageProvider", () => ({
  useLanguage: () => ({ language: "en" }),
}));

describe("DetectionSignalsSection — Sprint 3 Day 4", () => {
  it("renders nothing when detections empty", () => {
    const html = renderToStaticMarkup(<DetectionSignalsSection detections={[]} />);
    expect(html).toBe("");
  });

  it("renders vendor group with dedupe and labels", () => {
    const detections: InfrastructureDetection[] = [
      {
        category: "cdn",
        name: "Cloudflare",
        confidence: 90,
        signals: ["cloudflare_edge_headers"],
      },
      {
        category: "waf",
        name: "Cloudflare",
        confidence: 75,
        signals: ["cloudflare_security_headers"],
      },
    ];
    const html = renderToStaticMarkup(<DetectionSignalsSection detections={detections} />);
    expect(html).toContain("Detection Signals");
    expect(html).toContain("Cloudflare");
    expect(html).toContain("CDN");
    expect(html).toContain("WAF");
    expect(html).toContain("cf-ray");
    expect(html).not.toContain("cloudflare_edge_headers");
  });

  it("does NOT render numeric confidence values", () => {
    const detections: InfrastructureDetection[] = [
      {
        category: "cdn",
        name: "Cloudflare",
        confidence: 90,
        signals: ["cloudflare_edge_headers"],
      },
    ];
    const html = renderToStaticMarkup(<DetectionSignalsSection detections={detections} />);
    expect(html).not.toMatch(/\b\d{1,3}%\b.*confidence/i);
    expect(html).not.toMatch(/confidence:\s*\d/i);
    const bullets = html.match(/•[^<]+/g) ?? [];
    for (const bullet of bullets) {
      expect(bullet).not.toMatch(/\b90\b/);
    }
  });
});
