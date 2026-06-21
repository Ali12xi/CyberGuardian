import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { generateScanToken, verifyScanToken } from "@/lib/scanToken";
import type { ScanResult } from "@/lib/types";

const TEST_SECRET = "test-secret-must-be-at-least-32-characters-long";

const baseResult = {
  score: 75,
  grade: "B" as const,
  threatLevel: "low" as const,
  intelligence: { domain: "example.com" },
} as unknown as ScanResult;

beforeAll(() => {
  process.env.SCAN_TOKEN_SECRET = TEST_SECRET;
});

afterAll(() => {
  delete process.env.SCAN_TOKEN_SECRET;
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("scanToken — bounded authority delegation", () => {
  it("Valid token round-trip returns the scanId it was issued for", () => {
    const token = generateScanToken("scan-1", baseResult);
    const result = verifyScanToken(token, baseResult);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.scanId).toBe("scan-1");
    }
  });

  it("Different scanIds produce different tokens (with fixed time)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1700000000000);

    const tokenA = generateScanToken("scan-a", baseResult);
    const tokenB = generateScanToken("scan-b", baseResult);

    vi.useRealTimers();

    expect(tokenA).not.toBe(tokenB);
  });

  it("Tampered signature is rejected with signature reason", () => {
    const token = generateScanToken("scan-1", baseResult);
    const [encoded, sig] = token.split(".");
    const tampered = `${encoded}.${sig.slice(0, Math.floor(sig.length / 2))}${sig[Math.floor(sig.length / 2)] === "A" ? "B" : "A"}${sig.slice(Math.floor(sig.length / 2) + 1)}`;

    const result = verifyScanToken(tampered, baseResult);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("signature");
    }
  });

  it("Tampered payload is rejected (signature mismatch)", () => {
    const token = generateScanToken("scan-1", baseResult);
    const [encoded, sig] = token.split(".");
    const tampered = `${encoded.slice(0, -1)}X.${sig}`;

    const result = verifyScanToken(tampered, baseResult);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("signature");
    }
  });

  it("Token without dot separator is rejected as malformed", () => {
    const result = verifyScanToken("not-a-real-token", baseResult);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("malformed");
    }
  });

  it("Token bound to its result: a different scan result is rejected", () => {
    const resultA = { ...baseResult, score: 90 } as unknown as ScanResult;
    const resultB = { ...baseResult, score: 10 } as unknown as ScanResult;

    const token = generateScanToken("scan-1", resultA);
    const verifyResult = verifyScanToken(token, resultB);

    expect(verifyResult.ok).toBe(false);
    if (!verifyResult.ok) {
      expect(verifyResult.reason).toBe("payload_mismatch");
    }
  });

  it("Token within the 15-minute TTL window is accepted", () => {
    vi.useFakeTimers();
    const startTime = 1700000000000;
    vi.setSystemTime(startTime);

    const token = generateScanToken("scan-1", baseResult);
    vi.setSystemTime(startTime + 10 * 60 * 1000);
    const result = verifyScanToken(token, baseResult);

    vi.useRealTimers();

    expect(result.ok).toBe(true);
  });

  it("Token past the 15-minute TTL is rejected as expired", () => {
    vi.useFakeTimers();
    const startTime = 1700000000000;
    vi.setSystemTime(startTime);

    const token = generateScanToken("scan-1", baseResult);
    vi.setSystemTime(startTime + 16 * 60 * 1000);
    const result = verifyScanToken(token, baseResult);

    vi.useRealTimers();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("expired");
    }
  });

  it("Empty token is rejected gracefully without crashing", () => {
    const result = verifyScanToken("", baseResult);

    expect(result.ok).toBe(false);
  });
});
