/**
 * Sprint 4 Day 3: Email Trust Interpretation Layer
 *
 * Layer 2 of the mentor-locked 3-layer architecture:
 *   Layer 1: OBSERVATION    (Day 2 — lib/emailIntelligence.ts)
 *   Layer 2: INTERPRETATION (this file)
 *   Layer 3: NEVER          (verdicts, scores, marketing)
 *
 * Pure functions over the Day 1 EmailTrustIntelligence contract.
 * Bounded interpretation only — describes what was observed and what a
 * published configuration instructs receivers to do. NO verdicts, NO
 * scores, NO rollups, NO "valid" claims, NO "safe/secure" framing.
 */

import type { Language } from "@/lib/i18n";
import type { EmailTrustIntelligence } from "@/lib/types";

export type EmailInterpretationState = "observed" | "absent" | "indeterminate";
export type SpfQualifier = "strict" | "softfail" | "open" | null;

export type InterpretedSpf = {
  state: EmailInterpretationState;
  qualifier: SpfQualifier;
};

export type InterpretedDmarc = {
  state: EmailInterpretationState;
  policy: "none" | "quarantine" | "reject" | null;
  haseenPattern: boolean;
};

export type InterpretedDkim = {
  state: EmailInterpretationState;
  selectorsFound: number;
  selectorsChecked: number;
};

export type InterpretedDnssec = {
  state: EmailInterpretationState;
};

export type InterpretedSecurityTxt = {
  state: EmailInterpretationState;
  expires: string | null;
};

export const SPF_INTERPRETATION = {
  observed: {
    strict: {
      en: "An SPF record is published and ends with a strict qualifier (-all), declaring that only the listed servers are authorized to send mail for this domain.",
      ar: "تم نشر سجل SPF ينتهي بمُحدِّد صارم (-all)، يُعلن أن الخوادم المُدرجة فقط هي المخوّلة بإرسال البريد لهذا النطاق.",
    },
    softfail: {
      en: "An SPF record is published and ends with a soft-fail qualifier (~all), which marks non-listed servers without instructing receivers to refuse them.",
      ar: "تم نشر سجل SPF ينتهي بمُحدِّد تساهلي (~all)، يُعلِّم الخوادم غير المُدرجة دون توجيه المستقبلين إلى رفضها.",
    },
    open: {
      en: "An SPF record is published with a permissive qualifier, placing no restriction on which servers may send mail claiming this domain.",
      ar: "تم نشر سجل SPF بمُحدِّد متساهل، لا يفرض قيوداً على الخوادم التي قد ترسل بريداً يدّعي نسبته لهذا النطاق.",
    },
    unknown: {
      en: "An SPF record is published.",
      ar: "تم نشر سجل SPF.",
    },
  },
  absent: {
    en: "No SPF record published. Receivers cannot verify which servers are authorized to send mail from this domain.",
    ar: "لا يوجد سجل SPF منشور. لا يستطيع المستقبلون التحقق من الخوادم المخوّلة بإرسال البريد من هذا النطاق.",
  },
  indeterminate: {
    en: "SPF publication could not be observed from this environment.",
    ar: "تعذّر رصد نشر SPF من هذه البيئة.",
  },
} as const;

export const DMARC_INTERPRETATION = {
  observed: {
    reject: {
      en: "A DMARC policy of reject is published, instructing receivers to refuse mail that fails authentication and claims to be from this domain.",
      ar: "تم نشر سياسة DMARC بقيمة reject، تُوجِّه المستقبلين إلى رفض البريد الذي يفشل في المصادقة ويدّعي أنه من هذا النطاق.",
    },
    quarantine: {
      en: "A DMARC policy of quarantine is published, instructing receivers to set aside mail that fails authentication for this domain.",
      ar: "تم نشر سياسة DMARC بقيمة quarantine، تُوجِّه المستقبلين إلى عزل البريد الذي يفشل في المصادقة لهذا النطاق.",
    },
    none: {
      en: "A DMARC record is published with a monitoring policy (none); receivers are asked to report, not to act on, unauthenticated mail.",
      ar: "تم نشر سجل DMARC بسياسة مراقبة (none)؛ يُطلب من المستقبلين الإبلاغ عن البريد غير المُصادق عليه دون اتخاذ إجراء.",
    },
    present: {
      en: "A DMARC record is published.",
      ar: "تم نشر سجل DMARC.",
    },
  },
  absent: {
    en: "No DMARC policy published. Receivers have no instruction for handling unauthenticated mail claiming to be from this domain.",
    ar: "لا توجد سياسة DMARC منشورة. ليس لدى المستقبلين توجيه للتعامل مع البريد غير المُصادق عليه الذي يدّعي أنه من هذا النطاق.",
  },
  indeterminate: {
    en: "DMARC publication could not be observed from this environment.",
    ar: "تعذّر رصد نشر DMARC من هذه البيئة.",
  },
} as const;

// Haseen: "references" not "participation" (mentor Tweak 2).
export const HASEEN_PATTERN_COPY = {
  observed: {
    en: "DMARC reporting endpoints reference dmarc.gov.sa infrastructure.",
    ar: "نقاط نهاية تقارير DMARC تُشير إلى بنية dmarc.gov.sa التحتية.",
  },
} as const;

export const DKIM_COUNT_ANCHOR = {
  en: (found: number, checked: number) =>
    `${found} of ${checked} common selectors observed.`,
  ar: (found: number, checked: number) =>
    `تمت ملاحظة ${found} من ${checked} محددات شائعة.`,
};

export const DNSSEC_INDETERMINATE = {
  en: "DNSSEC could not be observed from this environment.",
  ar: "تعذّر رصد DNSSEC من هذه البيئة.",
} as const;

export const SECURITY_TXT_INDETERMINATE = {
  en: "Security disclosure file could not be checked from this environment.",
  ar: "تعذّر التحقق من ملف الإفصاح الأمني من هذه البيئة.",
} as const;

function extractSpfQualifier(record: string): SpfQualifier {
  const lower = record.toLowerCase();
  if (/\s-all\s*$/.test(lower)) {
    return "strict";
  }
  if (/\s~all\s*$/.test(lower)) {
    return "softfail";
  }
  if (/\s[?+]all\s*$/.test(lower)) {
    return "open";
  }
  return null;
}

export function interpretSpf(
  spf: EmailTrustIntelligence["spf"],
): InterpretedSpf {
  if (!spf.observed) {
    return { state: "indeterminate", qualifier: null };
  }
  if (!spf.record) {
    return { state: "absent", qualifier: null };
  }
  return {
    state: "observed",
    qualifier: extractSpfQualifier(spf.record),
  };
}

export function detectHaseenPattern(
  dmarc: EmailTrustIntelligence["dmarc"],
): boolean {
  if (!dmarc.record) {
    return false;
  }
  return dmarc.record.toLowerCase().includes("dmarc.gov.sa");
}

export function interpretDmarc(
  dmarc: EmailTrustIntelligence["dmarc"],
): InterpretedDmarc {
  if (!dmarc.observed) {
    return { state: "indeterminate", policy: null, haseenPattern: false };
  }
  if (!dmarc.record) {
    return { state: "absent", policy: null, haseenPattern: false };
  }
  return {
    state: "observed",
    policy: dmarc.policy,
    haseenPattern: detectHaseenPattern(dmarc),
  };
}

// DKIM distinguishability caveat (mentor Tweak 1):
// The Day 2 contract returns selectorsFound: string[] only. Per-selector
// query failures are settled and filtered inside collectDkim, so a failed
// lookup and a successful lookup with no published selector both yield an
// empty array. We therefore CANNOT separate "absent" from "indeterminate"
// at the DKIM contract. Per mentor decision, empty maps to "absent".
// The Day 2 engine is intentionally left untouched.
export function interpretDkim(
  dkim: EmailTrustIntelligence["dkim"],
): InterpretedDkim {
  const state: EmailInterpretationState =
    dkim.selectorsFound.length > 0 ? "observed" : "absent";
  return {
    state,
    selectorsFound: dkim.selectorsFound.length,
    selectorsChecked: dkim.selectorsChecked,
  };
}

export function interpretDnssec(
  dnssec: EmailTrustIntelligence["dnssec"],
): InterpretedDnssec {
  if (dnssec.dnskeyObserved === null) {
    return { state: "indeterminate" };
  }
  return { state: dnssec.dnskeyObserved ? "observed" : "absent" };
}

export function interpretSecurityTxt(
  securityTxt: EmailTrustIntelligence["securityTxt"],
): InterpretedSecurityTxt {
  if (securityTxt.fileFound === null) {
    return { state: "indeterminate", expires: null };
  }
  return {
    state: securityTxt.fileFound ? "observed" : "absent",
    expires: securityTxt.expires,
  };
}

export function getSpfInterpretation(
  interpreted: InterpretedSpf,
  language: Language,
): string {
  if (interpreted.state === "indeterminate") {
    return SPF_INTERPRETATION.indeterminate[language];
  }
  if (interpreted.state === "absent") {
    return SPF_INTERPRETATION.absent[language];
  }
  const q = interpreted.qualifier ?? "unknown";
  return SPF_INTERPRETATION.observed[q][language];
}

export function getDmarcInterpretation(
  interpreted: InterpretedDmarc,
  language: Language,
): string {
  if (interpreted.state === "indeterminate") {
    return DMARC_INTERPRETATION.indeterminate[language];
  }
  if (interpreted.state === "absent") {
    return DMARC_INTERPRETATION.absent[language];
  }
  const p = interpreted.policy ?? "present";
  return DMARC_INTERPRETATION.observed[p][language];
}

export function getDkimAnchor(
  interpreted: InterpretedDkim,
  language: Language,
): string {
  if (interpreted.state !== "observed") {
    return "";
  }
  return DKIM_COUNT_ANCHOR[language](
    interpreted.selectorsFound,
    interpreted.selectorsChecked,
  );
}

export function getHaseenInterpretation(language: Language): string {
  return HASEEN_PATTERN_COPY.observed[language];
}
