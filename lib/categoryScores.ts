import type { Language } from "@/lib/i18n";
import type { ScanResult } from "@/lib/types";

export type CategoryColor = "green" | "amber" | "red";

export type ScoreCategory = {
  id: string;
  labelEn: string;
  labelAr: string;
  icon: string;
  score: number;
  noteEn: string;
  noteAr: string;
  color: CategoryColor;
  tooltipEn: string;
  tooltipAr: string;
};

const TRACKED_HEADERS = [
  "strict-transport-security",
  "content-security-policy",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
] as const;

export function headerIsPresent(headers: ScanResult["headers"], name: string): boolean {
  return headers[name] === true;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function computeTlsHealthScore(result: ScanResult): number {
  const { ssl } = result;
  if (!ssl.valid) {
    return ssl.daysLeft <= 0 ? 4 : 22;
  }
  if (ssl.selfSigned) {
    return 20;
  }
  if (ssl.weakProtocol) {
    return 34;
  }
  if (ssl.weakCipher) {
    return 52;
  }
  let s = 94;
  if (ssl.daysLeft < 14) {
    s -= 28;
  } else if (ssl.daysLeft < 30) {
    s -= 16;
  } else if (ssl.daysLeft < 90) {
    s -= 7;
  }
  return clamp(s, 0, 100);
}

function computeHeadersHealthScore(result: ScanResult): number {
  const present = TRACKED_HEADERS.filter((h) => headerIsPresent(result.headers, h)).length;
  return clamp((present / TRACKED_HEADERS.length) * 100, 0, 100);
}

function computeInfrastructureHealthScore(result: ScanResult): number {
  const { infrastructure } = result;
  let s = 100 - infrastructure.serverExposureScore;
  if (infrastructure.waf) {
    s += 4;
  }
  if (infrastructure.cdn) {
    s += 3;
  }
  return clamp(s, 0, 100);
}

function computeDomainHealthScore(result: ScanResult): number {
  const { intelligence, reputation } = result;
  let s = 68;

  if (reputation?.verdict === "malicious") {
    return 6;
  }
  if (reputation?.verdict === "suspicious") {
    s = 26;
  } else if (intelligence.reputation === "trusted") {
    s = 90;
  } else if (intelligence.reputation === "suspicious") {
    s = 28;
  } else {
    s = 64;
  }

  if (intelligence.typosquatting) {
    s -= 20;
  }
  if (intelligence.activePhishingIndicators) {
    s -= 22;
  }
  if (intelligence.suspiciousTld) {
    s -= 10;
  }

  return clamp(s, 0, 100);
}

function computeRedirectHealthScore(result: ScanResult): number {
  const { analysis } = result.redirects;
  if (analysis.intent === "suspicious") {
    return 16;
  }
  let s = analysis.intent === "standard" ? 88 : 74;
  const hops = analysis.hops;
  if (hops > 5) {
    s -= 18;
  } else if (hops > 3) {
    s -= 10;
  } else if (hops > 1) {
    s -= 4;
  }
  if (analysis.crossDomain) {
    s -= 12;
  }
  return clamp(s, 0, 100);
}

export function getCategoryColor(id: string, score: number, result: ScanResult): CategoryColor {
  if (id === "tls") {
    if (!result.ssl.valid) {
      return "red";
    }
    if (result.ssl.selfSigned) {
      return "red";
    }
    if (result.ssl.weakProtocol) {
      return "red";
    }
    return score >= 80 ? "green" : "amber";
  }

  if (id === "headers") {
    return score >= 70 ? "green" : "amber";
  }

  if (id === "infrastructure") {
    if (result.intelligence.reputation === "suspicious") {
      return "red";
    }
    return score >= 60 ? "green" : "amber";
  }

  if (id === "domain") {
    const verdict = result.reputation?.verdict;
    if (verdict === "malicious" || verdict === "suspicious") {
      return "red";
    }
    if (result.intelligence.reputation === "suspicious") {
      return "red";
    }
    return score >= 70 ? "green" : "amber";
  }

  if (id === "redirects") {
    if (result.redirects.analysis.intent === "suspicious") {
      return "red";
    }
    return score >= 60 ? "green" : "amber";
  }

  return score >= 80 ? "green" : score >= 40 ? "amber" : "red";
}

export function generateCategoryNote(
  id: string,
  result: ScanResult,
  language: Language,
): string {
  if (id === "tls") {
    const version = result.ssl.protocol || (language === "ar" ? "غير معروف" : "Unknown");
    const daysLeft = result.ssl.daysLeft;
    const hsts = headerIsPresent(result.headers, "strict-transport-security");
    if (language === "en") {
      return `${version} active · ${daysLeft}d until expiry${hsts ? " · HSTS enabled" : ""}`;
    }
    return `${version} مفعّل · ${daysLeft} يوم للانتهاء${hsts ? " · HSTS مفعّل" : ""}`;
  }

  if (id === "headers") {
    const missing = TRACKED_HEADERS.filter((h) => !headerIsPresent(result.headers, h));
    if (missing.length === 0) {
      return language === "en" ? "All security headers present" : "جميع رؤوس الأمان موجودة";
    }
    if (language === "en") {
      return `${missing.length} security header${missing.length > 1 ? "s" : ""} missing`;
    }
    return `${missing.length} رأس أمان مفقود`;
  }

  if (id === "infrastructure") {
    const cdn = result.infrastructure.cdn;
    const exposed = result.infrastructure.serverExposureScore > 48;
    if (language === "en") {
      return `${cdn ? `${cdn} edge detected` : "No CDN detected"}${exposed ? " · Server metadata exposed" : ""}`;
    }
    return `${cdn ? `${cdn} مكتشف` : "لا CDN مكتشف"}${exposed ? " · بيانات الخادم مكشوفة" : ""}`;
  }

  if (id === "domain") {
    const verdict = result.reputation?.verdict;
    const intelRep = result.intelligence.reputation;
    const typo = result.intelligence.typosquatting;
    if (language === "en") {
      const repLabel =
        verdict === "malicious"
          ? "Malicious reputation"
          : verdict === "suspicious"
            ? "Suspicious vendor signals"
            : intelRep === "trusted"
              ? "Trusted domain"
              : intelRep === "suspicious"
                ? "Suspicious signals"
                : "Neutral reputation";
      return `${repLabel}${typo ? " · Typosquatting detected" : " · No typosquatting signals"}`;
    }
    const repLabelAr =
      verdict === "malicious"
        ? "سمعة خبيثة"
        : verdict === "suspicious"
          ? "إشارات مشبوهة من المحركات"
          : intelRep === "trusted"
            ? "نطاق موثوق"
            : intelRep === "suspicious"
              ? "إشارات مشبوهة"
              : "سمعة محايدة";
    return `${repLabelAr}${typo ? " · انتحال هوية مكتشف" : " · لا إشارات انتحال"}`;
  }

  if (id === "redirects") {
    const hops = result.redirects.analysis.hops;
    const intent = result.redirects.analysis.intent;
    if (language === "en") {
      return `${intent === "suspicious" ? "Suspicious redirect pattern" : intent === "standard" ? "Standard redirect" : "Infrastructure redirect"} · ${hops} hop${hops !== 1 ? "s" : ""}`;
    }
    return `${intent === "suspicious" ? "إعادة توجيه مشبوهة" : intent === "standard" ? "توجيه قياسي" : "توجيه بنية تحتية"} · ${hops} خطوة`;
  }

  return "";
}

const CATEGORY_META: Omit<ScoreCategory, "score" | "noteEn" | "noteAr" | "color">[] = [
  {
    id: "tls",
    labelEn: "TLS & Certificate",
    labelAr: "TLS والشهادة",
    icon: "ti-lock",
    tooltipEn:
      "Measures TLS version, certificate validity, expiry, and cipher strength.",
    tooltipAr: "يقيس إصدار TLS وصلاحية الشهادة وقوة التشفير.",
  },
  {
    id: "headers",
    labelEn: "Security Headers",
    labelAr: "رؤوس الأمان",
    icon: "ti-shield-check",
    tooltipEn:
      "Measures browser security headers that protect visitors from common attacks.",
    tooltipAr: "يقيس رؤوس الأمان التي تحمي الزوار من الهجمات الشائعة.",
  },
  {
    id: "infrastructure",
    labelEn: "Infrastructure",
    labelAr: "البنية التحتية",
    icon: "ti-server",
    tooltipEn:
      "Measures externally visible infrastructure exposure and hosting fingerprint visibility.",
    tooltipAr: "يقيس مدى كشف البنية التحتية المرئية خارجياً وبصمة الاستضافة.",
  },
  {
    id: "domain",
    labelEn: "Domain Trust",
    labelAr: "ثقة النطاق",
    icon: "ti-circle-check",
    tooltipEn:
      "Measures domain reputation, typosquatting signals, and trust indicators.",
    tooltipAr: "يقيس سمعة النطاق وإشارات انتحال الهوية ومؤشرات الثقة.",
  },
  {
    id: "redirects",
    labelEn: "Redirect Safety",
    labelAr: "سلامة إعادة التوجيه",
    icon: "ti-arrow-right",
    tooltipEn:
      "Measures redirect chain safety, hop count, and cross-domain behavior.",
    tooltipAr: "يقيس سلامة سلسلة إعادة التوجيه وعدد الخطوات والسلوك عبر النطاقات.",
  },
];

const SCORE_COMPUTE: Record<string, (r: ScanResult) => number> = {
  tls: computeTlsHealthScore,
  headers: computeHeadersHealthScore,
  infrastructure: computeInfrastructureHealthScore,
  domain: computeDomainHealthScore,
  redirects: computeRedirectHealthScore,
};

export function calculateCategoryScores(result: ScanResult): ScoreCategory[] {
  return CATEGORY_META.map((meta) => {
    const score = SCORE_COMPUTE[meta.id]?.(result) ?? 0;
    const color = getCategoryColor(meta.id, score, result);
    return {
      ...meta,
      score,
      noteEn: generateCategoryNote(meta.id, result, "en"),
      noteAr: generateCategoryNote(meta.id, result, "ar"),
      color,
    };
  });
}
