import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { validateUrl } from "@/lib/validator";
import { lookup } from "dns/promises";

vi.mock("dns/promises", () => ({
  lookup: vi.fn(),
}));

const mockedLookup = lookup as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("validateUrl — SSRF defense perimeter", () => {
  // ── ALLOW: bounded public-trust perimeter ──
  it("Public HTTPS hostname is allowed for scanning", async () => {
    mockedLookup.mockResolvedValue([{ address: "8.8.8.8", family: 4 }]);

    const result = await validateUrl("https://example.com");

    expect(result.valid).toBe(true);
  });

  it("Public IPv4 literal is allowed for scanning", async () => {
    const result = await validateUrl("http://8.8.8.8");

    expect(result.valid).toBe(true);
  });

  it("Public IPv6 literal is allowed for scanning", async () => {
    const result = await validateUrl("http://[2001:4860:4860::8888]");

    expect(result.valid).toBe(true);
  });

  it("Default HTTPS port (443) is normalized to allowed", async () => {
    mockedLookup.mockResolvedValue([{ address: "8.8.8.8", family: 4 }]);

    const result = await validateUrl("https://example.com:443");

    expect(result.valid).toBe(true);
  });

  // ── DNS rebinding defense ──
  it("DNS rebinding defense: mixed public+private answers are rejected", async () => {
    mockedLookup.mockResolvedValue([
      { address: "8.8.8.8", family: 4 },
      { address: "10.0.0.1", family: 4 },
    ]);

    const result = await validateUrl("https://example.com");

    expect(result.valid).toBe(false);
    expect(result.blockedReason).toBe("dns_private_answer");
  });

  // ── BLOCK: IPv4 private / reserved ──
  it("Private network 10.x range is blocked", async () => {
    const result = await validateUrl("http://10.0.0.1");

    expect(result.valid).toBe(false);
    expect(result.blockedReason).toBe("blocked_host");
  });

  it("Private network 172.16/12 range is blocked", async () => {
    const result = await validateUrl("http://172.16.0.1");

    expect(result.valid).toBe(false);
    expect(result.blockedReason).toBe("blocked_host");
  });

  it("Private network 192.168.x range is blocked", async () => {
    const result = await validateUrl("http://192.168.1.1");

    expect(result.valid).toBe(false);
    expect(result.blockedReason).toBe("blocked_host");
  });

  it("Cloud metadata endpoint (169.254.169.254) is blocked", async () => {
    const result = await validateUrl("http://169.254.169.254");

    expect(result.valid).toBe(false);
    expect(result.blockedReason).toBe("blocked_host");
  });

  it("IPv4 loopback (127.0.0.1) is blocked", async () => {
    const result = await validateUrl("http://127.0.0.1");

    expect(result.valid).toBe(false);
    expect(result.blockedReason).toBe("blocked_host");
  });

  // ── BLOCK: IPv6 private / reserved ──
  it("IPv6 loopback (::1) is blocked", async () => {
    const result = await validateUrl("http://[::1]");

    expect(result.valid).toBe(false);
    expect(result.blockedReason).toBe("blocked_host");
  });

  it("IPv6 link-local (fe80::) is blocked", async () => {
    const result = await validateUrl("http://[fe80::1]");

    expect(result.valid).toBe(false);
    expect(result.blockedReason).toBe("blocked_host");
  });

  it("IPv6 unique-local (fc00::) is blocked", async () => {
    const result = await validateUrl("http://[fc00::1]");

    expect(result.valid).toBe(false);
    expect(result.blockedReason).toBe("blocked_host");
  });

  // ── BLOCK: normalization / scope / encoding tricks ──
  it("Normalization bypass: trailing-dot localhost (localhost.) is rejected", async () => {
    // Defense-in-depth: not matched by the static hostname rule, so it falls
    // to DNS; resolving to loopback is rejected by the answer validation.
    mockedLookup.mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);

    const result = await validateUrl("http://localhost.");

    expect(result.valid).toBe(false);
    expect(result.blockedReason).not.toBeUndefined();
  });

  it("Scanner scope remains constrained to standard web ports", async () => {
    const result = await validateUrl("https://example.com:8443");

    expect(result.valid).toBe(false);
    expect(result.blockedReason).toBe("unsupported_port");
  });

  it("Alternate loopback encoding (decimal 2130706433 = 127.0.0.1) is rejected", async () => {
    // Safety net: if the host is not canonicalized to an IP literal, the DNS
    // answer-validation layer rejects the loopback resolution.
    mockedLookup.mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);

    const result = await validateUrl("http://2130706433");

    expect(result.valid).toBe(false);
    expect(result.blockedReason).not.toBeUndefined();
  });

  // ── BLOCK: protocol misuse ──
  it("Non-web protocol (file://) is rejected", async () => {
    const result = await validateUrl("file:///etc/passwd");

    expect(result.valid).toBe(false);
    expect(result.blockedReason).toBe("unsupported_protocol");
  });

  it("Non-web protocol (ftp://) is rejected", async () => {
    const result = await validateUrl("ftp://example.com");

    expect(result.valid).toBe(false);
    expect(result.blockedReason).toBe("unsupported_protocol");
  });
});
