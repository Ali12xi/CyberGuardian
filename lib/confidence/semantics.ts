import type { ScanResult } from "@/lib/types";
import type {
  ConfidenceContext,
  ConfidenceDimension,
  ConfidenceExplanation,
  ConfidenceLabel,
  ConfidenceReasonCode,
  ConfidenceReport,
  ConfidenceState,
} from "@/lib/confidence/types";

const STATE_LABELS: Record<ConfidenceState, ConfidenceLabel> = {
  observed: { en: "Observed", ar: "مُراقَب" },
  inferred: { en: "Inferred", ar: "مُستَنتَج" },
  partial: { en: "Partial", ar: "جزئي" },
  masked: { en: "Masked", ar: "مَحجوب" },
  hidden: { en: "Hidden", ar: "غير متاح" },
};

const ALLOWED_STATES: Record<ConfidenceContext, ConfidenceState[]> = {
  headers: ["observed", "masked", "partial", "hidden"],
  server: ["observed", "inferred", "masked", "hidden"],
  infrastructure: ["observed", "inferred", "masked", "partial", "hidden"],
  reputationVendor: ["observed", "hidden"],
  reputationHeuristic: ["inferred", "hidden"],
  tls: ["observed", "partial", "hidden"],
  redirectChain: ["observed", "partial", "hidden"],
  redirectIntent: ["inferred", "hidden"],
};

type ExplanationTemplate = ConfidenceExplanation & {
  reasonOverrides?: Partial<Record<ConfidenceReasonCode, ConfidenceExplanation>>;
};

const EXPLANATIONS: Record<ConfidenceContext, Partial<Record<ConfidenceState, ExplanationTemplate>>> = {
  headers: {
    observed: {
      en: "Security headers were read directly from the scanned response surface.",
      ar: "تمت قراءة رؤوس الأمان مباشرة من سطح الاستجابة الممسوحة.",
    },
    masked: {
      en: "Header visibility is limited to the edge-layer response; origin header policy is not visible on this surface.",
      ar: "تم حجب رؤية الرؤوس بواسطة طبقة Edge الوسيطة؛ سياسة الرؤوس عند المصدر غير ظاهرة على هذا السطح.",
      reasonOverrides: {
        unable_to_verify_antibot: {
          en: "Edge anti-automation handling blocked header verification on this response.",
          ar: "معالجة مكافحة الأتمتة على طبقة Edge حجبت التحقق من الرؤوس على هذه الاستجابة.",
        },
      },
    },
    partial: {
      en: "Header visibility is partial; the response surface returned incomplete header data.",
      ar: "رؤية الرؤوس جزئية؛ سطح الاستجابة أعاد بيانات رؤوس غير مكتملة.",
    },
    hidden: {
      en: "Header data is not available on this scan surface.",
      ar: "بيانات الرؤوس غير متاحة على سطح الفحص هذا.",
    },
  },
  server: {
    observed: {
      en: "Server identification was read from the response Server header.",
      ar: "تمت قراءة تعريف الخادم من رأس Server في الاستجابة.",
    },
    inferred: {
      en: "Infrastructure type is inferred from passive response signal patterns.",
      ar: "نوع البنية التحتية مُستَنتَج من أنماط إشارات الاستجابة السلبية.",
    },
    masked: {
      en: "Server identification reflects the edge proxy; origin server software is not exposed on this surface.",
      ar: "يعكس تعريف الخادم الطبقة الوسيطة Edge؛ برمجيات الخادم الأصلي غير مكشوفة على هذا السطح.",
    },
    hidden: {
      en: "Server identification data is not available on this scan surface.",
      ar: "بيانات تعريف الخادم غير متاحة على سطح الفحص هذا.",
    },
  },
  infrastructure: {
    observed: {
      en: "Infrastructure data was read directly from the response.",
      ar: "تمت قراءة بيانات البنية التحتية مباشرة من الاستجابة.",
    },
    inferred: {
      en: "Infrastructure type is inferred from passive signal patterns.",
      ar: "نوع البنية التحتية مُستَنتَج من أنماط الإشارات السلبية.",
    },
    masked: {
      en: "Infrastructure visibility is limited to edge-layer signals; origin components are not directly observable.",
      ar: "رؤية البنية التحتية محصورة بإشارات طبقة Edge؛ مكونات المصدر غير قابلة للمراقبة المباشرة.",
    },
    partial: {
      en: "Infrastructure fingerprinting is partial; incomplete signal collection occurred.",
      ar: "بصمة البنية التحتية جزئية؛ حدث جمع إشارات غير مكتمل.",
    },
    hidden: {
      en: "Infrastructure identification data is not available on this scan surface.",
      ar: "بيانات تعريف البنية التحتية غير متاحة على سطح الفحص هذا.",
    },
  },
  reputationVendor: {
    observed: {
      en: "Domain reputation was retrieved from third-party vendor aggregation.",
      ar: "تم جلب سمعة النطاق من تجميع مورد خارجي.",
    },
    hidden: {
      en: "Third-party vendor reputation data is not available for this scan.",
      ar: "بيانات سمعة المورد الخارجي غير متاحة لهذا الفحص.",
    },
  },
  reputationHeuristic: {
    inferred: {
      en: "Domain reputation signals are inferred from URL and hostname pattern analysis.",
      ar: "إشارات سمعة النطاق مُستَنتَجة من تحليل أنماط URL واسم المضيف.",
    },
    hidden: {
      en: "Domain reputation signal analysis is not available for this scan.",
      ar: "تحليل إشارات سمعة النطاق غير متاح لهذا الفحص.",
    },
  },
  tls: {
    observed: {
      en: "TLS certificate and negotiation data were collected via direct connection.",
      ar: "تم جمع شهادة TLS وبيانات التفاوض عبر اتصال مباشر.",
    },
    partial: {
      en: "TLS inspection is partial; certificate material may be incomplete.",
      ar: "فحص TLS جزئي؛ بيانات الشهادة قد تكون غير مكتملة.",
    },
    hidden: {
      en: "TLS data is not available for this target.",
      ar: "بيانات TLS غير متاحة لهذا الهدف.",
    },
  },
  redirectChain: {
    observed: {
      en: "Redirect URLs and status codes were recorded from the HTTP redirect chain.",
      ar: "تم تسجيل عناوين URL ورموز الحالة من سلسلة إعادة التوجيه HTTP.",
    },
    partial: {
      en: "Redirect chain is partial; the scan did not reach a final response.",
      ar: "سلسلة إعادة التوجيه جزئية؛ الفحص لم يصل إلى استجابة نهائية.",
    },
    hidden: {
      en: "Redirect chain data is not available on this scan surface.",
      ar: "بيانات سلسلة إعادة التوجيه غير متاحة على سطح الفحص هذا.",
    },
  },
  redirectIntent: {
    inferred: {
      en: "Redirect behavior classification is inferred from hop patterns across the chain.",
      ar: "تصنيف سلوك إعادة التوجيه مُستَنتَج من أنماط القفزات عبر السلسلة.",
    },
    hidden: {
      en: "Redirect intent classification is not available for this scan.",
      ar: "تصنيف نية إعادة التوجيه غير متاح لهذا الفحص.",
    },
  },
};

function dimension(
  context: ConfidenceContext,
  state: ConfidenceState,
  reasonCode?: ConfidenceReasonCode,
): ConfidenceDimension {
  return { context, state, reasonCode };
}

function hasCdnOrWaf(result: ScanResult): boolean {
  return Boolean(result.infrastructure.cdn.trim()) || Boolean(result.infrastructure.waf.trim());
}

function hasCdn(result: ScanResult): boolean {
  return Boolean(result.infrastructure.cdn.trim());
}

function hasServerHeader(result: ScanResult): boolean {
  return Boolean(result.meta.server.trim());
}

function hasDetections(result: ScanResult): boolean {
  return result.infrastructure.detections.length > 0;
}

function isInfraStageCompleted(result: ScanResult): boolean {
  return result.meta.stages.infrastructure.status === "completed";
}

function isInfraStageFailedOrTimeout(result: ScanResult): boolean {
  const status = result.meta.stages.infrastructure.status;
  return status === "failed" || status === "timeout";
}

function isRedirectsStageCompleted(result: ScanResult): boolean {
  return result.meta.stages.redirects.status === "completed";
}

function isRedirectsStagePartial(result: ScanResult): boolean {
  const status = result.meta.stages.redirects.status;
  return status === "partial" || status === "timeout";
}

function isRedirectsStageFailed(result: ScanResult): boolean {
  return result.meta.stages.redirects.status === "failed";
}

function hasRedirectChain(result: ScanResult): boolean {
  return result.redirects.chain.length > 0;
}

function hasSslObject(result: ScanResult): boolean {
  return result.ssl !== undefined && result.ssl !== null;
}

function hasIntelligenceReputation(result: ScanResult): boolean {
  return Boolean(result.intelligence?.reputation);
}

function inferHeadersConfidence(result: ScanResult): ConfidenceDimension {
  const { observableCoverage, meta } = result;
  const headersReason = meta.stages.headers.reason;

  if (observableCoverage.headers === "failed") {
    return dimension("headers", "hidden");
  }

  if (headersReason === "unable_to_verify_antibot") {
    return dimension("headers", "masked", "unable_to_verify_antibot");
  }

  if (headersReason === "limited_observable_surface" || observableCoverage.headers === "partial") {
    return dimension("headers", "partial", "limited_observable_surface");
  }

  if (observableCoverage.headers === "full" && hasCdnOrWaf(result)) {
    return dimension("headers", "masked", "edge_proxy");
  }

  if (observableCoverage.headers === "full") {
    return dimension("headers", "observed");
  }

  return dimension("headers", "hidden");
}

function inferServerConfidence(result: ScanResult): ConfidenceDimension {
  if (hasServerHeader(result) && !hasCdnOrWaf(result) && isInfraStageCompleted(result)) {
    return dimension("server", "observed");
  }

  if (hasServerHeader(result) && hasCdnOrWaf(result)) {
    return dimension("server", "masked", "edge_proxy");
  }

  if (!hasServerHeader(result) && (hasCdn(result) || hasDetections(result))) {
    return dimension("server", "inferred");
  }

  if (!hasServerHeader(result) && result.technologies.length > 0) {
    return dimension("server", "inferred");
  }

  if (isInfraStageFailedOrTimeout(result) && !hasDetections(result) && !hasServerHeader(result)) {
    return dimension("server", "hidden");
  }

  return dimension("server", "hidden");
}

function inferInfrastructureConfidence(result: ScanResult): ConfidenceDimension {
  const infraCoverage = result.observableCoverage.infrastructure;

  if (hasCdn(result)) {
    return dimension("infrastructure", "masked", "edge_proxy");
  }

  if (infraCoverage === "partial" || infraCoverage === "limited") {
    return dimension("infrastructure", "partial", "limited_observable_surface");
  }

  if (infraCoverage === "full" && hasDetections(result)) {
    return dimension("infrastructure", "inferred");
  }

  return dimension("infrastructure", "hidden");
}

function inferReputationVendorConfidence(result: ScanResult): ConfidenceDimension {
  if (result.reputation !== null && result.observableCoverage.reputation === "full") {
    return dimension("reputationVendor", "observed");
  }

  return dimension("reputationVendor", "hidden");
}

function inferReputationHeuristicConfidence(result: ScanResult): ConfidenceDimension {
  if (hasIntelligenceReputation(result)) {
    return dimension("reputationHeuristic", "inferred");
  }

  return dimension("reputationHeuristic", "hidden");
}

function inferTlsConfidence(result: ScanResult): ConfidenceDimension {
  const tlsCoverage = result.observableCoverage.tls;

  if (tlsCoverage === "full" && hasSslObject(result)) {
    return dimension("tls", "observed");
  }

  if (tlsCoverage === "partial") {
    return dimension("tls", "partial", "tls_partial");
  }

  if (tlsCoverage === "failed" || !hasSslObject(result)) {
    return dimension("tls", "hidden", "stage_failed");
  }

  return dimension("tls", "hidden", "stage_failed");
}

function inferRedirectChainConfidence(result: ScanResult): ConfidenceDimension {
  if (hasRedirectChain(result) && isRedirectsStageCompleted(result)) {
    return dimension("redirectChain", "observed");
  }

  if (hasRedirectChain(result) && isRedirectsStagePartial(result)) {
    return dimension("redirectChain", "partial", "redirect_timeout");
  }

  if (!hasRedirectChain(result) || isRedirectsStageFailed(result)) {
    return dimension("redirectChain", "hidden");
  }

  return dimension("redirectChain", "hidden");
}

function inferRedirectIntentConfidence(result: ScanResult): ConfidenceDimension {
  if (hasRedirectChain(result)) {
    return dimension("redirectIntent", "inferred");
  }

  return dimension("redirectIntent", "hidden");
}

export function getAllowedStates(context: ConfidenceContext): ConfidenceState[] {
  return [...ALLOWED_STATES[context]];
}

export function getConfidenceLabel(state: ConfidenceState): ConfidenceLabel {
  return STATE_LABELS[state];
}

export function explainConfidence(
  context: ConfidenceContext,
  dimensionValue: ConfidenceDimension,
): ConfidenceExplanation {
  const template = EXPLANATIONS[context][dimensionValue.state];

  if (!template) {
    return {
      en: "Visibility semantics are not available for this context.",
      ar: "دلالات الرؤية غير متاحة لهذا السياق.",
    };
  }

  const reasonOverride =
    dimensionValue.reasonCode && template.reasonOverrides?.[dimensionValue.reasonCode];

  if (reasonOverride) {
    return reasonOverride;
  }

  return { en: template.en, ar: template.ar };
}

export function inferScanConfidence(result: ScanResult): ConfidenceReport {
  const report: ConfidenceReport = {
    headers: inferHeadersConfidence(result),
    server: inferServerConfidence(result),
    infrastructure: inferInfrastructureConfidence(result),
    reputationVendor: inferReputationVendorConfidence(result),
    reputationHeuristic: inferReputationHeuristicConfidence(result),
    tls: inferTlsConfidence(result),
    redirectChain: inferRedirectChainConfidence(result),
    redirectIntent: inferRedirectIntentConfidence(result),
  };

  return report;
}
