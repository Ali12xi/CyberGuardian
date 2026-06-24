import { describe, it, expect } from "vitest";
import {
  interpretSpf,
  interpretDmarc,
  interpretDkim,
  interpretDnssec,
  interpretSecurityTxt,
  detectHaseenPattern,
  getSpfInterpretation,
  getDmarcInterpretation,
  getHaseenInterpretation,
} from "@/lib/emailTrustInterpretation";

const FIXTURE = {
  spf_strict: { record: "v=spf1 -all", observed: true },
  spf_softfail: { record: "v=spf1 mx ip4:193.27.7.13 ~all", observed: true },
  spf_absent: { record: null, observed: true },
  spf_failed: { record: null, observed: false },
  dmarc_reject: {
    record: "v=DMARC1; p=reject; rua=mailto:rua@sa.dmarc360.com",
    policy: "reject" as const,
    observed: true,
  },
  dmarc_haseen: {
    record: "v=DMARC1; p=reject; rua=mailto:haseen@rua.dmarc.gov.sa",
    policy: "reject" as const,
    observed: true,
  },
  dmarc_quarantine: {
    record: "v=DMARC1; p=quarantine; rua=mailto:foo@bar.com",
    policy: "quarantine" as const,
    observed: true,
  },
  dmarc_absent: { record: null, policy: null, observed: true },
  dmarc_failed: { record: null, policy: null, observed: false },
  dkim_found: { selectorsChecked: 6, selectorsFound: ["s2", "k1"] },
  dkim_empty: { selectorsChecked: 6, selectorsFound: [] },
  dnssec_null: { dnskeyObserved: null },
  dnssec_absent: { dnskeyObserved: false },
  dnssec_observed: { dnskeyObserved: true },
  securityTxt_null: { fileFound: null, expires: null },
  securityTxt_found: { fileFound: true, expires: "2026-12-31T23:59:00Z" },
  securityTxt_absent: { fileFound: false, expires: null },
};

describe("Sprint 4 Day 3: Email Trust Interpretation Layer", () => {
  describe("SPF — state + qualifier separation", () => {
    it("strict (-all): state=observed, qualifier=strict", () => {
      const r = interpretSpf(FIXTURE.spf_strict);
      expect(r.state).toBe("observed");
      expect(r.qualifier).toBe("strict");
    });

    it("softfail (~all): state=observed, qualifier=softfail", () => {
      const r = interpretSpf(FIXTURE.spf_softfail);
      expect(r.state).toBe("observed");
      expect(r.qualifier).toBe("softfail");
    });

    it("absent: state=absent, qualifier=null", () => {
      const r = interpretSpf(FIXTURE.spf_absent);
      expect(r.state).toBe("absent");
      expect(r.qualifier).toBeNull();
    });

    it("query failed: state=indeterminate (bounded honesty)", () => {
      const r = interpretSpf(FIXTURE.spf_failed);
      expect(r.state).toBe("indeterminate");
    });

    it("copy describes behavior, never quality verdict", () => {
      const r = interpretSpf(FIXTURE.spf_strict);
      const copy = getSpfInterpretation(r, "en");
      expect(copy.toLowerCase()).not.toMatch(/\b(secure|safe|protected|good)\b/);
    });
  });

  describe("DMARC", () => {
    it("p=reject: state=observed, policy=reject", () => {
      const r = interpretDmarc(FIXTURE.dmarc_reject);
      expect(r.state).toBe("observed");
      expect(r.policy).toBe("reject");
    });

    it("p=quarantine: state=observed, policy=quarantine", () => {
      const r = interpretDmarc(FIXTURE.dmarc_quarantine);
      expect(r.state).toBe("observed");
      expect(r.policy).toBe("quarantine");
    });

    it("absent: state=absent", () => {
      const r = interpretDmarc(FIXTURE.dmarc_absent);
      expect(r.state).toBe("absent");
    });

    it("query failed: state=indeterminate", () => {
      const r = interpretDmarc(FIXTURE.dmarc_failed);
      expect(r.state).toBe("indeterminate");
    });

    it("copy: instruction framing, never verdict", () => {
      const r = interpretDmarc(FIXTURE.dmarc_reject);
      const copy = getDmarcInterpretation(r, "en");
      expect(copy.toLowerCase()).not.toMatch(/\b(secure|safe|protected|trusted)\b/);
      expect(copy.toLowerCase()).toContain("instructing");
    });
  });

  describe("Haseen pattern detection", () => {
    it("detects dmarc.gov.sa", () => {
      expect(detectHaseenPattern(FIXTURE.dmarc_haseen)).toBe(true);
    });

    it("no Haseen in non-Saudi record", () => {
      expect(detectHaseenPattern(FIXTURE.dmarc_reject)).toBe(false);
    });

    it("copy uses 'references' not 'participation'", () => {
      const copy = getHaseenInterpretation("en");
      expect(copy.toLowerCase()).toContain("reference");
      expect(copy.toLowerCase()).not.toContain("participation");
    });

    it("copy: observation framing, never verdict", () => {
      const copy = getHaseenInterpretation("en");
      expect(copy.toLowerCase()).not.toMatch(/\b(secure|trusted|verified)\b/);
    });

    it("AR copy: contains dmarc.gov.sa LTR", () => {
      const copy = getHaseenInterpretation("ar");
      expect(copy).toContain("dmarc.gov.sa");
    });
  });

  describe("DKIM (Rule 2 forever — never 'valid')", () => {
    it("selectors found: state=observed", () => {
      const r = interpretDkim(FIXTURE.dkim_found);
      expect(r.state).toBe("observed");
      expect(r.selectorsFound).toBe(2);
    });

    it("empty selectors: state=absent", () => {
      const r = interpretDkim(FIXTURE.dkim_empty);
      expect(r.state).toBe("absent");
    });

    it("DKIM result never contains 'valid'", () => {
      const r = interpretDkim(FIXTURE.dkim_found);
      expect(JSON.stringify(r).toLowerCase()).not.toMatch(/\bvalid\b/);
    });
  });

  describe("DNSSEC bounded honesty", () => {
    it("null: state=indeterminate", () => {
      expect(interpretDnssec(FIXTURE.dnssec_null).state).toBe("indeterminate");
    });

    it("false: state=absent", () => {
      expect(interpretDnssec(FIXTURE.dnssec_absent).state).toBe("absent");
    });

    it("true: state=observed", () => {
      expect(interpretDnssec(FIXTURE.dnssec_observed).state).toBe("observed");
    });
  });

  describe("security.txt", () => {
    it("null: state=indeterminate", () => {
      expect(interpretSecurityTxt(FIXTURE.securityTxt_null).state).toBe(
        "indeterminate",
      );
    });

    it("found: state=observed, expires preserved", () => {
      const r = interpretSecurityTxt(FIXTURE.securityTxt_found);
      expect(r.state).toBe("observed");
      expect(r.expires).toBe("2026-12-31T23:59:00Z");
    });

    it("not found: state=absent", () => {
      expect(interpretSecurityTxt(FIXTURE.securityTxt_absent).state).toBe(
        "absent",
      );
    });
  });

  describe("No Email Score guarantee", () => {
    it("interpretSpf: no score/grade/rating fields", () => {
      const json = JSON.stringify(interpretSpf(FIXTURE.spf_strict));
      expect(json).not.toMatch(/"score":|"grade":|"rating":/);
    });

    it("interpretDmarc: no score/grade/rating fields", () => {
      const json = JSON.stringify(interpretDmarc(FIXTURE.dmarc_reject));
      expect(json).not.toMatch(/"score":|"grade":|"rating":/);
    });
  });
});
