# CyberGurdian AI — Technical Audit (V1.6)

**Audit date:** 2026-05-20  
**Auditor mode:** Read-only codebase review (no source modifications except this document)  
**Product version in code:** `V1.6` (`lib/brand.ts` line 10)  
**Repository:** `c:\Users\Alibi\OneDrive\Desktop\cyberguardian`

This document is intended for external architectural planning. Claims are tied to files and line ranges where possible. Items not verifiable from the repository are marked **UNCLEAR — needs investigation**.

---

═══════════════════════════════════════════════════════  
## SECTION 1: PROJECT INVENTORY  
═══════════════════════════════════════════════════════

### 1.1 Tech Stack (`package.json`)

| Item | Version / value |
|------|-----------------|
| **Next.js** | `^14.2.35` (resolved build: **14.2.35**) |
| **React** | `^18.3.1` |
| **react-dom** | `^18.3.1` |
| **TypeScript** | `^5` (devDependency; exact patch not pinned) |
| **Tailwind CSS** | `^3.4.17` |
| **@react-pdf/renderer** | `^4.3.0` |
| **@vercel/analytics** | `^2.0.1` |
| **qrcode** | `^1.5.4` |
| **server-only** | `^0.0.1` |
| **autoprefixer** | `^10.4.20` |
| **postcss** | `^8.4.49` |
| **eslint** | `^8` |
| **eslint-config-next** | `14.2.23` |
| **@fontsource/inter** | `^5.2.5` (dev) |
| **@fontsource/noto-sans-arabic** | `^5.2.5` (dev) |
| **pdfkit** | `^0.18.0` (dev; used by `scripts/export-lib-sources-pdf.mjs`) |
| **@types/node** | `^20` |
| **@types/react** | `^18` |
| **@types/react-dom** | `^18` |
| **@types/qrcode** | `^1.5.6` |
| **@types/pdfkit** | `^0.17.6` |

**Node engine requirement:** Not declared in `package.json` (no `"engines"` field).

**Scripts defined:**

| Script | Command |
|--------|---------|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `next lint` |
| `export:lib-pdf` | `node scripts/export-lib-sources-pdf.mjs` |

### 1.2 Folder Structure

Trees are **3 levels deep** from each root. Counts include all `.ts` / `.tsx` files under the tree (recursive).

#### `app/` (11 TypeScript files)

```
app/
  about/page.tsx
  api/analyze/route.ts
  api/explain/route.ts
  contact/page.tsx
  [locale]/about/page.tsx
  [locale]/contact/page.tsx
  [locale]/privacy/page.tsx
  globals.css
  icon.png
  layout.tsx
  page.tsx
  robots.ts
  sitemap.ts
```

#### `lib/` (85 TypeScript files)

```
lib/
  pdf/phaseA/, phaseB/, v2/, v3/, v4/, v5/, v6/
  scoring/ (calculateCoverage, calculateGrade, calculateScore, constants, threatLevel, types)
  brand.ts, businessImpact.ts, categoryScores.ts, claude.ts, domainSignals.ts
  env.ts, findingExplanations.ts, findingFixes.ts, fixSnippets.ts, i18n.ts
  intelligenceMap.ts, pdf.ts, platformDetect.ts, redirectAnalysis.ts, remediation.ts
  reputation.ts, rtl.ts, scanner.ts, scanToken.ts, techContext.ts, technicalFixResolver.ts, types.ts, validator.ts
```

#### `components/` (12 TypeScript files)

```
components/
  AboutPage.tsx, AnalyzePanel.tsx, ContactPage.tsx, DownloadReportButton.tsx
  Footer.tsx, HomeShell.tsx, LanguageProvider.tsx, LanguageToggle.tsx
  PublicShell.tsx, ReportCard.tsx, ScoreBreakdown.tsx, UrlInput.tsx
```

#### `exports/` (0 TypeScript files)

```
exports/
  cyberguardian-lib-sources.pdf   (binary artifact, not source)
```

#### `scripts/` (1 `.ts` file; 2 files total)

```
scripts/
  export-lib-sources-pdf.mjs
  score-calibration-audit.ts
```

#### Largest files by line count (top 10, measured 2026-05-20)

| Lines | Path |
|------:|------|
| 1864 | `lib/scanner.ts` |
| 1367 | `components/ReportCard.tsx` |
| 1022 | `lib/pdf/v5/mapV5.ts` |
| 792 | `lib/remediation.ts` |
| 761 | `lib/i18n.ts` |
| 685 | `lib/pdf/phaseB/PdfDocument.tsx` |
| 604 | `lib/pdf/v2/PdfDocumentV2.tsx` |
| 509 | `lib/scoring/calculateScore.ts` |
| 508 | `lib/pdf/phaseB/mapScanResult.ts` |
| 469 | `lib/pdf/v2/mapV2.ts` |

**Risk:** `ReportCard.tsx` and `scanner.ts` concentrate most product logic; changes are high blast-radius.

### 1.3 Configuration Files

#### `next.config.mjs`

```1:6:next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@react-pdf/renderer"],
};

export default nextConfig;
```

- **transpilePackages:** `@react-pdf/renderer` only  
- No `images`, `headers`, `rewrites`, `redirects`, `experimental`, or `output` overrides

#### `tsconfig.json`

| Setting | Value |
|---------|--------|
| **strict** | `true` |
| **target** | `es5` |
| **module** | `esnext` |
| **moduleResolution** | `bundler` |
| **paths** | `@/*` → `./*` |
| **allowJs** | `false` |
| **noEmit** | `true` |
| **skipLibCheck** | `true` |

#### `tailwind.config.ts`

- **content:** `./app/**/*`, `./components/**/*`
- **theme.extend:** empty object
- **plugins:** none

#### `middleware.ts` — summary

| Concern | Behavior |
|---------|----------|
| **Matcher** | All routes except `_next/static`, `_next/image`, `favicon.ico`, and paths with file extensions |
| **Static skip** | `/_next/`, `favicon.ico`, extension pattern for assets |
| **User-Agent** | Missing UA → **400** JSON |
| **API methods** | `/api/*` non-POST → **405** |
| **Rate limit** | Default **10 req / 60s** per IP; overridable via `RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW` (seconds) |
| **Storage** | In-memory `Map<string, RateLimitEntry>` (not Redis) |
| **Security headers** | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=()`, `HSTS: max-age=63072000` |
| **Suspicious logging** | `logSuspiciousRequest` is intentionally empty (lines 68–70) |

#### `.env.example`

Only one variable is documented:

```
SCAN_TOKEN_SECRET=
```

Comment: minimum 32 characters for HMAC proof-of-scan flow.

**Gap:** Code also reads `ANTHROPIC_API_KEY`, `VIRUSTOTAL_API_KEY`, `RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW` — not listed in `.env.example`.

---

═══════════════════════════════════════════════════════  
## SECTION 2: SCANNER PIPELINE AUDIT (`lib/scanner.ts`)  
═══════════════════════════════════════════════════════

### 2.1 Stages Implemented

Declared stage names (`lib/types.ts` lines 4–10; `lib/scanner.ts` lines 113–120):

| Stage | Timeout | What it checks | Output / status |
|-------|---------|----------------|-----------------|
| **dns** | Uses validator DNS timeout (5s in `lib/validator.ts`, not stage map) | URL validation + DNS resolution via `validateUrl` (SSRF-safe) | `meta.stages.dns` completed/failed/timeout |
| **tls** | **4_000 ms** | TLS certificate, protocol, cipher (`inspectTlsCertificate`) | `result.ssl`, TLS findings |
| **headers** | **6_000 ms** | HTTP response + 6 security headers on final response | `result.headers` boolean map |
| **redirects** | **12_000 ms** | Up to 5 redirects, re-validates each hop | `result.redirects`, `redirects.analysis` |
| **infrastructure** | **1_000 ms** | Passive fingerprinting (headers, cookies string, server, CDN/WAF/framework candidates) | `result.infrastructure`, `technologies` |
| **aiSummary** | **No timeout in `STAGE_TIMEOUTS`** | **Not executed in scanner** | Stays **`pending`** (see below) |

```106:120:lib/scanner.ts
const STAGE_TIMEOUTS: Record<Exclude<ScanStageName, "aiSummary">, number> = {
  dns: 4_000,
  tls: 4_000,
  headers: 6_000,
  redirects: 12_000,
  infrastructure: 1_000,
};
const SCAN_STAGE_NAMES: ScanStageName[] = [
  "dns",
  "tls",
  "headers",
  "redirects",
  "infrastructure",
  "aiSummary",
];
```

**Declared but not implemented as scan work:** `aiSummary` is initialized to `pending` in `createEmptyResult` (line 246) and is **never** updated to `completed`/`failed` anywhere in `scanUrl` or `finalizeScore`. AI narrative runs later via `/api/explain`, not inside the scanner.

Reputation lookup (`checkDomainReputation`) runs after domain intelligence but is **not** a separate `meta.stages` entry.

### 2.2 Security Checks Coverage

#### TLS / certificate

- Validity, issuer, days to expiry, self-signed detection  
- Protocol version (weak if not TLS 1.2+)  
- Cipher strength heuristics (RC4, 3DES, NULL, EXPORT, etc. in scoring; scanner sets `weakProtocol` / `weakCipher`)  
- Findings for expired, self-signed, weak TLS, etc. (`analyzeSslFindings`, ~1880+)

#### Security headers (exact list)

Scanner and PDF both track these six (`lib/scanner.ts` lines 121–128; `lib/pdf/v5/constants.ts` lines 66–73):

1. `strict-transport-security`  
2. `content-security-policy`  
3. `x-frame-options`  
4. `x-content-type-options`  
5. `referrer-policy`  
6. `permissions-policy`  

#### Redirect analysis

- Max **5** redirects (`MAX_REDIRECTS`)  
- Each hop re-validated through `validateUrl` (SSRF protection on redirect targets)  
- Intent classification: `standard` | `infrastructure` | `suspicious` (`lib/redirectAnalysis.ts` consumed in scoring/threat)  
- Cross-domain chain detection  
- Findings for suspicious redirects, loops, long chains  

#### DNS checks

- Performed inside `validateUrl` before scan proceeds (not a separate DNS record audit for SPF/DMARC)  
- Blocks private/reserved IPs on **all** resolved answers (DNS rebinding defense, `lib/validator.ts` lines 286–294)

#### Reputation sources

- **VirusTotal** domain API only (`lib/reputation.ts`)  
- Optional: returns `null` if `VIRUSTOTAL_API_KEY` missing or API errors  
- Verdict thresholds: malicious if `malicious >= 3`; suspicious if `malicious >= 1` or `suspicious >= 3`  

#### Infrastructure fingerprinting

- Passive signals from response headers, `set-cookie` **string** (not structured cookie audit), server, `x-powered-by`, `via`, `alt-svc`  
- Candidate scoring for CDN, WAF, cloud, hosting, reverse proxy, framework (e.g. Next.js, WordPress), ASN, IP owner, server  
- `serverExposureScore` for exposed server metadata  

#### Domain intelligence signals (`analyzeDomainIntelligence`, lines 851–937)

- Registrable domain extraction  
- Trusted domain list (`TRUSTED_DOMAINS`)  
- Suspicious TLD set (`SUSPICIOUS_TLDS`)  
- Punycode (`xn--`)  
- Typosquatting vs `BRAND_KEYWORDS`  
- Phishing keyword list in URL  
- Excessive subdomains (>4 labels)  
- Shannon entropy on primary label  
- `activePhishingIndicators` composite (punycode/typosquat + auth-related keywords)  
- `dnsRisk` tier: low / medium / high  

#### Cookie analysis

- **Shallow:** `set-cookie` header read as a single lowercased string for substring matching in infrastructure fingerprinting (`lib/scanner.ts` lines 1463, 1508)  
- **No** Secure/HttpOnly/SameSite attribute parsing  
- **No** cookie inventory or session fixation analysis  

#### Email security (SPF / DKIM / DMARC)

- **Not implemented** in scanner (no DNS TXT lookups for mail auth)  
- Mentioned only in a **comment** inside `lib/fixSnippets.ts` line 177 (domain-trust remediation text), not as a live check  

#### DNSSEC

- **Not implemented**

### 2.3 Findings Generation

#### Structure (`lib/types.ts` lines 46–61)

```typescript
export type Finding = {
  id?: string;
  severity: Severity;
  message: { en: string; ar: string };
  impact?: { en: string; ar: string };
  remediation?: { en: string; ar: string };
};
```

**Severity levels:** `critical` | `high` | `medium` | `low` | `informational`

#### Bilingual support

- Core finding `message` is always `{ en, ar }`  
- Optional `impact` and `remediation` bilingual  
- Enriched copy also in `lib/remediation.ts`, `lib/findingExplanations.ts`, `lib/intelligenceMap.ts`  

#### Control frameworks

- **No** NCA, PDPL, SAMA, ISO 27001, or SOC 2 mapping in scanner findings  
- **OWASP / CIS** strings appear in **PDF V5 mapper only** (`lib/pdf/v5/mapV5.ts` `standardsForCategory`, lines 224–237) — display metadata, not scanner IDs  

---

═══════════════════════════════════════════════════════  
## SECTION 3: SCORING ENGINE AUDIT (`lib/scoring/`)  
═══════════════════════════════════════════════════════

### 3.1 Score Components

Scoring is **additive** (positives + penalties), then **ceilings** and **coverage caps** — not fixed percentage weights per category.

#### Positive signal IDs and point values (`lib/scoring/constants.ts` lines 17–40)

| ID | Points |
|----|--------|
| httpsEnabled | 12 |
| validCertificate | 18 |
| modernTlsVersion | 12 |
| modernCipherSuite | 6 |
| hstsEnabled | 8 |
| cspPresent | 8 |
| xFrameOptions | 5 |
| xContentTypeOptions | 4 |
| noRedirectChain | 6 |
| cleanInfrastructure | 6 |
| observabilityAwareTransportCredit | 18 |
| observableEdgeHardening | 8 |
| edgeManagedHeaderSurface | 24 |

#### Negative penalties (selected)

| ID | Points |
|----|--------|
| noHttps | -30 |
| invalidCertificate | -25 |
| selfSignedCert | -15 |
| weakTlsVersion | -10 |
| weakCipherSuite | -8 |
| missingHsts / missingCsp / missingXFrame / missingXContentType | -5 / -5 / -3 / -2 |
| suspiciousRedirect | -10 |
| longRedirectChain | -5 |
| suspiciousDomain | -12 |
| maliciousReputation | -25 |
| serverExposure | -4 (scaled) |

#### Ceilings (`SCORE_CEILINGS`)

| Condition | Cap |
|-----------|-----|
| invalidCertificate | 45 |
| noHttps | 30 |
| maliciousReputation | 20 |
| criticalFinding | 60 |
| highFinding | 75 |

#### Floors / display scale

- `MIN_SCORE = 0`  
- `MAX_SCORE = 95` (UI denominator)  
- `MAX_ACHIEVABLE_SCORE = 94` (scores never reach 95)  
- Partial observability caps final score at **88** (strong edge) or **82** (`calculateScore.ts` lines 535–537)

#### Coverage credit bundle

- `MAX_COVERAGE_CREDIT = 16`  
- IDs: `observabilityAwareTransportCredit`, `observableEdgeHardening`, `edgeManagedHeaderSurface`  
- `applyCoverageCreditCap` scales bundle so combined coverage credits ≤ cap and ≤ header-gap debt when applicable (`lib/scoring/calculateScore.ts` lines 84–121)

#### UI category scores (separate from deterministic score)

`lib/categoryScores.ts` exposes five dashboard categories: **tls**, **headers**, **infrastructure**, **domain**, **redirects** — computed for display/tooltips, not the same math as `calculateDeterministicScore`.

#### How observable coverage works

**Stage → coverage mapping** (`lib/scoring/calculateCoverage.ts`):

```7:36:lib/scoring/calculateCoverage.ts
export function calculateObservableCoverage(result: ScanResult): ObservableCoverage {
  const tlsStage = result.meta.stages.tls.status;
  const headersStage = result.meta.stages.headers.status;
  const infraStage = result.meta.stages.infrastructure.status;

  const tls: ObservableCoverage["tls"] =
    tlsStage === "completed" ? "full" : isPartial(tlsStage) ? "partial" : "failed";
  const headers: ObservableCoverage["headers"] =
    headersStage === "completed" ? "full" : isPartial(headersStage) ? "partial" : "failed";
  const infrastructure: ObservableCoverage["infrastructure"] =
    infraStage === "completed" ? "full" : isPartial(infraStage) ? "partial" : "limited";
  const reputation: ObservableCoverage["reputation"] = result.reputation ? "full" : "not-checked";
  // overall: limited | partial | full
}
```

Coverage drives **which penalties apply** (e.g. missing header penalties only when headers were fully observed) and **attenuation profile** (`standard` | `edge-managed` | `enterprise-edge` | `limited-observability`).

### 3.2 Grade Calculation

**Score → grade** (`lib/scoring/calculateGrade.ts`):

| Score | Grade |
|-------|-------|
| ≥ 85 | A |
| ≥ 70 | B |
| ≥ 55 | C |
| ≥ 40 | D |
| < 40 | F |

**Threat level** (`lib/scoring/threatLevel.ts`):

1. `critical` if VirusTotal verdict `malicious` OR any finding `severity === "critical"`  
2. Else `high` if hard transport/identity/phishing signals (`!https`, invalid/self-signed cert, weak TLS/cipher, `activePhishingIndicators`)  
3. Else `medium` if score < 40 OR reputation suspicious OR redirect intent suspicious  
4. Else `low`  

**Important:** Missing browser headers alone cannot produce `high` threat (documented in file header, lines 3–8).

### 3.3 Calibration

**Script:** `scripts/score-calibration-audit.ts`  
**Run:** `npx tsx scripts/score-calibration-audit.ts` (tsx not a package dependency; npx fetches it at runtime)

**What it does:**

- Uses **synthetic** `ScanResult` fixtures (google/github/claude/chatgpt/amazon.sa shapes) — **no live network**  
- Calls `calculateDeterministicScore` twice per case to verify determinism  
- Prints JSON: score, grade, threatLevel, attenuationProfile, observableCoverage, positives/penalties/ceilings  

**Verified sample output (2026-05-20):** `google.com (partial headers)` → score **66**, grade **C**, threat **medium**, profile **edge-managed**, headers coverage **partial**.

**Works:** Yes, exits successfully and produces structured audit objects.

---

═══════════════════════════════════════════════════════  
## SECTION 4: AI & FALLBACK SYSTEM (`lib/claude.ts`)  
═══════════════════════════════════════════════════════

### 4.1 Current State

| Setting | Value |
|---------|--------|
| **Claude API enabled?** | **No** — `CLAUDE_API_TEMPORARILY_DISABLED = true` (line 335) forces immediate return of local fallback |
| **Model** | `claude-haiku-4-5` (line 8) |
| **max_tokens** | `1_500` (line 361) |
| **temperature** | `0.1` (line 362) |
| **Timeout** | `AI_TIMEOUT_MS = 15_000` (line 9) |
| **API URL** | `https://api.anthropic.com/v1/messages` |
| **API key** | `getOptionalServerEnv("ANTHROPIC_API_KEY")` — treats empty or `your_key_here` as unset |

### 4.2 Fallback Quality

**Function:** `generateLocalSecurityExplanation` (lines 200–239)

**Executive overview:** Returns **one long sentence** per language in `executiveRiskOverview`, not three separate sentences. Additional narrative is split across `attackSurfaceAnalysis` and `infrastructureTrustAssessment` (multi-sentence).

**Sample structure (English fields):**

```json
{
  "en": {
    "executiveRiskOverview": "The target is assessed as {threatLevel} risk with a deterministic score of {score}/95. External security visibility is {visibilityEn} ...",
    "attackSurfaceAnalysis": "{browser hardening paragraph OR generic surface paragraph}",
    "infrastructureTrustAssessment": "Infrastructure trust is {trust}. Observed technology signals include {technologies}; ...",
    "recommendedSecurityActions": ["Prioritize high severity...", "..."]
  },
  "ar": { /* parallel structure */ }
}
```

**Bilingual:** Full `en` + `ar` objects always returned from fallback.

### 4.3 Action Plan Engine

| Question | Answer |
|----------|--------|
| **Where generated?** | UI: `lib/remediation.ts` + `lib/findingFixes.ts` + `lib/technicalFixResolver.ts` consumed in `components/ReportCard.tsx`; PDF: `lib/pdf/v5/mapV5.ts` builds action rows |
| **Stack-aware fixes?** | **Yes** — `lib/fixSnippets.ts` defines per-finding snippets for `nginx`, `apache`, `nextjs`, `express`, `cloudflare`, `vercel`; `lib/platformDetect.ts` ranks platforms for display |
| **Time estimates** | **Hardcoded** map `FIX_TIME_ESTIMATES` in `lib/fixSnippets.ts` (e.g. `"missing-hsts": "~5 min"`); `getFixTimeEstimate(findingId)` |
| **Difficulty** | **Static** in `lib/findingFixes.ts` and `lib/remediation.ts` entries (`easy` / `medium` / `advanced`); mapped in `technicalFixResolver.ts` — not computed from scan dynamics |

---

═══════════════════════════════════════════════════════  
## SECTION 5: SECURITY ARCHITECTURE  
═══════════════════════════════════════════════════════

### 5.1 SSRF Protection (`lib/validator.ts`)

#### Blocked IPv4 ranges (`isBlockedIPv4`, lines 124–148)

- `0.0.0.0/8`  
- `10.0.0.0/8`  
- `127.0.0.0/8`  
- `169.254.0.0/16` (link-local)  
- `172.16.0.0/12`  
- `192.168.0.0/16`  
- `100.64.0.0/10` (CGNAT)  
- `192.0.0.0/24`, `192.0.2.0/24` (documentation)  
- `198.18.0.0/15`, `198.51.100.0/24`  
- `203.0.113.0/24`  
- Multicast/reserved: `first >= 224`  
- Specific link-local check `169.254.169.254`  

#### Blocked IPv6 (`isBlockedIPv6`, lines 179–195)

- All zeros  
- Loopback `::1`  
- Unique local `fc00::/7`  
- Link-local `fe80::/10`  
- Multicast `ff00::/8`  
- Documentation `2001:db8::/32`  

#### Hostname blocks

- `localhost`, `*.localhost`, `*.local`  

#### DNS

- **Timeout:** `DNS_TIMEOUT_MS = 5000`  
- **Retries:** 2 attempts  
- **Edge cases:** Unsupported protocols (only http/https); credentials in URL rejected; non-80/443 ports rejected; mixed public/private DNS answers rejected; malformed URLs; max length 2048  

### 5.2 Scan Token (`lib/scanToken.ts`)

| Property | Value |
|----------|--------|
| **Algorithm** | HMAC-SHA256 (`createHmac("sha256", secret)`) |
| **TTL** | `15 * 60 * 1000` ms (15 minutes) |
| **Payload** | `{ scanId, payloadHash, issuedAt }` base64url + `.` + signature base64url |
| **payloadHash** | SHA-256 of canonical JSON: `{ score, grade, threatLevel, domain }` |

**Verification failures:** `malformed`, `signature`, `expired`, `payload_mismatch`, `decode_error`, `secret_error`  
**Timing-safe compare** on signature (`timingSafeEqualBase64Url`)

**Edge case:** Domain in hash uses `result.intelligence?.domain ?? ""` — token invalid if client mutates intelligence domain in posted result.

### 5.3 Middleware Security

(See Section 1.3.) API routes inherit middleware rate limiting and POST-only rule. **No** API-key auth on `/api/analyze` or `/api/explain`.

---

═══════════════════════════════════════════════════════  
## SECTION 6: PDF GENERATION  
═══════════════════════════════════════════════════════

### 6.1 Active Path

| Item | Detail |
|------|--------|
| **Shipping version** | **V5** — `components/DownloadReportButton.tsx` imports `@/lib/pdf/v5/index` |
| **Library** | `@react-pdf/renderer` ^4.3.0 |
| **Entry** | `generatePDF(result, locale, meta?)` → `buildPdfReportDataV5` → `PdfDocumentV5` |

**Pages rendered** (`lib/pdf/v5/PdfDocumentV5.tsx`):

1. **Scorecard** (`ScorecardPageV5`) — cover-style score summary  
2. **Findings** — chunked, `FINDINGS_PER_PAGE = 2` per page  
3. **Action plan** — chunked, `ACTIONS_PER_PAGE = 2` per page  
4. **Technical** (`TechnicalPageV5`)  
5. **Threat intel** (`ThreatIntelPageV5`)  
6. **Trust** (`TrustPageV5`) — verification / token display  

**Legacy (not wired to download button):** `lib/pdf/v2`, `v3`, `v4`, `v6`, `phaseA`, `phaseB` — substantial dead code surface.

### 6.2 Bilingual Handling

| Topic | Implementation |
|-------|----------------|
| **Arabic text** | `normalizeArabicText`, `LocaleText` / `LtrText` in V5 components; RTL via locale prop |
| **Arabic download** | **Blocked in UI** when `locale === "ar"`: `DownloadReportButton.tsx` lines 75–78 show notice modal; user directed to download English PDF (`runDownload("en")`) |
| **Fonts** | `lib/pdf/phaseB/pdfFonts.ts` registers **Inter** + **NotoSansArabic** from `/fonts/*.ttf` at runtime; falls back to Helvetica on failure |

---

═══════════════════════════════════════════════════════  
## SECTION 7: i18n IMPLEMENTATION  
═══════════════════════════════════════════════════════

### 7.1 Routing

| Route pattern | Exists? | Notes |
|---------------|---------|-------|
| `/` | Yes | `app/page.tsx` → `HomeShell` |
| `/about`, `/contact` | Yes | Flat routes |
| `/[locale]/about`, `/[locale]/contact`, `/[locale]/privacy` | Yes | Locale in path for SEO pages |
| `/[locale]/` (home) | **No** | Home is only `/` |

**Language switching:** Client-side `LanguageProvider` — not URL-driven on main scanner.

**localStorage keys:**

- Primary: `cybergurdianai-language` (`lib/brand.ts` line 17)  
- Legacy migrated: `cyberguardian-language` (`LanguageProvider.tsx` line 20)

**Sitemap vs nav mismatch:** `app/sitemap.ts` emits `/en/...` and `/ar/...` URLs; `PublicShell` nav links use flat `/`, `/about`, `/contact` (lines 21–25).

### 7.2 Translation Files

- **Storage:** Single large `translations` object in `lib/i18n.ts` (~761 lines) with `en` and `ar` keys  
- **UI strings:** Most chrome via `useLanguage().t`  
- **Findings:** Bilingual at source in scanner (`message.en` / `message.ar`)  
- **Action plan / remediation:** Bilingual in `lib/remediation.ts`, `lib/findingFixes.ts`  
- **Gaps:** Some debug strings and PDF-only English constants; not all marketing copy guaranteed symmetric without manual review  

---

═══════════════════════════════════════════════════════  
## SECTION 8: API ENDPOINTS  
═══════════════════════════════════════════════════════

Only two API routes exist under `app/api/`.

### `POST /api/analyze` (`app/api/analyze/route.ts`)

| Aspect | Detail |
|--------|--------|
| **Runtime** | `nodejs`, `force-dynamic` |
| **Input** | JSON `{ url: string }` — empty/non-string → 400 bilingual error |
| **Validation** | `validateUrl` before `scanUrl` |
| **Auth** | None |
| **Rate limit** | Middleware (in-memory per IP) |
| **Success** | `{ ok: true, result, scanId, scanToken }` |
| **Errors** | `{ ok: false, error: { en, ar } }` — 400 validation, 503 token generation failure, 500 generic |
| **GET** | 405 with bilingual message |

### `POST /api/explain` (`app/api/explain/route.ts`)

| Aspect | Detail |
|--------|--------|
| **Input** | `{ result: ScanResult, scanToken: string }` |
| **Validation** | Loose structural `isScanResult` check; `verifyScanToken` |
| **Auth** | Proof-of-scan HMAC token (not user login) |
| **Rate limit** | Middleware |
| **Success** | `{ ok: true, explanation: AIExplanation }` |
| **Errors** | 400 invalid body; 403 missing/invalid/expired token |
| **GET** | 405 |

**Error pattern:** Bilingual `error` objects; catch-all 400/500 with generic messages; some `console.warn` / `console.error` server-side.

---

═══════════════════════════════════════════════════════  
## SECTION 9: FRONTEND COMPONENTS  
═══════════════════════════════════════════════════════

### 9.1 Component Inventory

| Component | Purpose | Props / interface | Key dependencies |
|-----------|---------|-------------------|------------------|
| **AboutPage** | Static about content EN/AR | None | `useLanguage`, `VERSION` |
| **AnalyzePanel** | Scan orchestration, progress UI, holds scan state | Internal state; renders `UrlInput`, `ReportCard` | `fetch` analyze/explain APIs |
| **ContactPage** | Contact + privacy link | None | `useLanguage` |
| **DownloadReportButton** | PDF download | `result`, `locale`, `scanId?`, `scanToken?` | `@/lib/pdf/v5` |
| **Footer** | Footer with privacy link | None | **Not imported anywhere** |
| **HomeShell** | Hero + embeds AnalyzePanel | None | `PublicShell`, `AnalyzePanel` |
| **LanguageProvider** | i18n context | `children` | `localStorage`, `lib/i18n` |
| **LanguageToggle** | EN/AR switch | None | `useLanguage` |
| **PublicShell** | Layout, nav, footer inline | `children` | `next/link`, `LanguageToggle` |
| **ReportCard** | Full results UI | `result`, `loading`, `explanation`, `aiLoading`, `scanId?`, `scanToken?` | remediation, scoring, PDF button |
| **ScoreBreakdown** | Score transparency UI | `{ result: ScanResult }` | score breakdown types |
| **UrlInput** | URL form + analyze POST | `onScanStart`, `onScanComplete`, `onLoadingChange` | `/api/analyze` |

### 9.2 State Management

| Mechanism | Usage |
|-----------|--------|
| **useState / useRef / useEffect** | All scan and AI state in `AnalyzePanel` |
| **React Context** | `LanguageProvider` only |
| **Zustand / Redux** | **Not used** |

**Scan state location:** `AnalyzePanel` — `result`, `pendingResult`, `scanId`, `scanToken`, `explanation`, loading flags.

**AnalyzePanel ↔ ReportCard flow:**

1. `UrlInput` POSTs `/api/analyze` → `onScanComplete` stores pending result + token  
2. Fake progress steps advance on timer (~800ms/step)  
3. On completion, `setResult(pendingResult)` and `generateExplanation` POSTs `/api/explain` with token  
4. `ReportCard` receives `result`, `explanation`, `aiLoading`, passes `scanId`/`scanToken` to `DownloadReportButton`

---

═══════════════════════════════════════════════════════  
## SECTION 10: TESTING & QUALITY  
═══════════════════════════════════════════════════════

### 10.1 Test Coverage

| Check | Result |
|-------|--------|
| `*.test.ts` / `*.spec.ts` | **0 files** |
| Testing framework | **None configured** |
| Coverage % | **Not measurable** (no test runner) |

**Partial substitute:** `scripts/score-calibration-audit.ts` for scoring determinism only.

### 10.2 Type Safety

| Check | Result (2026-05-20) |
|-------|---------------------|
| `npx tsc --noEmit` | **0 errors** (exit 0) |
| `: any` / `as any` | **0** matches in `.ts`/`.tsx` |
| `@ts-ignore` / `@ts-expect-error` | **0** matches |

`tsconfig` **strict: true** is enabled.

### 10.3 Linting

- **Config:** `.eslintrc.json` extends `next/core-web-vitals` only  
- **`npm run lint`:** **No warnings or errors** (2026-05-20)

---

═══════════════════════════════════════════════════════  
## SECTION 11: PRODUCTION READINESS  
═══════════════════════════════════════════════════════

### 11.1 Environment Variables Required

| Variable | Required? | Read from |
|----------|-----------|-----------|
| `SCAN_TOKEN_SECRET` | **Required** for explain flow (min 32 chars) | `lib/scanToken.ts` |
| `ANTHROPIC_API_KEY` | Optional (API disabled anyway) | `lib/env.ts`, `lib/claude.ts` |
| `VIRUSTOTAL_API_KEY` | Optional (reputation skipped if unset) | `lib/env.ts`, `lib/reputation.ts` |
| `RATE_LIMIT_REQUESTS` | Optional (default 10) | `middleware.ts` |
| `RATE_LIMIT_WINDOW` | Optional (default 60 seconds) | `middleware.ts` |

`.env.example` documents only `SCAN_TOKEN_SECRET`.

### 11.2 Deployment Configuration

| Item | Status |
|------|--------|
| **vercel.json** | **Does not exist** |
| **next.config.mjs** | Minimal (transpile PDF package only) |
| **Build** | **Succeeded** (2026-05-20) |

**Build output (First Load JS):**

| Route | Size | First Load JS |
|-------|------|---------------|
| `/` (home/scanner) | 651 kB | **755 kB** |
| `/about` | 143 B | 110 kB |
| `/contact` | 3.09 kB | 107 kB |
| `/[locale]/*` | similar | 105–110 kB |
| Middleware | 27.1 kB | — |
| Shared chunks | — | 87.3 kB |

**Critical:** Home bundle **755 kB** First Load JS — largely PDF + scan UI client weight.

### 11.3 Observability

| Capability | Status |
|------------|--------|
| **Logging** | Ad-hoc `console.log` / `console.warn` / `console.error` (Claude debug, PDF, API) |
| **Structured logging** | **None** |
| **Sentry** | **Not integrated** |
| **Vercel Analytics** | **Yes** — `@vercel/analytics/react` in `app/layout.tsx` line 100 |
| **Plausible** | **Not present** |
| **Performance monitoring** | **None** beyond Analytics |

---

═══════════════════════════════════════════════════════  
## SECTION 12: TECHNICAL DEBT INVENTORY  
═══════════════════════════════════════════════════════

### 12.1 Known Issues (TODO / FIXME / HACK / XXX)

| File | Line | Text |
|------|------|------|
| `lib/pdf/phaseA/PhaseAMockDocument.tsx` | 7 | `MOCK_SCAN_ID = "CGA-2026-XXXX"` (placeholder ID, not a TODO comment) |

**No `TODO`, `FIXME`, or `HACK` comments** found in `.ts`/`.tsx` source.

### 12.2 Dead Code

| Area | Evidence |
|------|----------|
| **PDF v2–v4, v6, phaseA, phaseB** | Not imported by `DownloadReportButton` (only v5) |
| **`components/Footer.tsx`** | Zero imports in codebase |
| **`aiSummary` stage** | Never completed in scanner |
| **`exports/cyberguardian-lib-sources.pdf`** | Artifact only |
| **Claude API path** | Unreachable while `CLAUDE_API_TEMPORARILY_DISABLED = true` |

### 12.3 Debug Code

| File | Line(s) | Pattern |
|------|---------|---------|
| `lib/claude.ts` | 82, 317, 337, 343, 346, 372, 390 | `[CLAUDE_DEBUG]`, `[SPRINT_7I]` |
| `components/DownloadReportButton.tsx` | 27, 70 | `[PDF V2 Button]` (misnamed; uses V5) |
| `lib/pdf/phaseB/index.tsx` | 13, 36, 42–43 | `[PDF]` |
| `lib/pdf/v2/index.tsx` | 14, 37–38 | `[PDF V2]` |
| `app/api/explain/route.ts` | 60, 73 | `[explain]` warnings |
| `app/api/analyze/route.ts` | 78 | `[analyze]` error |
| `scripts/score-calibration-audit.ts` | 275–276 | calibration output |

### 12.4 Duplicate Logic

| Duplication | Locations |
|-------------|-----------|
| **TRACKED_HEADERS** (6 headers) | `lib/scanner.ts`, `lib/categoryScores.ts`, `lib/pdf/v5/constants.ts` |
| **PDF map/build pipelines** | v2–v6 + phaseB parallel implementations |
| **Scoring vs category UI scores** | `lib/scoring/calculateScore.ts` vs `lib/categoryScores.ts` |
| **Bilingual error messages** | API routes duplicate patterns vs `lib/i18n` |
| **Flat vs `[locale]` pages** | Duplicate about/contact rendering |

---

═══════════════════════════════════════════════════════  
## SECTION 13: WHAT'S MISSING (CRITICAL)  
═══════════════════════════════════════════════════════

### 13.1 Compliance Frameworks

| Framework | In codebase? |
|-----------|----------------|
| NCA (Saudi) | **No** |
| PDPL | **No** |
| SAMA | **No** |
| ISO 27001 | **No** |
| SOC 2 | **No** |
| OWASP | **PDF display strings only** (`mapV5.ts` standards tags) |
| CIS Controls | **PDF display strings only** |

**Mapping infrastructure:** **Does not exist** as a data model or scanner integration.

### 13.2 Monitoring & Persistence

| Capability | Status |
|------------|--------|
| Database | **None** (no Prisma, SQL, Mongo, etc.) |
| Scan history persistence | **None** (client holds last result only) |
| User accounts | **None** |
| API key management UI | **None** (env vars only) |

### 13.3 Distribution Mechanisms

| Mechanism | Status |
|-----------|--------|
| Shareable `/report/[hash]` | **No route** |
| iframe embed | **No** |
| Public partner API | **No** (only analyze + explain) |
| Trust badges | **No** |

PDF Trust page mentions verification conceptually; no hosted public verifier URL in app routes.

---

═══════════════════════════════════════════════════════  
## SECTION 14: HIDDEN GEMS  
═══════════════════════════════════════════════════════

Capabilities that are **sophisticated in code** but **under-exposed in the UI**:

1. **Observable coverage + attenuation profiles** — Penalties suppressed or credited when headers/TLS cannot be fully observed; `edge-managed` / `enterprise-edge` profiles in `scoreBreakdown` (partially shown in `ScoreBreakdown` if rendered).

2. **Redirect intent analysis** — `standard` / `infrastructure` / `suspicious` affects scoring and threat without treating all redirects equally (`lib/redirectAnalysis.ts`).

3. **Coverage credit cap math** — Bundles `observabilityAwareTransportCredit`, `observableEdgeHardening`, `edgeManagedHeaderSurface` with explicit cap tied to header-gap debt (`applyCoverageCreditCap`).

4. **Domain intelligence composite** — Typosquatting leetspeak normalization, entropy, punycode, phishing keyword combos, `activePhishingIndicators` for critical findings.

5. **Infrastructure candidate scoring** — Multi-signal weighted detection with confidence and signal audit trail in `infrastructure.detections[]`.

6. **Proof-of-scan HMAC token** — Binds explain API to scan payload hash; shown/truncated in PDF trust page metadata.

7. **Platform-aware remediation ranking** — `detectPlatforms` + ranked fix snippets (more visible in PDF than web for some findings).

8. **Deterministic hash** — `result.deterministicHash` for reproducibility (not prominently marketed in UI).

9. **Threat decoupled from score** — Documented policy: missing headers alone cannot force HIGH threat.

10. **VirusTotal integration** — Optional malicious/suspicious verdict with score ceiling at 20 for malicious reputation.

---

═══════════════════════════════════════════════════════  
## SECTION 15: FINAL ASSESSMENT  
═══════════════════════════════════════════════════════

### 15.1 Codebase Health Score (honest)

| Dimension | Score | Rationale |
|-----------|------:|-----------|
| **Architecture** | **6/10** | Clear separation scanner/scoring/API, but god-files, duplicate PDF generations, dual routing models |
| **Code quality** | **7/10** | Strict TS, no `any`, consistent bilingual types; undermined by 1.3k-line components and debug logs |
| **Documentation** | **4/10** | Sparse README-level docs; this audit fills gap; inline comments uneven |
| **Test coverage** | **2/10** | No automated tests; calibration script only |
| **Production readiness** | **5/10** | SSRF + token + middleware solid; no persistence, in-memory rate limits, 755kB home bundle, Claude off |
| **Innovation** | **8/10** | Observable coverage scoring and threat/score decoupling are genuinely thoughtful |

### 15.2 Top 5 Strengths

1. **SSRF-aware URL validation** with DNS rebinding defense and comprehensive private range blocking.  
2. **Deterministic, explainable scoring** with positives, penalties, ceilings, and coverage credits.  
3. **Bilingual-first data model** for findings, errors, and narratives.  
4. **Threat level logic** that avoids conflating missing headers with critical exploitability.  
5. **Rich passive intelligence** (redirect intent, domain signals, infrastructure detections) in a single scan pass.

### 15.3 Top 5 Weaknesses

1. **No automated tests** and no CI-visible quality gates beyond lint/tsc.  
2. **Massive client bundle** on `/` (PDF generation on main path).  
3. **aiSummary stage fiction** — UI progress implies AI runs in scan; it does not.  
4. **Six versions of PDF code** — maintenance and bug risk.  
5. **SEO/i18n routing split** — sitemap locale URLs vs flat nav; duplicate pages.

### 15.4 Top 5 Risks if Scaled to 10,000 Users Tomorrow

1. **In-memory rate limiting** — per-instance maps reset on cold start; unfair/abusable under serverless scale.  
2. **No scan result persistence** — cannot support history, sharing, or abuse investigation.  
3. **Outbound scan load** — each analyze hammers third-party targets (TLS, redirects, VT API) with no global queue.  
4. **VirusTotal rate limits** — optional key shared across all users; silent `null` on 429.  
5. **755 kB First Load JS** — poor mobile TTI and higher bounce at scale.

---

## Appendix: Key File Index

| Area | Primary files |
|------|----------------|
| Scanner | `lib/scanner.ts` |
| Validation | `lib/validator.ts` |
| Scoring | `lib/scoring/calculateScore.ts`, `calculateCoverage.ts`, `threatLevel.ts`, `constants.ts` |
| AI | `lib/claude.ts` |
| Token | `lib/scanToken.ts` |
| PDF (active) | `lib/pdf/v5/*`, `components/DownloadReportButton.tsx` |
| API | `app/api/analyze/route.ts`, `app/api/explain/route.ts` |
| Middleware | `middleware.ts` |
| i18n | `lib/i18n.ts`, `components/LanguageProvider.tsx` |
| UI | `components/AnalyzePanel.tsx`, `components/ReportCard.tsx` |

---

*End of Technical Audit V1.6*
