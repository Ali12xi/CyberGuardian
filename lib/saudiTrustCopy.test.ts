import { describe, expect, it } from "vitest";
import {
  SAUDI_CONTEXT_SECTION,
  SAUDI_REPORTING_LINE,
  SAUDI_TLD_COPY,
} from "@/lib/saudiTrustCopy";

const EN_STRINGS = [
  SAUDI_CONTEXT_SECTION.kicker.en,
  SAUDI_CONTEXT_SECTION.title.en,
  SAUDI_CONTEXT_SECTION.contextLine.en,
  ...Object.values(SAUDI_TLD_COPY).map((c) => c.en),
  SAUDI_REPORTING_LINE.en,
];

const AR_STRINGS = [
  SAUDI_CONTEXT_SECTION.kicker.ar,
  SAUDI_CONTEXT_SECTION.title.ar,
  SAUDI_CONTEXT_SECTION.contextLine.ar,
  ...Object.values(SAUDI_TLD_COPY).map((c) => c.ar),
  SAUDI_REPORTING_LINE.ar,
];

const ALL_EN = EN_STRINGS.join(" ").toLowerCase();
const ALL_LATIN = [...EN_STRINGS, ...AR_STRINGS].join(" ").toLowerCase();

describe("saudiTrustCopy vocabulary discipline", () => {
  it("contains no compliance/regulatory claims (EN + AR latin tokens)", () => {
    for (const word of [
      "compliant",
      "certified",
      "approved",
      "pdpl",
      "nca",
      "sama",
    ]) {
      expect(ALL_LATIN).not.toContain(word);
    }
  });

  it("contains no ownership/verdict language", () => {
    expect(ALL_EN).not.toMatch(/\bis saudi\b/);
    expect(ALL_EN).not.toContain("saudi-owned");
    expect(ALL_EN).not.toContain("belongs to");
    expect(ALL_EN).not.toMatch(/saudi (company|organization)/);
  });

  it("uses 'association', never 'participation'", () => {
    expect(ALL_EN).toContain("association");
    expect(ALL_EN).not.toContain("participation");
  });

  it("uses context language (observed / indicate)", () => {
    expect(ALL_EN).toContain("observed");
    expect(ALL_EN).toContain("indicate");
  });

  it("is bilingual and complete", () => {
    expect(SAUDI_CONTEXT_SECTION.contextLine.en.length).toBeGreaterThan(0);
    expect(SAUDI_CONTEXT_SECTION.contextLine.ar.length).toBeGreaterThan(0);
    expect(SAUDI_REPORTING_LINE.en.length).toBeGreaterThan(0);
    expect(SAUDI_REPORTING_LINE.ar.length).toBeGreaterThan(0);
    for (const copy of Object.values(SAUDI_TLD_COPY)) {
      expect(copy.en.length).toBeGreaterThan(0);
      expect(copy.ar.length).toBeGreaterThan(0);
    }
  });
});
