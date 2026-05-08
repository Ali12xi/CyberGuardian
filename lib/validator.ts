import { lookup } from "dns/promises";
import { isIP } from "net";

type ValidationError = {
  en: string;
  ar: string;
};

export type UrlValidationResult = {
  valid: boolean;
  url: string;
  domain: string;
  protocol: string;
  error?: ValidationError;
  blockedReason?: string;
};

const MAX_URL_LENGTH = 2048;
const DNS_TIMEOUT_MS = 5000;
const DNS_RETRY_ATTEMPTS = 2;
const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);

const ERROR_MESSAGES: Record<string, ValidationError> = {
  empty_url: {
    en: "URL is required.",
    ar: "الرابط مطلوب.",
  },
  url_too_long: {
    en: "URL is too long.",
    ar: "الرابط طويل جدًا.",
  },
  malformed_url: {
    en: "The URL format is not valid. Please enter a complete HTTP or HTTPS address.",
    ar: "صيغة URL غير صحيحة. يرجى إدخال عنوان HTTP أو HTTPS كامل.",
  },
  unsupported_protocol: {
    en: "Only HTTP and HTTPS URLs are allowed.",
    ar: "يُسمح فقط بروابط HTTP وHTTPS.",
  },
  credentials_not_allowed: {
    en: "URLs containing credentials are not allowed.",
    ar: "لا يُسمح بالروابط التي تحتوي على بيانات اعتماد.",
  },
  unsupported_port: {
    en: "The URL uses an unsupported port.",
    ar: "الرابط يستخدم منفذًا غير مدعوم.",
  },
  blocked_host: {
    en: "This target cannot be scanned because it points to a private or restricted network.",
    ar: "لا يمكن فحص هذا الهدف لأنه يشير إلى شبكة خاصة أو مقيّدة.",
  },
  dns_failed: {
    en: "We could not resolve this domain. Please confirm the address is reachable and try again.",
    ar: "تعذر حل هذا Domain. يرجى التأكد من أن العنوان قابل للوصول ثم المحاولة مرة أخرى.",
  },
  dns_timeout: {
    en: "Domain resolution took too long. The target may be slow, protected, or temporarily unavailable.",
    ar: "استغرق حل Domain وقتًا طويلًا. قد يكون الهدف بطيئًا أو محميًا أو غير متاح مؤقتًا.",
  },
  dns_private_answer: {
    en: "This domain resolves to a private or restricted network address and cannot be scanned safely.",
    ar: "يشير هذا Domain إلى عنوان شبكة خاص أو مقيّد ولا يمكن فحصه بأمان.",
  },
};

function createResult(
  valid: boolean,
  url = "",
  domain = "",
  protocol = "",
  blockedReason?: string,
): UrlValidationResult {
  return {
    valid,
    url,
    domain,
    protocol,
    ...(blockedReason
      ? {
          error: ERROR_MESSAGES[blockedReason],
          blockedReason,
        }
      : {}),
  };
}

function normalizeHostname(hostname: string) {
  return hostname.replace(/^\[|\]$/g, "").toLowerCase();
}

function isSupportedPort(url: URL) {
  if (!url.port) {
    return true;
  }

  return (
    (url.protocol === "http:" && url.port === "80") ||
    (url.protocol === "https:" && url.port === "443")
  );
}

function parseIPv4(ip: string) {
  const parts = ip.split(".");

  if (parts.length !== 4) {
    return null;
  }

  const octets = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return Number.NaN;
    }

    return Number(part);
  });

  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }

  return octets;
}

function isBlockedIPv4(ip: string) {
  const octets = parseIPv4(ip);

  if (!octets) {
    return true;
  }

  const [first, second, third, fourth] = octets;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224 ||
    (first === 169 && second === 254 && third === 169 && fourth === 254)
  );
}

function expandIPv6(ip: string) {
  const normalized = ip.toLowerCase();

  if (normalized.includes(".")) {
    return null;
  }

  const [leftSide, rightSide] = normalized.split("::");
  const left = leftSide ? leftSide.split(":").filter(Boolean) : [];
  const right = rightSide ? rightSide.split(":").filter(Boolean) : [];

  if (normalized.split("::").length > 2 || left.length + right.length > 8) {
    return null;
  }

  const missing = 8 - left.length - right.length;
  const groups = [...left, ...Array(Math.max(missing, 0)).fill("0"), ...right];

  if (
    groups.length !== 8 ||
    groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))
  ) {
    return null;
  }

  return groups.map((group) => Number.parseInt(group, 16));
}

function isBlockedIPv6(ip: string) {
  const groups = expandIPv6(ip);

  if (!groups) {
    return true;
  }

  const [first, second] = groups;

  return (
    groups.every((group) => group === 0) ||
    (groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1) ||
    (first & 0xfe00) === 0xfc00 ||
    (first & 0xffc0) === 0xfe80 ||
    (first & 0xff00) === 0xff00 ||
    (first === 0x2001 && second === 0x0db8)
  );
}

function isPublicIp(ip: string) {
  const version = isIP(ip);

  if (version === 4) {
    return !isBlockedIPv4(ip);
  }

  if (version === 6) {
    return !isBlockedIPv6(ip);
  }

  return false;
}

function isBlockedHostname(hostname: string) {
  const normalized = normalizeHostname(hostname);

  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local")
  );
}

function debugDnsValidation(
  _hostname: string,
  _event: string,
  _details: Record<string, unknown> = {},
) {
  // Intentionally silent for production readiness. Keep the hook so DNS
  // diagnostics can be wired to a structured sink without changing call sites.
}

async function lookupWithTimeout(hostname: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      lookup(hostname, {
        all: true,
        verbatim: true,
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("dns_timeout")), DNS_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function resolvePublicIps(hostname: string) {
  debugDnsValidation(hostname, "lookup_started");

  let results: Awaited<ReturnType<typeof lookupWithTimeout>> = [];
  let lastError: unknown;

  for (let attempt = 1; attempt <= DNS_RETRY_ATTEMPTS; attempt += 1) {
    try {
      results = await lookupWithTimeout(hostname);
      break;
    } catch (error) {
      lastError = error;
      debugDnsValidation(hostname, "lookup_attempt_failed", {
        attempt,
        reason: error instanceof Error ? error.message : "unknown",
      });

      if (attempt === DNS_RETRY_ATTEMPTS) {
        throw error;
      }
    }
  }

  const resolvedIps = results.map((result) => result.address);

  debugDnsValidation(hostname, "lookup_completed", {
    answerCount: resolvedIps.length,
    families: Array.from(new Set(results.map((result) => result.family))),
  });

  if (resolvedIps.length === 0) {
    debugDnsValidation(hostname, "lookup_empty");
    throw lastError instanceof Error ? lastError : new Error("dns_failed");
  }

  // DNS rebinding defense: every resolved IPv4 and IPv6 answer must be public.
  // Mixed public/private answers are rejected so an attacker cannot smuggle an
  // internal target through a later connection attempt.
  if (!resolvedIps.every(isPublicIp)) {
    debugDnsValidation(hostname, "lookup_blocked_answer", {
      answerCount: resolvedIps.length,
    });
    throw new Error("dns_private_answer");
  }

  return resolvedIps;
}

export async function validateUrl(input: string): Promise<UrlValidationResult> {
  const rawUrl = input.trim();

  if (!rawUrl) {
    return createResult(false, "", "", "", "empty_url");
  }

  if (rawUrl.length > MAX_URL_LENGTH) {
    return createResult(false, "", "", "", "url_too_long");
  }

  let normalizedUrl: URL;

  try {
    normalizedUrl = new URL(rawUrl);
  } catch {
    return createResult(false, "", "", "", "malformed_url");
  }

  normalizedUrl.hash = "";

  const normalizedUrlString = normalizedUrl.toString();
  const domain = normalizeHostname(normalizedUrl.hostname);
  const protocol = normalizedUrl.protocol.replace(":", "");

  if (normalizedUrlString.length > MAX_URL_LENGTH) {
    return createResult(false, normalizedUrlString, domain, protocol, "url_too_long");
  }

  if (!SUPPORTED_PROTOCOLS.has(normalizedUrl.protocol)) {
    return createResult(
      false,
      normalizedUrlString,
      domain,
      protocol,
      "unsupported_protocol",
    );
  }

  if (normalizedUrl.username || normalizedUrl.password) {
    return createResult(
      false,
      normalizedUrlString,
      domain,
      protocol,
      "credentials_not_allowed",
    );
  }

  if (!isSupportedPort(normalizedUrl)) {
    return createResult(
      false,
      normalizedUrlString,
      domain,
      protocol,
      "unsupported_port",
    );
  }

  if (isBlockedHostname(domain)) {
    return createResult(false, normalizedUrlString, domain, protocol, "blocked_host");
  }

  const ipVersion = isIP(domain);

  if (ipVersion && !isPublicIp(domain)) {
    return createResult(false, normalizedUrlString, domain, protocol, "blocked_host");
  }

  if (!ipVersion) {
    try {
      await resolvePublicIps(domain);
    } catch (error) {
      debugDnsValidation(domain, "lookup_failed", {
        reason: error instanceof Error ? error.message : "unknown",
      });

      const reason =
        error instanceof Error && error.message === "dns_timeout"
          ? "dns_timeout"
          : error instanceof Error && error.message === "dns_private_answer"
            ? "dns_private_answer"
            : "dns_failed";

      return createResult(false, normalizedUrlString, domain, protocol, reason);
    }
  }

  return createResult(true, normalizedUrlString, domain, protocol);
}
