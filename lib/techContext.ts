import type { Language } from "@/lib/i18n";
import type { ScanResult } from "@/lib/types";

export type TechRiskLevel = "safe" | "warning" | "info";

const WEB_SERVERS = ["nginx", "apache", "iis", "caddy"];
const CDN_EDGE = ["cloudflare", "fastly", "akamai", "vercel", "netlify", "aws cloudfront", "cloudfront"];
const CA_NAMES = ["let's encrypt", "digicert", "comodo", "sectigo", "globalsign"];

function norm(s: string): string {
  return s.toLowerCase();
}

export function getTechRiskLevel(techName: string, result: ScanResult): TechRiskLevel {
  const n = norm(techName);
  const serverExposed = result.infrastructure.serverExposureScore > 48;

  if (WEB_SERVERS.some((t) => n.includes(t))) {
    return serverExposed ? "warning" : "info";
  }

  if (CDN_EDGE.some((t) => n.includes(t))) {
    return "safe";
  }

  if (CA_NAMES.some((t) => n.includes(t))) {
    return "safe";
  }

  return "info";
}

type RowCopy = { safe?: { en: string; ar: string }; warning?: { en: string; ar: string }; info?: { en: string; ar: string } };

const TECH_CONTEXT: Record<string, RowCopy> = {
  nginx: {
    warning: {
      en: "Server header reveals version info. Recommendation: hide server tokens.",
      ar: "header الخادم يكشف معلومات الإصدار. التوصية: إخفاء server tokens.",
    },
    info: {
      en: "Web server detected.",
      ar: "خادم ويب مكتشف.",
    },
  },
  apache: {
    warning: {
      en: "Server header reveals version info. Recommendation: hide server tokens.",
      ar: "header الخادم يكشف معلومات الإصدار. التوصية: إخفاء server tokens.",
    },
    info: {
      en: "Web server detected.",
      ar: "خادم ويب مكتشف.",
    },
  },
  cloudflare: {
    safe: {
      en: "CDN edge protection active. Adds a layer of infrastructure protection.",
      ar: "حماية CDN مفعّلة على الطرف. تضيف طبقة حماية للبنية التحتية.",
    },
  },
  vercel: {
    safe: {
      en: "Serverless edge deployment detected.",
      ar: "نشر serverless على edge مكتشف.",
    },
  },
  fastly: {
    safe: {
      en: "CDN edge protection active. Adds a layer of infrastructure protection.",
      ar: "حماية CDN مفعّلة. تضيف طبقة حماية للبنية التحتية.",
    },
  },
  akamai: {
    safe: {
      en: "CDN edge protection active.",
      ar: "حماية CDN مفعّلة.",
    },
  },
  letsencrypt: {
    safe: {
      en: "Certificate authority: free, trusted, auto-renewal supported.",
      ar: "جهة إصدار شهادات: موثوقة ومجانية مع دعم التجديد التلقائي.",
    },
  },
};

function pickTechKey(techName: string): string | null {
  const n = norm(techName);
  if (n.includes("let's encrypt") || n.includes("lets encrypt") || n.includes("letsencrypt")) {
    return "letsencrypt";
  }
  for (const key of Object.keys(TECH_CONTEXT)) {
    if (key === "letsencrypt") {
      continue;
    }
    if (n.includes(key)) {
      return key;
    }
  }
  return null;
}

function pickLocalized<T extends { en: string; ar: string }>(row: T, language: Language): string {
  return language === "ar" ? row.ar : row.en;
}

export function getTechnologyContextLine(
  techName: string,
  result: ScanResult,
  language: Language,
): { risk: TechRiskLevel; line: string } {
  const risk = getTechRiskLevel(techName, result);
  const key = pickTechKey(techName);
  const pack = key ? TECH_CONTEXT[key] : undefined;
  const row = pack?.[risk] ?? pack?.info ?? pack?.safe ?? pack?.warning;

  if (row) {
    return { risk, line: pickLocalized(row, language) };
  }

  if (risk === "safe") {
    return {
      risk,
      line:
        language === "ar"
          ? "إشارة تقنية مرصودة — راجع سياساتك الأمنية حسب السياق."
          : "Technology signal observed — validate against your security baseline.",
    };
  }

  if (risk === "warning") {
    return {
      risk,
      line:
        language === "ar"
          ? "قد تزيد البصمة المرئية من سطح الهجوم — راجع إخفاء الإصدارات والرؤوس."
          : "Visible fingerprinting may increase attack surface — review version disclosure.",
    };
  }

  return {
    risk: "info",
    line:
      language === "ar"
        ? "مكوّن تقني مكتشف في البصمة الخارجية."
        : "Technology component observed in external fingerprint.",
  };
}

export function techRiskLabel(risk: TechRiskLevel, language: Language): string {
  if (risk === "safe") {
    return language === "ar" ? "موثوق" : "Protected";
  }
  if (risk === "warning") {
    return language === "ar" ? "نسخة مكشوفة" : "Version exposed";
  }
  return language === "ar" ? "معلومات" : "Info";
}
