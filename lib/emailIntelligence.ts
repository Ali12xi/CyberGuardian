/**
 * Sprint 4 Day 2: Email Intelligence Engine
 *
 * Pure data collection. NO interpretation. NO inference.
 * Returns raw observations of email authentication publication.
 *
 * Sacred constraints:
 * - NO interpretation of what observations MEAN
 * - NO scoring contributions
 * - NO "valid" claims for DKIM (observe selectors only)
 * - NO security-posture framing for security.txt (presence/absence only)
 * - NO qualitative framing for SPF or DMARC
 *
 * Mentor Day 2 framing:
 * "Day 2 collects facts. Day 3+ interprets them."
 */

import { resolveTxt } from "node:dns/promises";
import type { EmailTrustIntelligence } from "@/lib/types";

const DKIM_SELECTORS = ["default", "google", "mail", "k1", "s1", "s2"];

const DNS_QUERY_TIMEOUT_MS = 2500;
const HTTP_FETCH_TIMEOUT_MS = 3000;

// Timeout wrapper, null on failure (caller decides meaning).
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T | null> {
  return Promise.race([
    promise.catch(() => null as T | null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

async function queryTxt(domain: string): Promise<string[] | null> {
  const result = await withTimeout(resolveTxt(domain), DNS_QUERY_TIMEOUT_MS);
  if (!result) {
    return null;
  }
  return result.map((chunks) => chunks.join(""));
}

async function collectSpf(domain: string): Promise<{
  record: string | null;
  observed: boolean;
}> {
  const txtRecords = await queryTxt(domain);
  if (txtRecords === null) {
    return { record: null, observed: false };
  }
  const record =
    txtRecords.find((r) => r.toLowerCase().startsWith("v=spf1")) ?? null;
  return { record, observed: true };
}

async function collectDmarc(domain: string): Promise<{
  record: string | null;
  policy: "none" | "quarantine" | "reject" | null;
  observed: boolean;
}> {
  const txtRecords = await queryTxt(`_dmarc.${domain}`);
  if (txtRecords === null) {
    return { record: null, policy: null, observed: false };
  }
  const record = txtRecords.find((r) => r.toLowerCase().startsWith("v=dmarc1"));
  if (!record) {
    return { record: null, policy: null, observed: true };
  }
  const policyMatch = record.match(/p\s*=\s*(none|quarantine|reject)/i);
  const policy = policyMatch
    ? (policyMatch[1].toLowerCase() as "none" | "quarantine" | "reject")
    : null;
  return { record, policy, observed: true };
}

// DKIM collection (selector NAMES only, NEVER signature claims).
async function collectDkim(domain: string): Promise<{
  selectorsChecked: number;
  selectorsFound: string[];
}> {
  const probes = await Promise.allSettled(
    DKIM_SELECTORS.map(async (selector) => {
      const records = await queryTxt(`${selector}._domainkey.${domain}`);
      const hasDkim = records?.some(
        (r) => /v\s*=\s*dkim/i.test(r) || /\bp\s*=/.test(r),
      );
      return hasDkim ? selector : null;
    }),
  );
  const selectorsFound = probes
    .map((p) => (p.status === "fulfilled" ? p.value : null))
    .filter((s): s is string => s !== null);
  return {
    selectorsChecked: DKIM_SELECTORS.length,
    selectorsFound,
  };
}

// DNSSEC collection (bounded honesty — mentor Edit 2).
// If DNSKEY lookup is not reliably supported in the current runtime,
// document the limitation and return dnskeyObserved = null.
// Do not introduce external dependencies.
async function collectDnssec(domain: string): Promise<{
  dnskeyObserved: boolean | null;
}> {
  try {
    const dnsModule = await import("node:dns/promises");
    if (typeof dnsModule.resolve !== "function") {
      return { dnskeyObserved: null };
    }
    const result = await withTimeout(
      dnsModule.resolve(domain, "DNSKEY" as never).catch(() => null),
      DNS_QUERY_TIMEOUT_MS,
    );
    if (result === null) {
      return { dnskeyObserved: null };
    }
    return {
      dnskeyObserved: Array.isArray(result) && result.length > 0,
    };
  } catch {
    // Runtime limitation observed — document via null return.
    return { dnskeyObserved: null };
  }
}

async function collectSecurityTxt(domain: string): Promise<{
  fileFound: boolean | null;
  expires: string | null;
}> {
  const url = `https://${domain}/.well-known/security.txt`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HTTP_FETCH_TIMEOUT_MS);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) {
      return { fileFound: false, expires: null };
    }
    const text = await response.text();
    const expiresMatch = text.match(/^Expires:\s*(.+)$/im);
    return {
      fileFound: true,
      expires: expiresMatch ? expiresMatch[1].trim() : null,
    };
  } catch {
    return { fileFound: null, expires: null };
  }
}

// hasEmailSurface derivation (mentor Edit 3).
//
// hasEmailSurface = true only if any published email-related signal
// EXISTS. A successful DNS query that returned NOTHING does not count.
//
// This prevents an empty section display for static sites.
// Silence > Noise (Sprint 3 principle).
function deriveHasEmailSurface(
  spf: { record: string | null },
  dmarc: { record: string | null },
  dkim: { selectorsFound: string[] },
  dnssec: { dnskeyObserved: boolean | null },
  securityTxt: { fileFound: boolean | null },
): boolean {
  return Boolean(
    spf.record ||
      dmarc.record ||
      dkim.selectorsFound.length > 0 ||
      dnssec.dnskeyObserved === true ||
      securityTxt.fileFound === true,
  );
  // Note: observed=true with no record does NOT trigger surface.
  // "We queried and nothing was there" is not "email surface exists".
}

/**
 * Main entry: collect all email trust observations for a domain.
 * Runs DNS + HTTP probes in parallel.
 *
 * Mentor Day 2 rule: NO interpretation. Just observations.
 */
export async function collectEmailTrust(
  domain: string,
): Promise<EmailTrustIntelligence> {
  const [spf, dmarc, dkim, dnssec, securityTxt] = await Promise.all([
    collectSpf(domain),
    collectDmarc(domain),
    collectDkim(domain),
    collectDnssec(domain),
    collectSecurityTxt(domain),
  ]);

  return {
    spf,
    dmarc,
    dkim,
    dnssec,
    securityTxt,
    hasEmailSurface: deriveHasEmailSurface(
      spf,
      dmarc,
      dkim,
      dnssec,
      securityTxt,
    ),
  };
}
