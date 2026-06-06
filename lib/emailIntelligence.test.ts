import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("node:dns/promises", () => ({
  resolveTxt: vi.fn(),
  resolve: vi.fn(),
}));

const originalFetch = global.fetch;

import { collectEmailTrust } from "@/lib/emailIntelligence";
import { resolveTxt, resolve as dnsResolve } from "node:dns/promises";

describe("Sprint 4 Day 2: Email Intelligence Engine (observation only)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("collects raw observations without interpretation", async () => {
    vi.mocked(resolveTxt).mockImplementation((async (domain: string) => {
      if (domain === "example.com") return [["v=spf1 mx -all"]];
      if (domain === "_dmarc.example.com") return [["v=DMARC1; p=reject; pct=100"]];
      return [];
    }) as unknown as typeof resolveTxt);
    vi.mocked(dnsResolve).mockResolvedValue([] as never);
    global.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);

    const result = await collectEmailTrust("example.com");

    expect(result.spf.record).toBe("v=spf1 mx -all");
    expect(result.spf.observed).toBe(true);
    expect(result.dmarc.record).toContain("v=DMARC1");
    expect(result.dmarc.policy).toBe("reject");
  });

  it("DKIM returns selector names, NEVER signature claims", async () => {
    vi.mocked(resolveTxt).mockImplementation((async (host: string) => {
      if (host === "default._domainkey.example.com") {
        return [["v=DKIM1; k=rsa; p=MIGfMA0..."]];
      }
      if (host === "google._domainkey.example.com") {
        return [["v=DKIM1; k=rsa; p=MIGfMA0..."]];
      }
      return [];
    }) as unknown as typeof resolveTxt);
    vi.mocked(dnsResolve).mockResolvedValue([] as never);
    global.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);

    const result = await collectEmailTrust("example.com");

    expect(result.dkim.selectorsChecked).toBe(6);
    expect(result.dkim.selectorsFound).toContain("default");
    expect(result.dkim.selectorsFound).toContain("google");
    expect(JSON.stringify(result.dkim).toLowerCase()).not.toMatch(/\bvalid\b/);
  });

  it("hasEmailSurface = false when no published signals (silence)", async () => {
    vi.mocked(resolveTxt).mockResolvedValue([] as never);
    vi.mocked(dnsResolve).mockResolvedValue([] as never);
    global.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);

    const result = await collectEmailTrust("static-site.example");

    expect(result.spf.observed).toBe(true);
    expect(result.spf.record).toBe(null);
    expect(result.hasEmailSurface).toBe(false);
  });

  it("hasEmailSurface = true when any signal exists", async () => {
    vi.mocked(resolveTxt).mockImplementation((async (domain: string) => {
      if (domain === "example.com") return [["v=spf1 -all"]];
      return [];
    }) as unknown as typeof resolveTxt);
    vi.mocked(dnsResolve).mockResolvedValue([] as never);
    global.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);

    const result = await collectEmailTrust("example.com");

    expect(result.spf.record).toBe("v=spf1 -all");
    expect(result.hasEmailSurface).toBe(true);
  });

  it("DNS failures return null observations (not exceptions)", async () => {
    vi.mocked(resolveTxt).mockRejectedValue(new Error("ENOTFOUND"));
    vi.mocked(dnsResolve).mockRejectedValue(new Error("ENOTFOUND"));
    global.fetch = vi.fn().mockRejectedValue(new Error("network error"));

    const result = await collectEmailTrust("nonexistent.example");

    expect(result.spf.observed).toBe(false);
    expect(result.spf.record).toBe(null);
    expect(result.dmarc.observed).toBe(false);
    expect(result.dkim.selectorsFound).toEqual([]);
    expect(result.dnssec.dnskeyObserved).toBe(null);
    expect(result.securityTxt.fileFound).toBe(null);
  });

  it("DMARC policy enum extracted (NOT pct as numeric)", async () => {
    vi.mocked(resolveTxt).mockImplementation((async (host: string) => {
      if (host === "_dmarc.test.com") {
        return [["v=DMARC1; p=quarantine; pct=50"]];
      }
      return [];
    }) as unknown as typeof resolveTxt);
    vi.mocked(dnsResolve).mockResolvedValue([] as never);
    global.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);

    const result = await collectEmailTrust("test.com");

    expect(result.dmarc.policy).toBe("quarantine");
    expect(JSON.stringify(result.dmarc)).not.toMatch(/"pct":/);
  });

  it("security.txt fetch extracts Expires field", async () => {
    vi.mocked(resolveTxt).mockResolvedValue([] as never);
    vi.mocked(dnsResolve).mockResolvedValue([] as never);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        "Contact: security@example.com\nExpires: 2026-12-31T23:59:59Z\n",
    } as Response);

    const result = await collectEmailTrust("example.com");

    expect(result.securityTxt.fileFound).toBe(true);
    expect(result.securityTxt.expires).toBe("2026-12-31T23:59:59Z");
    expect(result.hasEmailSurface).toBe(true);
  });
});
