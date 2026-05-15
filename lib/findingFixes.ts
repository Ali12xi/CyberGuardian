import type { FixPlatform, FixSnippet } from "@/lib/fixSnippets";
import type { RemediationFindingId } from "@/lib/remediation";

export type QuickFixDifficulty = "easy" | "medium" | "advanced";

export type QuickFixSnippet = {
  platform: FixPlatform;
  label: string;
  code: string;
  placement: string;
  placementAr: string;
};

export type FindingFix = {
  snippets: QuickFixSnippet[];
  risksReduced: string[];
  risksReducedAr: string[];
  disclaimer?: string;
  disclaimerAr?: string;
  difficulty: QuickFixDifficulty;
  difficultyAr: string;
};

export const DIFFICULTY_LABELS: Record<
  QuickFixDifficulty,
  { en: string; ar: string; descriptionEn: string; descriptionAr: string }
> = {
  easy: {
    en: "Easy",
    ar: "سهل",
    descriptionEn: "Single line change",
    descriptionAr: "تغيير سطر واحد",
  },
  medium: {
    en: "Medium",
    ar: "متوسط",
    descriptionEn: "Config file update",
    descriptionAr: "تحديث ملف إعدادات",
  },
  advanced: {
    en: "Advanced",
    ar: "متقدم",
    descriptionEn: "Requires testing after",
    descriptionAr: "يتطلب اختبار بعد التطبيق",
  },
};

export const FINDING_QUICK_FIXES: Partial<Record<RemediationFindingId, FindingFix>> = {
  "missing-hsts": {
    difficulty: "easy",
    difficultyAr: "سهل",
    risksReduced: ["Protocol downgrade attacks", "Cookie hijacking on HTTP"],
    risksReducedAr: ["هجمات تخفيض البروتوكول", "سرقة الـ cookies عبر HTTP"],
    snippets: [
      {
        platform: "nginx",
        label: "Nginx",
        placement: "Inside your server { } block",
        placementAr: "داخل كتلة server { } في Nginx",
        code: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`,
      },
      {
        platform: "apache",
        label: "Apache",
        placement: "Inside .htaccess or VirtualHost",
        placementAr: "داخل .htaccess أو VirtualHost",
        code: `Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"`,
      },
      {
        platform: "nextjs",
        label: "Next.js",
        placement: "Inside next.config.js → headers()",
        placementAr: "داخل next.config.js في دالة headers()",
        code: `{
  key: 'Strict-Transport-Security',
  value: 'max-age=31536000; includeSubDomains'
}`,
      },
      {
        platform: "express",
        label: "Express",
        placement: "Global middleware before routes",
        placementAr: "Middleware عام قبل الـ routes",
        code: `app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security',
    'max-age=31536000; includeSubDomains')
  next()
})`,
      },
      {
        platform: "vercel",
        label: "Vercel",
        placement: "Inside vercel.json → headers",
        placementAr: "داخل vercel.json في قسم headers",
        code: `{
  "key": "Strict-Transport-Security",
  "value": "max-age=31536000; includeSubDomains"
}`,
      },
      {
        platform: "cloudflare",
        label: "Cloudflare",
        placement: "Dashboard → Transform Rules → Modify Headers",
        placementAr: "لوحة Cloudflare ← Transform Rules",
        code: `Header: Strict-Transport-Security
Value: max-age=31536000; includeSubDomains`,
      },
    ],
  },
  "missing-csp": {
    difficulty: "advanced",
    difficultyAr: "متقدم",
    disclaimer:
      "Review before deploying — CSP must match your site resources.",
    disclaimerAr: "قد تحتاج لتخصيص السياسة حسب موارد موقعك قبل النشر.",
    risksReduced: ["Cross-site scripting (XSS)", "Malicious script injection"],
    risksReducedAr: ["هجمات XSS", "حقن السكربتات الخبيثة"],
    snippets: [
      {
        platform: "nginx",
        label: "Nginx",
        placement: "Inside your server { } block",
        placementAr: "داخل كتلة server { }",
        code: `add_header Content-Security-Policy "default-src 'self'" always;`,
      },
      {
        platform: "nextjs",
        label: "Next.js",
        placement: "Inside next.config.js → headers()",
        placementAr: "داخل next.config.js في headers()",
        code: `{
  key: 'Content-Security-Policy',
  value: "default-src 'self'"
}`,
      },
      {
        platform: "express",
        label: "Express",
        placement: "Global middleware before routes",
        placementAr: "Middleware عام قبل الـ routes",
        code: `app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy',
    "default-src 'self'")
  next()
})`,
      },
      {
        platform: "vercel",
        label: "Vercel",
        placement: "Inside vercel.json → headers",
        placementAr: "داخل vercel.json في headers",
        code: `{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'"
}`,
      },
    ],
  },
  "missing-x-frame-options": {
    difficulty: "easy",
    difficultyAr: "سهل",
    risksReduced: ["Clickjacking attacks", "UI redressing attacks"],
    risksReducedAr: ["هجمات النقر الخادع", "هجمات إعادة تأطير الواجهة"],
    snippets: [
      {
        platform: "nginx",
        label: "Nginx",
        placement: "Inside your server { } block",
        placementAr: "داخل كتلة server { }",
        code: `add_header X-Frame-Options "SAMEORIGIN" always;`,
      },
      {
        platform: "nextjs",
        label: "Next.js",
        placement: "Inside next.config.js → headers()",
        placementAr: "داخل next.config.js في headers()",
        code: `{
  key: 'X-Frame-Options',
  value: 'SAMEORIGIN'
}`,
      },
      {
        platform: "apache",
        label: "Apache",
        placement: "Inside .htaccess or VirtualHost",
        placementAr: "داخل .htaccess أو VirtualHost",
        code: `Header always set X-Frame-Options "SAMEORIGIN"`,
      },
      {
        platform: "express",
        label: "Express",
        placement: "Global middleware before routes",
        placementAr: "Middleware عام قبل الـ routes",
        code: `app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  next()
})`,
      },
    ],
  },
  "missing-x-content-type-options": {
    difficulty: "easy",
    difficultyAr: "سهل",
    risksReduced: ["MIME sniffing attacks", "Malicious file execution"],
    risksReducedAr: ["هجمات تخمين نوع الملف", "تنفيذ الملفات الخبيثة"],
    snippets: [
      {
        platform: "nginx",
        label: "Nginx",
        placement: "Inside your server { } block",
        placementAr: "داخل كتلة server { }",
        code: `add_header X-Content-Type-Options "nosniff" always;`,
      },
      {
        platform: "nextjs",
        label: "Next.js",
        placement: "Inside next.config.js → headers()",
        placementAr: "داخل next.config.js في headers()",
        code: `{
  key: 'X-Content-Type-Options',
  value: 'nosniff'
}`,
      },
    ],
  },
  "infrastructure-exposed": {
    difficulty: "easy",
    difficultyAr: "سهل",
    risksReduced: ["Targeted version exploits", "Infrastructure fingerprinting"],
    risksReducedAr: ["استغلال ثغرات الإصدار المحدد", "هجمات البصمة التقنية"],
    snippets: [
      {
        platform: "nginx",
        label: "Nginx",
        placement: "Inside http { } or server { } block",
        placementAr: "داخل كتلة http { } أو server { }",
        code: `server_tokens off;`,
      },
      {
        platform: "apache",
        label: "Apache",
        placement: "Inside httpd.conf or .htaccess",
        placementAr: "داخل httpd.conf أو .htaccess",
        code: `ServerTokens Prod
ServerSignature Off`,
      },
      {
        platform: "express",
        label: "Express",
        placement: "Before any route definitions",
        placementAr: "قبل تعريف أي route",
        code: `app.disable('x-powered-by')`,
      },
    ],
  },
};

export function quickFixSnippetsAsBase(findingId: string): FixSnippet[] {
  const fix = FINDING_QUICK_FIXES[findingId as RemediationFindingId];
  if (!fix) {
    return [];
  }
  return fix.snippets.map((s) => ({
    platform: s.platform,
    label: s.label,
    code: s.code,
  }));
}

export function getFindingQuickFix(findingId: string): FindingFix | undefined {
  return FINDING_QUICK_FIXES[findingId as RemediationFindingId];
}
