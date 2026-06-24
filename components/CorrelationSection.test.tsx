import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EmailTrustIntelligence, ScanResult } from "@/lib/types";

const mockLang = vi.hoisted(() => ({ language: "en" as "en" | "ar" }));

vi.mock("@/components/LanguageProvider", () => ({
  useLanguage: () => ({ language: mockLang.language }),
}));

import { CorrelationSection } from "@/components/CorrelationSection";

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

describe("CorrelationSection", () => {
  beforeEach(() => {
    mockLang.language = "en";
  });

  it("returns null when there is no correlation", () => {
    const result = makeResult(
      "example.com",
      emailWith("v=DMARC1; p=none; rua=mailto:r@thirdparty.com"),
    );
    const html = renderToStaticMarkup(<CorrelationSection result={result} />);
    expect(html).toBe("");
  });

  it("renders intro and both layer labels in English", () => {
    mockLang.language = "en";
    const result = makeResult(
      "aramco.com",
      emailWith("v=DMARC1; rua=mailto:r@dmarc.gov.sa"),
    );
    const html = renderToStaticMarkup(<CorrelationSection result={result} />);
    expect(html).toContain(
      "Independent observation layers were detected together for this domain.",
    );
    expect(html).toContain("Email Identity observations detected");
    expect(html).toContain("Saudi Context observations detected");
  });

  it("renders Arabic copy with RTL direction", () => {
    mockLang.language = "ar";
    const result = makeResult(
      "aramco.com",
      emailWith("v=DMARC1; rua=mailto:r@dmarc.gov.sa"),
    );
    const html = renderToStaticMarkup(<CorrelationSection result={result} />);
    expect(html).toContain("رُصدت طبقات ملاحظة مستقلة معاً لهذا النطاق.");
    expect(html).toContain("تم رصد ملاحظات هوية البريد");
    expect(html).toContain("تم رصد ملاحظات السياق السعودي");
    expect(html).toContain('dir="rtl"');
  });
});
