import "server-only";

import { getOptionalServerEnv } from "@/lib/env";
import type { AIExplanation, AIExplanationContent, ScanResult } from "@/lib/types";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-3-5-haiku-latest";
const AI_TIMEOUT_MS = 15_000;
const MAX_RECOMMENDATIONS = 5;

type ClaudeTextBlock = {
  type: "text";
  text: string;
};

type ClaudeResponse = {
  content?: ClaudeTextBlock[];
};

function assertNodeRuntime() {
  const runtime = globalThis as typeof globalThis & {
    EdgeRuntime?: string;
    process?: {
      versions?: {
        node?: string;
      };
      env?: Record<string, string | undefined>;
    };
  };

  if (!runtime.process?.versions?.node || runtime.EdgeRuntime) {
    throw new Error("node_runtime_required");
  }
}

function sanitizeText(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1_500);
}

function sanitizeRecommendations(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => sanitizeText(item))
    .filter(Boolean)
    .slice(0, MAX_RECOMMENDATIONS);
}

function sanitizeContent(value: unknown, fallback: AIExplanationContent) {
  const record = typeof value === "object" && value !== null ? value : {};
  const content = record as Record<string, unknown>;
  const actions = sanitizeRecommendations(content.recommendedSecurityActions);

  return {
    executiveRiskOverview: sanitizeText(
      content.executiveRiskOverview,
      fallback.executiveRiskOverview,
    ),
    attackSurfaceAnalysis: sanitizeText(
      content.attackSurfaceAnalysis,
      fallback.attackSurfaceAnalysis,
    ),
    infrastructureTrustAssessment: sanitizeText(
      content.infrastructureTrustAssessment,
      fallback.infrastructureTrustAssessment,
    ),
    recommendedSecurityActions:
      actions.length > 0 ? actions : fallback.recommendedSecurityActions,
  };
}

function sanitizeExplanation(value: unknown, fallback: AIExplanation): AIExplanation {
  const record = typeof value === "object" && value !== null ? value : {};
  const explanation = record as Record<string, unknown>;

  return {
    en: sanitizeContent(explanation.en, fallback.en),
    ar: sanitizeContent(explanation.ar, fallback.ar),
  };
}

function getMissingHeaders(scanResult: ScanResult) {
  return Object.entries(scanResult.headers)
    .filter(([, present]) => !present)
    .map(([header]) => header);
}

function hasBrowserHardeningGap(missingHeaders: string[]) {
  return (
    missingHeaders.includes("content-security-policy") &&
    missingHeaders.includes("x-frame-options")
  );
}

function getInfrastructureTrust(scanResult: ScanResult) {
  if (scanResult.threatLevel === "critical" || scanResult.threatLevel === "high") {
    return {
      en: "low trust",
      ar: "ثقة منخفضة",
    };
  }

  if (
    scanResult.intelligence.reputation === "trusted" &&
    scanResult.ssl.valid &&
    scanResult.confidence >= 80
  ) {
    return {
      en: "high trust",
      ar: "ثقة عالية",
    };
  }

  return {
    en: "moderate trust",
    ar: "ثقة متوسطة",
  };
}

function buildLocalRecommendations(scanResult: ScanResult, missingHeaders: string[]) {
  const recommendations = [
    {
      en: "Prioritize high severity findings and verify remediation with a repeat scan.",
      ar: "أعطِ الأولوية للنتائج عالية الخطورة وتحقق من المعالجة بإعادة الفحص.",
    },
  ];

  if (missingHeaders.length > 0) {
    recommendations.push({
      en: `Implement missing browser hardening headers: ${missingHeaders.join(", ")}.`,
      ar: `فعّل رؤوس حماية المتصفح المفقودة: ${missingHeaders.join(", ")}.`,
    });
  }

  if (!scanResult.ssl.valid || scanResult.ssl.weakProtocol || scanResult.ssl.weakCipher) {
    recommendations.push({
      en: "Harden TLS with a valid certificate, modern protocol versions, and strong cipher suites.",
      ar: "عزّز TLS باستخدام شهادة صالحة وإصدارات حديثة وخوارزميات تشفير قوية.",
    });
  }

  if (scanResult.redirects.suspicious) {
    recommendations.push({
      en: "Review redirect destinations and remove unexpected cross-domain or looping redirects.",
      ar: "راجع وجهات إعادة التوجيه وأزل التحويلات غير المتوقعة أو المتكررة بين النطاقات.",
    });
  }

  if (scanResult.intelligence.reputation === "suspicious") {
    recommendations.push({
      en: "Investigate domain intelligence signals before allowing authentication, payment, or user trust flows.",
      ar: "حقق في إشارات استخبارات النطاق قبل السماح بتدفقات تسجيل الدخول أو الدفع أو الثقة.",
    });
  }

  return recommendations.slice(0, MAX_RECOMMENDATIONS);
}

function getSuspiciousSignals(scanResult: ScanResult) {
  return {
    en: [
      scanResult.intelligence.suspiciousTld ? "suspicious TLD" : "",
      scanResult.intelligence.punycode ? "punycode/IDN usage" : "",
      scanResult.intelligence.typosquatting ? "typosquatting indicators" : "",
      scanResult.intelligence.phishingKeywords.length > 0
        ? "phishing-oriented keywords"
        : "",
      scanResult.redirects.suspicious ? "suspicious redirects" : "",
    ].filter(Boolean),
    ar: [
      scanResult.intelligence.suspiciousTld ? "امتداد نطاق مشبوه" : "",
      scanResult.intelligence.punycode ? "استخدام Punycode/IDN" : "",
      scanResult.intelligence.typosquatting ? "مؤشرات انتحال كتابي" : "",
      scanResult.intelligence.phishingKeywords.length > 0
        ? "كلمات مرتبطة بالتصيد"
        : "",
      scanResult.redirects.suspicious ? "إعادة توجيه مشبوهة" : "",
    ].filter(Boolean),
  };
}

export function generateLocalSecurityExplanation(
  scanResult: ScanResult,
): AIExplanation {
  const missingHeaders = getMissingHeaders(scanResult);
  const browserHardeningGap = hasBrowserHardeningGap(missingHeaders);
  const trust = getInfrastructureTrust(scanResult);
  const suspiciousSignals = getSuspiciousSignals(scanResult);
  const recommendations = buildLocalRecommendations(scanResult, missingHeaders);
  const technologyText =
    scanResult.technologies.length > 0
      ? scanResult.technologies.join(", ")
      : "no high-confidence framework fingerprint";
  const technologyTextAr =
    scanResult.technologies.length > 0
      ? scanResult.technologies.join("، ")
      : "عدم وجود بصمة تقنية عالية الثقة";

  return {
    en: {
      executiveRiskOverview: `The target is assessed as ${scanResult.threatLevel} risk with a deterministic score of ${scanResult.score}/100 and ${scanResult.confidence}% scan confidence. This conclusion correlates TLS posture, browser hardening headers, domain intelligence, redirect behavior, and externally visible infrastructure metadata.`,
      attackSurfaceAnalysis: browserHardeningGap
        ? "Missing Content-Security-Policy combined with missing X-Frame-Options increases browser-side attack exposure. An attacker may leverage absent browser hardening policies to increase client-side exploitation opportunities, including clickjacking and higher impact from script injection if another weakness exists."
        : `The externally visible attack surface is shaped by ${missingHeaders.length > 0 ? `missing headers (${missingHeaders.join(", ")})` : "the observed HTTP security controls"}, TLS posture, and redirect behavior. The findings represent externally observable exposure rather than proof of compromise.`,
      infrastructureTrustAssessment: `Infrastructure trust is ${trust.en}. Observed technology signals include ${technologyText}; domain reputation is ${scanResult.intelligence.reputation}; TLS negotiated ${scanResult.ssl.protocol || "no TLS protocol"} with ${scanResult.ssl.cipher || "no cipher metadata"}. ${suspiciousSignals.en.length > 0 ? `Trust-impacting indicators include ${suspiciousSignals.en.join(", ")}.` : "No major domain deception indicators were identified."}`,
      recommendedSecurityActions: recommendations.map(
        (recommendation) => recommendation.en,
      ),
    },
    ar: {
      executiveRiskOverview: `تم تقييم الهدف بمستوى خطورة ${scanResult.threatLevel} وبدرجة حتمية ${scanResult.score}/100 وثقة فحص ${scanResult.confidence}%. يربط هذا الاستنتاج بين حالة TLS ورؤوس تقوية المتصفح واستخبارات النطاق وسلوك إعادة التوجيه وبيانات البنية التحتية المرئية خارجيًا.`,
      attackSurfaceAnalysis: browserHardeningGap
        ? "غياب Content-Security-Policy مع غياب X-Frame-Options يزيد التعرض لهجمات المتصفح. قد يستغل المهاجم غياب سياسات تقوية المتصفح لزيادة فرص الاستغلال من جهة العميل، بما في ذلك النقر الخادع وزيادة أثر حقن السكربت عند وجود ضعف آخر."
        : `يتشكل سطح الهجوم الخارجي من ${missingHeaders.length > 0 ? `الرؤوس المفقودة (${missingHeaders.join(", ")})` : "ضوابط HTTP الأمنية المرصودة"} وحالة TLS وسلوك إعادة التوجيه. تمثل النتائج تعرضًا مرئيًا خارجيًا وليس دليلًا على اختراق.`,
      infrastructureTrustAssessment: `ثقة البنية التحتية هي ${trust.ar}. تشمل الإشارات التقنية المرصودة ${technologyTextAr}؛ وسمعة النطاق ${scanResult.intelligence.reputation}؛ وتفاوض TLS أظهر ${scanResult.ssl.protocol || "عدم وجود بروتوكول TLS"} مع ${scanResult.ssl.cipher || "عدم وجود بيانات خوارزمية التشفير"}. ${suspiciousSignals.ar.length > 0 ? `تشمل المؤشرات المؤثرة على الثقة: ${suspiciousSignals.ar.join("، ")}.` : "لم يتم تحديد مؤشرات رئيسية لخداع النطاق."}`,
      recommendedSecurityActions: recommendations.map(
        (recommendation) => recommendation.ar,
      ),
    },
  };
}

function buildPrompt(scanResult: ScanResult) {
  const findings = scanResult.findings.map((finding) => ({
    severity: finding.severity,
    message: finding.message.en,
  }));
  const missingHeaders = getMissingHeaders(scanResult);

  return `Produce an enterprise-grade cybersecurity intelligence summary for this deterministic website security scan.

Return ONLY valid JSON with this exact structure:
{
  "en": {
    "executiveRiskOverview": "string",
    "attackSurfaceAnalysis": "string",
    "infrastructureTrustAssessment": "string",
    "recommendedSecurityActions": ["string"]
  },
  "ar": {
    "executiveRiskOverview": "string",
    "attackSurfaceAnalysis": "string",
    "infrastructureTrustAssessment": "string",
    "recommendedSecurityActions": ["string"]
  }
}

Tone requirements:
- Professional, analytical, realistic, executive-level, and cybersecurity-oriented.
- Avoid generic motivational wording.
- Correlate findings instead of listing them independently.
- Include attack-perspective reasoning. Example: absent browser hardening policies may increase client-side exploitation opportunities.
- Explain what the issue means, why it matters, the risk level, and suggested fixes.
- Keep recommendations practical and specific to the observed evidence.

Scan data:
${JSON.stringify(
  {
    score: scanResult.score,
    grade: scanResult.grade,
    confidence: scanResult.confidence,
    threatLevel: scanResult.threatLevel,
    scanTimestamp: scanResult.meta.scanTimestamp,
    ssl: scanResult.ssl,
    missingHeaders,
    intelligence: scanResult.intelligence,
    technologies: scanResult.technologies,
    redirects: scanResult.redirects,
    statusCode: scanResult.meta.statusCode,
    findings,
  },
  null,
  2,
)}`;
}

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("invalid_ai_json");
  }

  return JSON.parse(text.slice(start, end + 1)) as unknown;
}

export async function generateSecurityExplanation(
  scanResult: ScanResult,
): Promise<AIExplanation> {
  assertNodeRuntime();

  const localExplanation = generateLocalSecurityExplanation(scanResult);
  const apiKey = getOptionalServerEnv("ANTHROPIC_API_KEY");

  if (!apiKey) {
    return localExplanation;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1_000,
        temperature: 0.1,
        messages: [
          {
            role: "user",
            content: buildPrompt(scanResult),
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return localExplanation;
    }

    const data = (await response.json()) as ClaudeResponse;
    const text = data.content
      ?.filter((block): block is ClaudeTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    if (!text) {
      return localExplanation;
    }

    return sanitizeExplanation(extractJson(text), localExplanation);
  } catch {
    return localExplanation;
  } finally {
    clearTimeout(timeout);
  }
}
