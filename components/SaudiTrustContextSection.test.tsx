import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SaudiTrustContextSection } from "@/components/SaudiTrustContextSection";
import type { EmailTrustIntelligence } from "@/lib/types";

vi.mock("@/components/LanguageProvider", () => ({
  useLanguage: () => ({ language: "en" }),
}));

// Strip tags so vocabulary guards inspect visible copy, not className tokens.
function textOf(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

function emailWith(
  dmarcRecord: string | null,
  securityTxtFound: boolean | null = null,
): EmailTrustIntelligence {
  return {
    spf: { record: null, observed: false },
    dkim: { selectorsChecked: 0, selectorsFound: [] },
    dmarc: {
      record: dmarcRecord,
      policy: null,
      observed: dmarcRecord !== null,
    },
    dnssec: { dnskeyObserved: null },
    securityTxt: { fileFound: securityTxtFound, expires: null },
    hasEmailSurface: dmarcRecord !== null || securityTxtFound === true,
  };
}

describe("SaudiTrustContextSection — Sprint 5 Day 1", () => {
  it("returns null when there is no Saudi context", () => {
    const html = renderToStaticMarkup(
      <SaudiTrustContextSection domain="example.com" />,
    );
    expect(html).toBe("");
  });

  it("renders when domain is .gov.sa", () => {
    const html = renderToStaticMarkup(
      <SaudiTrustContextSection domain="gov.sa" />,
    );
    expect(html).toContain("Saudi Trust Context");
    expect(html).toContain(".gov.sa");
  });

  it("renders for Haseen-only (.com + dmarc.gov.sa — aramco case)", () => {
    const html = renderToStaticMarkup(
      <SaudiTrustContextSection
        domain="aramco.com"
        emailTrust={emailWith("v=DMARC1; rua=mailto:r@dmarc.gov.sa")}
      />,
    );
    expect(html).toContain("Saudi Trust Context");
    expect(html).toContain("reporting infrastructure");
  });

  it("leads with the context line BEFORE supporting observations", () => {
    const html = renderToStaticMarkup(
      <SaudiTrustContextSection domain="gov.sa" />,
    );
    const contextIdx = html.indexOf("association with Saudi-specific");
    const observationIdx = html.indexOf("Government domain");
    expect(contextIdx).toBeGreaterThan(-1);
    expect(observationIdx).toBeGreaterThan(-1);
    expect(contextIdx).toBeLessThan(observationIdx);
  });

  it("never renders security.txt (excluded from the entire section)", () => {
    const html = renderToStaticMarkup(
      <SaudiTrustContextSection
        domain="com.sa"
        emailTrust={emailWith("v=DMARC1; rua=mailto:r@dmarc.gov.sa", true)}
      />,
    ).toLowerCase();
    expect(html).not.toContain("security.txt");
    expect(html).not.toContain("disclosure");
  });

  it("references Haseen as a context line, NOT the Email section's chip text", () => {
    const html = renderToStaticMarkup(
      <SaudiTrustContextSection
        domain="com.sa"
        emailTrust={emailWith("v=DMARC1; rua=mailto:r@dmarc.gov.sa")}
      />,
    );
    expect(html).toContain("reporting infrastructure");
    // The Email section's exact Haseen text references "dmarc.gov.sa"; the
    // Saudi context reference line must not duplicate it.
    expect(html).not.toContain("dmarc.gov.sa");
  });

  it("emits no verdict / ownership language", () => {
    const text = textOf(
      renderToStaticMarkup(
        <SaudiTrustContextSection
          domain="gov.sa"
          emailTrust={emailWith("v=DMARC1; rua=mailto:r@dmarc.gov.sa")}
        />,
      ),
    ).toLowerCase();
    expect(text).not.toContain("compliant");
    expect(text).not.toContain("certified");
    expect(text).not.toContain("approved");
    expect(text).not.toMatch(/\bis saudi\b/);
    expect(text).not.toContain("saudi-owned");
    expect(text).not.toContain("belongs to");
  });
});
