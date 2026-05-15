# CyberGurdian AI — Project Context

This document summarizes the **CyberGurdian** web application as implemented in this repository: purpose, stack, shipped features, versioning, and sensible next steps.

---

## What the app does

**CyberGurdian AI** is a **website security intelligence** product. Users enter an HTTP/HTTPS URL; the backend runs a **deterministic, staged scan** (DNS validation → TLS inspection → redirect chain → HTTP headers and passive signals → infrastructure fingerprinting → optional external reputation). The UI presents a **score, grade, threat level, security visibility**, bilingual findings, and an **executive-style narrative**—either **Anthropic Claude** (when configured) or a **built-in deterministic fallback**—plus optional **VirusTotal** domain reputation when an API key is set.

The positioning (see `components/AboutPage.tsx`) is **explainable, evidence-based analysis**: correlate externally visible security signals instead of treating reputation or missing headers as proof of compromise.

---

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | **Next.js 14** (App Router) |
| UI | **React 18**, **TypeScript** |
| Styling | **Tailwind CSS**, **PostCSS**, `app/globals.css` |
| Fonts | **Google Fonts**: Inter (Latin), Cairo (Arabic + Latin) |
| APIs | Route handlers: `POST /api/analyze`, `POST /api/explain` (**Node.js** runtime, dynamic) |
| Scan engine | `lib/scanner.ts` — Node `tls`, `fetch`, DNS, custom scoring |
| AI summaries | `lib/claude.ts` — Anthropic Messages API (`claude-3-5-haiku-latest`), JSON extraction + sanitization; **local fallback** if no key or on failure |
| Reputation | `lib/reputation.ts` — VirusTotal v3 domains API (optional) |
| PDF export | `lib/pdf.ts` — client-side canvas rendering → downloadable report |
| Middleware | `middleware.ts` — rate limiting (in-memory), security headers, **User-Agent required**, **API routes POST-only** |

**Environment variables** (see `lib/env.ts`): `ANTHROPIC_API_KEY`, `VIRUSTOTAL_API_KEY`; optional rate limit tuning via `RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW`.

---

## Features built

### Core product

- **URL submission** (`components/UrlInput.tsx`) → **`POST /api/analyze`** → `scanUrl()` (`lib/scanner.ts`).
- **Deterministic scan pipeline** with per-stage timeouts and recorded **stage status** (DNS, TLS, headers, redirects, infrastructure; `aiSummary` metadata stage).
- **Safe URL handling** (`lib/validator.ts`): HTTP/HTTPS only, length limits, no credentials, standard ports, **private/reserved IP and SSRF-oriented DNS checks** (public DNS answers only).
- **TLS analysis**: validity, issuer heuristics, expiry, protocol/cipher weakness flags.
- **Redirect chain** tracking with suspicious-redirect logic (cap on hops, size limits).
- **Security headers** checklist (HSTS, CSP, XFO, XCTO, Referrer-Policy, Permissions-Policy).
- **Domain intelligence**: suspicious TLDs, punycode/IDN, typosquatting-style signals, phishing keywords, entropy, DNS risk framing, etc.
- **Infrastructure fingerprinting**: passive detection (CDN, WAF, cloud, hosting, ASN, reverse proxy, framework, server exposure scoring, redirect trust).
- **Weighted scoring** → numeric score, letter grade, threat level, security visibility, **deterministic hash** (`lib/types.ts`).
- **Structured findings** with optional **`finding.id`** linking to **`lib/remediation.ts`** — bilingual remediation copy and **platform snippets** (Vercel, Nginx, Apache, Cloudflare) surfaced in **`ReportCard`**.
- **Optional VirusTotal** reputation aggregates when configured.

### AI and reporting

- **`POST /api/explain`**: accepts a validated `ScanResult`; returns bilingual **`AIExplanation`** (executive overview, attack surface, infrastructure trust, recommended actions).
- **PDF export** (`generateCyberGurdianPdf` in `lib/pdf`) for the current locale, including scan metadata and narrative sections.

### UX / i18n

- **English and Arabic** (`lib/i18n.ts`, `LanguageProvider`, `LanguageToggle`): `lang` / `dir` on `<html>`, RTL-safe **`bidi-safe`** patterns, stored preference in `localStorage`.
- **Marketing-style pages**: **Home** (hero + scanner + “how it works”), **About**, **Contact** (`PublicShell` navigation).
- **Animated scan progress** and rich **report layout**: threat banner, AI sections, critical findings, domain intelligence, timeline, TLS/redirects/headers detail.

### Operations / security

- **Middleware** rate limiting per client IP, **HSTS**, **XFO**, **nosniff**, **Referrer-Policy**, **Permissions-Policy** on responses.
- API errors and validation messages are **bilingual** where applicable.

---

## Current version

| Source | Version |
|--------|---------|
| **`package.json`** | **0.1.0** |
| **UI** (`lib/i18n.ts`) | Hero badge **V1.5.5** (“Smart Protection System”); footer version **V1.5.5** |
| **PDF engine labels** (`lib/pdf.ts`) | Scanner / intelligence engine labels **v1.4** inside the PDF generator |

Treat **npm 0.1.0** as the package semver; product marketing version **V1.5.5** is defined in `lib/brand.ts`.

---

## Next steps

Suggested directions, ordered by impact and alignment with the codebase and existing copy:

1. **Align versioning** — Pick one scheme (e.g. semver only, or product major.minor) and sync `package.json`, hero/footer strings, and PDF metadata.
2. **Commit and release hygiene** — Many app files are still **untracked** in git; commit with a clear message, tag releases, and document required env vars for deployers.
3. **Persistence for rate limits** — In-memory rate limiting in middleware does not survive multi-instance or cold starts; move to Redis or edge-compatible storage if you scale horizontally.
4. **Testing** — Add automated tests for `validator`, scoring edge cases, and API contracts (`AnalyzeApiResponse` / `ExplainApiResponse`).
5. **Observability** — Structured logging for scan failures, Claude/VirusTotal fallbacks, and rate-limit hits (middleware currently avoids noisy logs by design).
6. **Product roadmap** (from About page): **historical scans**, **organization profiles**, **compliance mapping**, **collaboration workflows**—all net-new backend and UX work.

---

*Generated from repository contents; update this file when ship scope or versions change.*
