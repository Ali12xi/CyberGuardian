import { createHash, createHmac, timingSafeEqual } from "crypto";

import type { ScanResult } from "@/lib/types";

const TOKEN_TTL_MS = 15 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.SCAN_TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SCAN_TOKEN_SECRET not set or too short (min 32 characters)");
  }
  return secret;
}

export type HashableScanCore = {
  score: number;
  grade: string;
  threatLevel: string;
  domain: string;
};

/** Deterministic hash of core scan fields bound into the token. */
export function hashScanPayload(result: HashableScanCore): string {
  const canonical = JSON.stringify({
    score: result.score,
    grade: result.grade,
    threatLevel: result.threatLevel,
    domain: result.domain,
  });

  return createHash("sha256").update(canonical, "utf8").digest("base64url");
}

type ScanTokenPayload = {
  scanId: string;
  payloadHash: string;
  issuedAt: number;
};

export type ScanTokenVerifyFailure =
  | "malformed"
  | "signature"
  | "expired"
  | "payload_mismatch"
  | "decode_error"
  | "secret_error";

export type VerifyScanTokenResult =
  | { ok: true; scanId: string }
  | { ok: false; reason: ScanTokenVerifyFailure };

function timingSafeEqualBase64Url(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "base64url");
    const bufB = Buffer.from(b, "base64url");

    if (bufA.length !== bufB.length) {
      return false;
    }

    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function generateScanToken(scanId: string, result: ScanResult): string {
  const payload: ScanTokenPayload = {
    scanId,
    payloadHash: hashScanPayload({
      score: result.score,
      grade: result.grade,
      threatLevel: result.threatLevel,
      domain: result.intelligence?.domain ?? "",
    }),
    issuedAt: Date.now(),
  };

  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const expectedSig = createHmac("sha256", getSecret()).update(encoded, "utf8").digest("base64url");

  return `${encoded}.${expectedSig}`;
}

export function verifyScanToken(token: string, result: ScanResult): VerifyScanTokenResult {
  let secret: string;

  try {
    secret = getSecret();
  } catch {
    return { ok: false, reason: "secret_error" };
  }

  try {
    const [encoded, sig] = token.split(".");

    if (!encoded || !sig) {
      return { ok: false, reason: "malformed" };
    }

    const expectedSig = createHmac("sha256", secret).update(encoded, "utf8").digest("base64url");

    if (!timingSafeEqualBase64Url(sig, expectedSig)) {
      return { ok: false, reason: "signature" };
    }

    let payload: ScanTokenPayload;

    try {
      payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as ScanTokenPayload;
    } catch {
      return { ok: false, reason: "decode_error" };
    }

    if (
      typeof payload.scanId !== "string" ||
      typeof payload.payloadHash !== "string" ||
      typeof payload.issuedAt !== "number"
    ) {
      return { ok: false, reason: "malformed" };
    }

    if (Date.now() - payload.issuedAt > TOKEN_TTL_MS) {
      return { ok: false, reason: "expired" };
    }

    const expectedHash = hashScanPayload({
      score: result.score,
      grade: result.grade,
      threatLevel: result.threatLevel,
      domain: result.intelligence?.domain ?? "",
    });

    if (payload.payloadHash !== expectedHash) {
      return { ok: false, reason: "payload_mismatch" };
    }

    return { ok: true, scanId: payload.scanId };
  } catch {
    return { ok: false, reason: "decode_error" };
  }
}