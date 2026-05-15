import type { RedirectAnalysis, RedirectIntent, RedirectStep } from "@/lib/types";

export const EMPTY_REDIRECT_ANALYSIS: RedirectAnalysis = {
  hops: 0,
  intent: "standard",
  chain: [],
  crossDomain: false,
};

/**
 * Multi-part public suffixes (longest first) for registrable-domain comparison.
 * Evidence-based internet infrastructure list — not a site allowlist.
 */
const MULTI_PART_PUBLIC_SUFFIXES = [
  "police.uk",
  "nhs.uk",
  "sch.uk",
  "ac.uk",
  "gov.uk",
  "net.uk",
  "org.uk",
  "co.uk",
  "edu.au",
  "id.au",
  "asn.au",
  "org.au",
  "net.au",
  "com.au",
  "gov.au",
  "ac.nz",
  "govt.nz",
  "org.nz",
  "net.nz",
  "co.nz",
  "ac.jp",
  "ad.jp",
  "ed.jp",
  "go.jp",
  "ne.jp",
  "or.jp",
  "co.jp",
  "org.br",
  "net.br",
  "com.br",
  "com.ar",
  "co.za",
  "net.za",
  "org.za",
  "com.mx",
  "co.in",
  "net.in",
  "org.in",
  "com.sg",
  "com.hk",
  "com.tw",
  "com.tr",
  "com.co",
  "org.lk",
].sort((a, b) => b.length - a.length);

function isIPv4Host(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

/** Registrable eTLD+1-style label for comparing whether redirects stay within the same site. */
export function getRegistrableDomainForRedirect(host: string): string {
  const h = host.toLowerCase();
  if (isIPv4Host(h) || h.includes(":")) {
    return h;
  }

  const parts = h.split(".").filter(Boolean);
  if (parts.length < 2) {
    return h;
  }

  for (const suffix of MULTI_PART_PUBLIC_SUFFIXES) {
    const suffixParts = suffix.split(".");
    const k = suffixParts.length;
    if (parts.length <= k) {
      continue;
    }
    if (parts.slice(-k).join(".") === suffix) {
      return parts.slice(-(k + 1)).join(".");
    }
  }

  return parts.slice(-2).join(".");
}

function stripLeadingWww(host: string): string {
  const lower = host.toLowerCase();
  return lower.startsWith("www.") ? lower.slice(4) : lower;
}

/** Apex ↔ www and trivial hostname equivalence (same registrable + www normalization). */
export function isApexWwwOrSameHost(a: string, b: string): boolean {
  return stripLeadingWww(a) === stripLeadingWww(b);
}

export function mergeRedirectIntent(left: RedirectIntent, right: RedirectIntent): RedirectIntent {
  const rank: Record<RedirectIntent, number> = {
    standard: 0,
    infrastructure: 1,
    suspicious: 2,
  };

  return rank[left] >= rank[right] ? left : right;
}

/**
 * Classify a single redirect hop using URL semantics only (no domain allowlists).
 */
export function classifyRedirectHop(fromUrl: string, toUrl: string): RedirectIntent {
  let from: URL;
  let to: URL;

  try {
    from = new URL(fromUrl);
    to = new URL(toUrl);
  } catch {
    return "suspicious";
  }

  const fromHost = from.hostname.toLowerCase();
  const toHost = to.hostname.toLowerCase();

  if (fromHost === toHost) {
    return "standard";
  }

  if (isIPv4Host(toHost) || toHost.includes(":")) {
    return "suspicious";
  }

  const regFrom = getRegistrableDomainForRedirect(fromHost);
  const regTo = getRegistrableDomainForRedirect(toHost);

  if (regFrom === regTo) {
    if (isApexWwwOrSameHost(fromHost, toHost)) {
      return "standard";
    }
    return "infrastructure";
  }

  return "suspicious";
}

function distinctRegistrableCount(urls: string[]): number {
  const seen = new Set<string>();

  for (const url of urls) {
    try {
      seen.add(getRegistrableDomainForRedirect(new URL(url).hostname.toLowerCase()));
    } catch {
      seen.add("__invalid__");
    }
  }

  return seen.size;
}

export function chainHasCrossRegistrableDomain(chainUrls: string[]): boolean {
  for (let index = 0; index < chainUrls.length - 1; index += 1) {
    try {
      const a = getRegistrableDomainForRedirect(new URL(chainUrls[index]!).hostname.toLowerCase());
      const b = getRegistrableDomainForRedirect(new URL(chainUrls[index + 1]!).hostname.toLowerCase());
      if (a !== b) {
        return true;
      }
    } catch {
      return true;
    }
  }

  return false;
}

export type RedirectAnalysisFlags = {
  loop: boolean;
  maxDepthExceeded: boolean;
  validationFailed: boolean;
};

export function finalizeRedirectAnalysis(
  chain: RedirectStep[],
  hopWorst: RedirectIntent,
  flags: RedirectAnalysisFlags,
): RedirectAnalysis {
  const urls = chain.map((step) => step.url);
  const crossDomain = chainHasCrossRegistrableDomain(urls);

  let intent = hopWorst;
  if (flags.loop || flags.maxDepthExceeded || flags.validationFailed) {
    intent = "suspicious";
  }
  if (distinctRegistrableCount(urls) >= 3) {
    intent = "suspicious";
  }

  return {
    hops: chain.length,
    intent,
    chain: urls,
    crossDomain,
  };
}
