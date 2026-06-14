import { describe, expect, it } from "vitest";
import { deriveSaudiSignals, detectSaudiTld } from "@/lib/saudiTrustContext";
import type { EmailTrustIntelligence } from "@/lib/types";

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

describe("detectSaudiTld", () => {
  it("classifies collapsed registrable forms (from getRegistrableDomain)", () => {
    expect(detectSaudiTld("gov.sa")).toBe("gov.sa");
    expect(detectSaudiTld("edu.sa")).toBe("edu.sa");
    expect(detectSaudiTld("com.sa")).toBe("com.sa");
    expect(detectSaudiTld("stc.sa")).toBe("sa");
  });

  it("classifies preserved forms via endsWith", () => {
    expect(detectSaudiTld("nca.gov.sa")).toBe("gov.sa");
    expect(detectSaudiTld("kacst.edu.sa")).toBe("edu.sa");
    expect(detectSaudiTld("riyadbank.com.sa")).toBe("com.sa");
    expect(detectSaudiTld("example.sa")).toBe("sa");
  });

  it("preserves order: specific (.gov.sa) before general (.sa)", () => {
    expect(detectSaudiTld("portal.nca.gov.sa")).toBe("gov.sa");
  });

  it("returns none for non-Saudi domains", () => {
    expect(detectSaudiTld("example.com")).toBe("none");
    expect(detectSaudiTld("aramco.com")).toBe("none");
    expect(detectSaudiTld("test.usa")).toBe("none"); // ".usa" is not ".sa"
  });
});

describe("deriveSaudiSignals", () => {
  it("TLD-only government, no email surface", () => {
    const s = deriveSaudiSignals({ domain: "gov.sa" });
    expect(s.tld).toBe("gov.sa");
    expect(s.isGovernment).toBe(true);
    expect(s.hasHaseenSignal).toBe(false);
    expect(s.hasSaudiContext).toBe(true);
  });

  it(".sa-only still triggers when emailTrust is undefined", () => {
    const s = deriveSaudiSignals({ domain: "stc.sa" });
    expect(s.tld).toBe("sa");
    expect(s.isGovernment).toBe(false);
    expect(s.hasSaudiContext).toBe(true);
  });

  it("Haseen-only (.com + dmarc.gov.sa — aramco case)", () => {
    const s = deriveSaudiSignals({
      domain: "aramco.com",
      emailTrust: emailWith("v=DMARC1; p=reject; rua=mailto:r@dmarc.gov.sa"),
    });
    expect(s.tld).toBe("none");
    expect(s.hasHaseenSignal).toBe(true);
    expect(s.hasSaudiContext).toBe(true);
  });

  it("both TLD and Haseen present", () => {
    const s = deriveSaudiSignals({
      domain: "com.sa",
      emailTrust: emailWith("v=DMARC1; rua=mailto:r@dmarc.gov.sa"),
    });
    expect(s.tld).toBe("com.sa");
    expect(s.hasHaseenSignal).toBe(true);
    expect(s.hasSaudiContext).toBe(true);
  });

  it("neither signal → silent", () => {
    const s = deriveSaudiSignals({
      domain: "example.com",
      emailTrust: emailWith("v=DMARC1; p=none; rua=mailto:r@thirdparty.com"),
    });
    expect(s.hasSaudiContext).toBe(false);
  });

  it("third-party reporting (sa.dmarc360.com) does NOT trigger Haseen", () => {
    const s = deriveSaudiSignals({
      domain: "example.com",
      emailTrust: emailWith("v=DMARC1; rua=mailto:r@sa.dmarc360.com"),
    });
    expect(s.hasHaseenSignal).toBe(false);
    expect(s.hasSaudiContext).toBe(false);
  });
});
