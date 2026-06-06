import { describe, it, expect } from "vitest";
import {
  EMAIL_SECTION_COPY,
  SPF_COPY,
  DKIM_COPY,
  DMARC_COPY,
  DNSSEC_COPY,
  SECURITY_TXT_COPY,
} from "@/lib/emailTrustCopy";

describe("Sprint 4 Day 1: Email Trust Copy Guards", () => {
  it("DKIM copy never contains 'valid' (Rule 2)", () => {
    const allDkim = [
      DKIM_COPY.observed.en,
      DKIM_COPY.observed.ar,
      DKIM_COPY.notFound.en,
      DKIM_COPY.notFound.ar,
      DKIM_COPY.limitationFootnote.en,
      DKIM_COPY.limitationFootnote.ar,
    ].join(" ");
    expect(allDkim.toLowerCase()).not.toMatch(/\bvalid\b/);
  });

  it("DKIM observed copy mentions configuration only", () => {
    expect(DKIM_COPY.limitationFootnote.en.toLowerCase()).toContain("configuration");
    expect(DKIM_COPY.limitationFootnote.ar).toContain("التكوين");
  });

  it("security.txt copy never says 'safe' or 'unsafe' (Rule 3)", () => {
    const allSecTxt = [
      SECURITY_TXT_COPY.observed.en,
      SECURITY_TXT_COPY.observed.ar,
      SECURITY_TXT_COPY.absent.en,
      SECURITY_TXT_COPY.absent.ar,
    ]
      .join(" ")
      .toLowerCase();
    expect(allSecTxt).not.toMatch(/\b(safe|unsafe)\b/);
  });

  it("all protocols have both EN and AR copy", () => {
    expect(SPF_COPY.protocolName.en).toBeTruthy();
    expect(SPF_COPY.protocolName.ar).toBeTruthy();
    expect(DKIM_COPY.protocolName.en).toBeTruthy();
    expect(DKIM_COPY.protocolName.ar).toBeTruthy();
    expect(DMARC_COPY.protocolName.en).toBeTruthy();
    expect(DMARC_COPY.protocolName.ar).toBeTruthy();
    expect(DNSSEC_COPY.protocolName.en).toBeTruthy();
    expect(DNSSEC_COPY.protocolName.ar).toBeTruthy();
    expect(SECURITY_TXT_COPY.protocolName.en).toBeTruthy();
    expect(SECURITY_TXT_COPY.protocolName.ar).toBeTruthy();
  });

  it("no copy contains percentage symbols", () => {
    const allCopy = [
      EMAIL_SECTION_COPY.subtitle.en,
      SPF_COPY.observed.en,
      DKIM_COPY.observed.en,
      DMARC_COPY.observed.en,
      DNSSEC_COPY.observed.en,
      SECURITY_TXT_COPY.observed.en,
    ].join(" ");
    expect(allCopy).not.toMatch(/%/);
  });

  it("Arabic copy preserves technical acronyms", () => {
    expect(SPF_COPY.protocolName.ar).toContain("SPF");
    expect(DKIM_COPY.protocolName.ar).toContain("DKIM");
    expect(DMARC_COPY.protocolName.ar).toContain("DMARC");
    expect(DNSSEC_COPY.protocolName.ar).toContain("DNSSEC");
    expect(SECURITY_TXT_COPY.protocolName.ar).toContain("security.txt");
  });
});
