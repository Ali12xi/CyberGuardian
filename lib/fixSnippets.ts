import type { RemediationEntry, RemediationFindingId } from "@/lib/remediation";
import { quickFixSnippetsAsBase } from "@/lib/findingFixes";

export type FixPlatform = "nginx" | "apache" | "nextjs" | "express" | "cloudflare" | "vercel";

export type FixSnippet = {
  platform: FixPlatform;
  label: string;
  code: string;
};

export const FIX_TIME_ESTIMATES: Record<string, string> = {
  "missing-hsts": "~5 min",
  "missing-csp": "~20 min",
  "missing-x-frame-options": "~5 min",
  "missing-x-content-type-options": "~5 min",
  "missing-referrer-policy": "~5 min",
  "missing-permissions-policy": "~10 min",
  "infrastructure-exposed": "~10 min",
  "weak-tls": "~30 min",
  "expired-ssl": "~60 min",
  "self-signed-ssl": "~45 min",
  "ssl-expiring-soon": "~15 min",
  "suspicious-redirect": "~15 min",
  "redirect-loop": "~20 min",
  "cross-domain-redirect": "~15 min",
  "domain-too-new": "~5 min",
};

export const FIX_SNIPPETS: Partial<Record<RemediationFindingId, FixSnippet[]>> = {
  "missing-referrer-policy": [
    {
      platform: "nginx",
      label: "Nginx",
      code: `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
    },
    {
      platform: "apache",
      label: "Apache",
      code: `Header always set Referrer-Policy "strict-origin-when-cross-origin"`,
    },
    {
      platform: "nextjs",
      label: "Next.js",
      code: `{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }`,
    },
  ],
  "missing-permissions-policy": [
    {
      platform: "nginx",
      label: "Nginx",
      code: `add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;`,
    },
    {
      platform: "apache",
      label: "Apache",
      code: `Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"`,
    },
  ],
  "weak-tls": [
    {
      platform: "nginx",
      label: "Nginx",
      code: `ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;`,
    },
    {
      platform: "apache",
      label: "Apache",
      code: `SSLProtocol -all +TLSv1.2 +TLSv1.3`,
    },
    {
      platform: "cloudflare",
      label: "Cloudflare",
      code: `SSL/TLS → set Minimum TLS Version to 1.2 (prefer 1.3).`,
    },
  ],
  "expired-ssl": [
    {
      platform: "nginx",
      label: "Nginx",
      code: `ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;`,
    },
    {
      platform: "apache",
      label: "Apache",
      code: `SSLCertificateFile /etc/letsencrypt/live/example.com/fullchain.pem
SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem`,
    },
    {
      platform: "cloudflare",
      label: "Cloudflare",
      code: `SSL/TLS → Edge Certificates → renew or enable Universal SSL.`,
    },
  ],
  "self-signed-ssl": [
    {
      platform: "nginx",
      label: "Nginx",
      code: `ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;`,
    },
    {
      platform: "apache",
      label: "Apache",
      code: `SSLCertificateFile /etc/letsencrypt/live/example.com/fullchain.pem
SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem`,
    },
  ],
  "ssl-expiring-soon": [
    {
      platform: "nginx",
      label: "Nginx",
      code: `# Renew early (e.g. certbot) then reload nginx
sudo certbot renew --dry-run`,
    },
    {
      platform: "cloudflare",
      label: "Cloudflare",
      code: `SSL/TLS → Edge Certificates → confirm auto-renewal and expiry alerts.`,
    },
  ],
  "suspicious-redirect": [
    {
      platform: "nginx",
      label: "Nginx",
      code: `return 301 https://example.com$request_uri;`,
    },
    {
      platform: "apache",
      label: "Apache",
      code: `Redirect permanent / https://example.com/`,
    },
    {
      platform: "cloudflare",
      label: "Cloudflare",
      code: `Review Bulk Redirects / Page Rules; remove unknown external targets.`,
    },
  ],
  "redirect-loop": [
    {
      platform: "nginx",
      label: "Nginx",
      code: `server {
  listen 80;
  server_name example.com www.example.com;
  return 301 https://example.com$request_uri;
}`,
    },
    {
      platform: "apache",
      label: "Apache",
      code: `RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://example.com%{REQUEST_URI} [R=301,L]`,
    },
  ],
  "cross-domain-redirect": [
    {
      platform: "cloudflare",
      label: "Cloudflare",
      code: `(http.request.uri.path eq "/old-path")`,
    },
    {
      platform: "nginx",
      label: "Nginx",
      code: `# Allow only approved hosts in return/rewrite targets
return 302 https://trusted.example.com$request_uri;`,
    },
  ],
  "domain-too-new": [
    {
      platform: "nginx",
      label: "Nginx",
      code: `# No header fixes domain age — strengthen trust elsewhere:
# DMARC/SPF/DKIM, verified contact pages, gradual traffic ramp.`,
    },
    {
      platform: "cloudflare",
      label: "Cloudflare",
      code: `(ip.geoip.asnum in {13335})`,
    },
  ],
};

const REMEDIATION_TAB_ORDER = ["vercel", "nginx", "apache", "cloudflare"] as const;

export function snippetsFromRemediation(
  codeExamples: RemediationEntry["codeExamples"],
): FixSnippet[] {
  const meta: Record<(typeof REMEDIATION_TAB_ORDER)[number], { platform: FixPlatform; label: string }> = {
    vercel: { platform: "vercel", label: "Vercel" },
    nginx: { platform: "nginx", label: "Nginx" },
    apache: { platform: "apache", label: "Apache" },
    cloudflare: { platform: "cloudflare", label: "Cloudflare" },
  };

  return REMEDIATION_TAB_ORDER.flatMap((key) => {
    const code = codeExamples[key];
    if (!code) {
      return [];
    }
    const m = meta[key];
    return [{ platform: m.platform, label: m.label, code }];
  });
}

function techIncludes(technologies: string[], needle: string): boolean {
  const lower = needle.toLowerCase();
  return technologies.some((t) => t.toLowerCase().includes(lower));
}

export function getPriorityPlatform(technologies: string[]): FixPlatform {
  if (techIncludes(technologies, "next.js") || techIncludes(technologies, "nextjs")) {
    return "nextjs";
  }
  if (techIncludes(technologies, "cloudflare")) {
    return "cloudflare";
  }
  if (techIncludes(technologies, "express")) {
    return "express";
  }
  if (techIncludes(technologies, "vercel")) {
    return "vercel";
  }
  return "nginx";
}

/** Platforms to offer in tabs for this scan fingerprint (relevance pool). */
export function getRelevancePlatformPool(technologies: string[]): Set<FixPlatform> {
  const pool = new Set<FixPlatform>();

  if (techIncludes(technologies, "cloudflare")) {
    ["cloudflare", "nextjs", "nginx", "vercel"].forEach((p) => pool.add(p as FixPlatform));
  }
  if (techIncludes(technologies, "next.js") || techIncludes(technologies, "nextjs")) {
    ["nextjs", "vercel", "nginx", "apache"].forEach((p) => pool.add(p as FixPlatform));
  }
  if (techIncludes(technologies, "vercel")) {
    pool.add("vercel");
    pool.add("nextjs");
  }
  if (techIncludes(technologies, "express")) {
    pool.add("express");
  }

  if (pool.size === 0) {
    ["nginx", "apache", "express"].forEach((p) => pool.add(p as FixPlatform));
  }

  return pool;
}

export function getFixTimeEstimate(findingId: string): string | undefined {
  return FIX_TIME_ESTIMATES[findingId];
}

export function getSnippetsForFinding(findingId: string): FixSnippet[] {
  const fromQuick = quickFixSnippetsAsBase(findingId);
  if (fromQuick.length > 0) {
    return fromQuick;
  }
  return FIX_SNIPPETS[findingId as RemediationFindingId] ?? [];
}

/** Prefer curated multi-platform snippets; fall back to remediation `codeExamples`. */
export function getEffectiveSnippetsForFinding(
  findingId: string | undefined,
  codeExamples: RemediationEntry["codeExamples"] | undefined,
  technologies: string[],
): FixSnippet[] {
  const curated = findingId
    ? filterSnippetsForScan(getSnippetsForFinding(findingId), technologies)
    : [];

  if (curated.length > 0) {
    return curated;
  }

  if (codeExamples) {
    return filterSnippetsForScan(snippetsFromRemediation(codeExamples), technologies);
  }

  return [];
}

export function filterSnippetsForScan(
  snippets: FixSnippet[],
  technologies: string[],
): FixSnippet[] {
  if (snippets.length === 0) {
    return [];
  }
  const pool = getRelevancePlatformPool(technologies);
  const filtered = snippets.filter((s) => pool.has(s.platform));
  if (filtered.length === 0) {
    return snippets.filter((s) => ["nginx", "apache"].includes(s.platform));
  }
  const priority = getPriorityPlatform(technologies);
  return [...filtered].sort((a, b) => {
    if (a.platform === priority && b.platform !== priority) return -1;
    if (b.platform === priority && a.platform !== priority) return 1;
    return a.label.localeCompare(b.label);
  });
}

export type EffortBandKey = "none" | "minimal" | "light" | "moderate" | "heavy" | "severe";

/** Approximate total effort band — not a sum of per-item estimates. */
export function getActionPlanEffortBandKey(findings: { severity: string }[]): EffortBandKey {
  if (findings.length === 0) {
    return "none";
  }

  const urgent = findings.filter((f) => f.severity === "critical" || f.severity === "high").length;
  const week = findings.filter((f) => f.severity === "medium").length;
  const later = findings.filter((f) => f.severity === "low" || f.severity === "informational").length;

  if (urgent >= 3 || (urgent >= 2 && week >= 2)) {
    return "severe";
  }
  if (urgent >= 1) {
    return "heavy";
  }
  if (week >= 3) {
    return "moderate";
  }
  if (week >= 1) {
    return "light";
  }
  if (later >= 1) {
    return "minimal";
  }
  return "light";
}
