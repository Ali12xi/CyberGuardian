import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { EmailIdentitySection } from "@/components/EmailIdentitySection";
import { getHaseenInterpretation } from "@/lib/emailTrustInterpretation";
import type { EmailTrustIntelligence } from "@/lib/types";

vi.mock("@/components/LanguageProvider", () => ({
  useLanguage: () => ({ language: "en" }),
}));

// Strip tags/attributes so vocabulary guards inspect visible copy only,
// not className tokens like "bidi-safe".
function textOf(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

const NO_SURFACE: EmailTrustIntelligence = {
  spf: { record: null, observed: false },
  dkim: { selectorsChecked: 0, selectorsFound: [] },
  dmarc: { record: null, policy: null, observed: false },
  dnssec: { dnskeyObserved: null },
  securityTxt: { fileFound: null, expires: null },
  hasEmailSurface: false,
};

const WITH_HASEEN: EmailTrustIntelligence = {
  spf: { record: "v=spf1 include:_spf.example.sa -all", observed: true },
  dkim: { selectorsChecked: 6, selectorsFound: ["s1", "s2"] },
  dmarc: {
    record: "v=DMARC1; p=reject; rua=mailto:rua@dmarc.gov.sa",
    policy: "reject",
    observed: true,
  },
  dnssec: { dnskeyObserved: true },
  securityTxt: { fileFound: true, expires: "2027-01-01T00:00:00Z" },
  hasEmailSurface: true,
};

const NO_HASEEN_SPF_ABSENT: EmailTrustIntelligence = {
  spf: { record: null, observed: true },
  dkim: { selectorsChecked: 6, selectorsFound: [] },
  dmarc: { record: "v=DMARC1; p=quarantine", policy: "quarantine", observed: true },
  dnssec: { dnskeyObserved: null },
  securityTxt: { fileFound: false, expires: null },
  hasEmailSurface: true,
};

describe("EmailIdentitySection — Sprint 4 Day 4", () => {
  it("returns null when there is no email surface", () => {
    const html = renderToStaticMarkup(<EmailIdentitySection emailTrust={NO_SURFACE} />);
    expect(html).toBe("");
  });

  it("returns null when emailTrust is undefined", () => {
    const html = renderToStaticMarkup(<EmailIdentitySection emailTrust={undefined} />);
    expect(html).toBe("");
  });

  it("renders all five protocol rows when a surface exists", () => {
    const html = renderToStaticMarkup(<EmailIdentitySection emailTrust={WITH_HASEEN} />);
    expect(html).toContain("Email Identity Intelligence");
    expect(html).toContain("(SPF)");
    expect(html).toContain("(DMARC)");
    expect(html).toContain("(DKIM)");
    expect(html).toContain("(DNSSEC)");
    expect(html).toContain("security.txt");
  });

  it("always renders the DKIM limitation footnote, even when DKIM is absent", () => {
    const html = renderToStaticMarkup(
      <EmailIdentitySection emailTrust={NO_HASEEN_SPF_ABSENT} />,
    );
    expect(html).toContain("we observe configuration only");
  });

  it("renders the Haseen observation chip when haseenPattern is true", () => {
    const html = renderToStaticMarkup(<EmailIdentitySection emailTrust={WITH_HASEEN} />);
    expect(html).toContain(getHaseenInterpretation("en"));
  });

  it("omits the Haseen chip when haseenPattern is false", () => {
    const html = renderToStaticMarkup(
      <EmailIdentitySection emailTrust={NO_HASEEN_SPF_ABSENT} />,
    );
    expect(html).not.toContain(getHaseenInterpretation("en"));
  });

  it("renders the absent SPF row (absence is itself an observation)", () => {
    const html = renderToStaticMarkup(
      <EmailIdentitySection emailTrust={NO_HASEEN_SPF_ABSENT} />,
    );
    expect(html).toContain("(SPF)");
    expect(html).toContain("No SPF record published");
  });

  it("never emits score / grade / rating language", () => {
    const text = textOf(
      renderToStaticMarkup(<EmailIdentitySection emailTrust={WITH_HASEEN} />),
    );
    expect(text).not.toMatch(/email score/i);
    expect(text).not.toMatch(/\bgrade\b/i);
    expect(text).not.toMatch(/\brating\b/i);
  });

  it("never emits verdict language", () => {
    const text = textOf(
      renderToStaticMarkup(<EmailIdentitySection emailTrust={WITH_HASEEN} />) +
        renderToStaticMarkup(<EmailIdentitySection emailTrust={NO_HASEEN_SPF_ABSENT} />),
    );
    expect(text).not.toMatch(/\bsecure\b/i);
    expect(text).not.toMatch(/\bsafe\b/i);
    expect(text).not.toMatch(/\btrusted\b/i);
    expect(text).not.toMatch(/\bprotected\b/i);
  });

  it("never claims DKIM signatures are valid", () => {
    const text = textOf(
      renderToStaticMarkup(<EmailIdentitySection emailTrust={WITH_HASEEN} />) +
        renderToStaticMarkup(<EmailIdentitySection emailTrust={NO_HASEEN_SPF_ABSENT} />),
    );
    expect(text).not.toMatch(/\bvalid\b/i);
  });

  it("shows the DKIM count only, never selector names", () => {
    const html = renderToStaticMarkup(<EmailIdentitySection emailTrust={WITH_HASEEN} />);
    expect(html).toContain("2 of 6");
    expect(html).not.toContain("s1");
    expect(html).not.toContain("s2");
  });
});
