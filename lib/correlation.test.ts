import { describe, expect, it } from "vitest";
import { deriveCorrelation } from "@/lib/correlation";
import type { EmailTrustIntelligence, ScanResult } from "@/lib/types";

function emailWith(dmarcRecord: string | null): EmailTrustIntelligence {
  return {
    spf: { record: null, observed: false },
    dkim: { selectorsChecked: 0, selectorsFound: [] },
    dmarc: {
      record: dmarcRecord,
      policy: null,
      observed: dmarcRecord !== null,
    },
    dnssec: { dnskeyObserved: null },
    securityTxt: { fileFound: null, expires: null },
    hasEmailSurface: dmarcRecord !== null,
  };
}

function makeResult(
  domain: string,
  emailTrust?: EmailTrustIntelligence,
): ScanResult {
  return { intelligence: { domain }, emailTrust } as unknown as ScanResult;
}

describe("deriveCorrelation", () => {
  it("no correlation when both layers absent", () => {
    const c = deriveCorrelation(makeResult("example.com", emailWith(null)));
    expect(c.hasCorrelation).toBe(false);
    expect(c.layers).toEqual([]);
  });

  it("no correlation with email layer only", () => {
    const c = deriveCorrelation(
      makeResult(
        "example.com",
        emailWith("v=DMARC1; p=none; rua=mailto:r@thirdparty.com"),
      ),
    );
    expect(c.hasCorrelation).toBe(false);
    expect(c.layers).toEqual(["email"]);
  });

  it("no correlation with saudi layer only (TLD)", () => {
    const c = deriveCorrelation(makeResult("gov.sa"));
    expect(c.hasCorrelation).toBe(false);
    expect(c.layers).toEqual(["saudi"]);
  });

  it("correlation when email + saudi via Saudi TLD", () => {
    const c = deriveCorrelation(
      makeResult("com.sa", emailWith("v=DMARC1; rua=mailto:r@dmarc.gov.sa")),
    );
    expect(c.hasCorrelation).toBe(true);
    expect(c.layers).toEqual(["email", "saudi"]);
  });

  it("correlation when email + saudi via Haseen route on non-.sa domain", () => {
    // Principle 59: Haseen counts as Saudi by MEANING, not source.
    const c = deriveCorrelation(
      makeResult("aramco.com", emailWith("v=DMARC1; rua=mailto:r@dmarc.gov.sa")),
    );
    expect(c.hasCorrelation).toBe(true);
    expect(c.layers).toEqual(["email", "saudi"]);
  });

  it("exposes individual layer presence flags", () => {
    const c = deriveCorrelation(
      makeResult("aramco.com", emailWith("v=DMARC1; rua=mailto:r@dmarc.gov.sa")),
    );
    expect(c.emailLayerPresent).toBe(true);
    expect(c.saudiLayerPresent).toBe(true);
  });
});
