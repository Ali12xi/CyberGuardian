import type { Language } from "@/lib/i18n";
import type { ScanResult } from "@/lib/types";

export type EntropyBand = "normal" | "elevated" | "high";

const REPUTATION_COPY: Record<
  ScanResult["intelligence"]["reputation"],
  { en: string; ar: string }
> = {
  trusted: {
    en: "Domain has a positive reputation across intelligence sources.",
    ar: "النطاق يتمتع بسمعة إيجابية عبر مصادر الاستخبارات.",
  },
  suspicious: {
    en: "Intelligence signals indicate unusual patterns. Review before trusting this domain.",
    ar: "إشارات استخباراتية تشير لأنماط غير عادية. راجع قبل الثقة بهذا النطاق.",
  },
  neutral: {
    en: "No strong positive or negative reputation signals detected.",
    ar: "لا توجد إشارات سمعة قوية إيجابية أو سلبية.",
  },
};

const TYPOSQUAT_COPY = {
  likely: {
    en: "Domain pattern resembles a known brand or trademark.",
    ar: "نمط النطاق يشبه علامة تجارية معروفة.",
  },
  unlikely: {
    en: "No typosquatting patterns detected.",
    ar: "لا توجد أنماط انتحال هوية.",
  },
};

const ENTROPY_COPY: Record<EntropyBand, { en: string; ar: string }> = {
  normal: {
    en: "URL structure shows no obfuscation patterns.",
    ar: "بنية الرابط لا تظهر أنماط تشويش.",
  },
  elevated: {
    en: "URL randomness is elevated — review links shared out-of-band with extra care.",
    ar: "عشوائية الرابط مرتفعة — راجع الروابط المشتركة خارج الموقع بحذر إضافي.",
  },
  high: {
    en: "High URL randomness may indicate generated or obfuscated links.",
    ar: "عشوائية عالية في الرابط قد تشير لروابط مولّدة أو مشفّرة.",
  },
};

const PUNYCODE_COPY = {
  none: {
    en: "No Punycode or IDN encoding was detected on this hostname.",
    ar: "لم يُرصد ترميز Punycode أو IDN على اسم المضيف هذا.",
  },
  present: {
    en: "Internationalized domain encoding detected — verify the domain visually in the browser.",
    ar: "تم رصد ترميز نطاق دولي — تحقق من النطاق بصرياً في المتصفح.",
  },
};

const SUSPICIOUS_TLD_COPY = {
  yes: {
    en: "TLD is commonly associated with higher abuse rates; treat with caution.",
    ar: "امتداد النطاق يرتبط غالباً بمعدلات إساءة أعلى؛ تعامل بحذر.",
  },
  no: {
    en: "TLD does not match common high-risk patterns from this signal alone.",
    ar: "الامتداد لا يطابق أنماط الخطر الشائعة من هذه الإشارة وحدها.",
  },
};

export function getEntropyBand(entropy: number): EntropyBand {
  if (entropy > 4.5) {
    return "high";
  }
  if (entropy >= 3) {
    return "elevated";
  }
  return "normal";
}

export function pickLocalized<T extends { en: string; ar: string }>(row: T, language: Language): string {
  return language === "ar" ? row.ar : row.en;
}

export function getReputationExplanation(result: ScanResult, language: Language): string {
  return pickLocalized(REPUTATION_COPY[result.intelligence.reputation], language);
}

export function getTyposquattingExplanation(result: ScanResult, language: Language): string {
  return pickLocalized(result.intelligence.typosquatting ? TYPOSQUAT_COPY.likely : TYPOSQUAT_COPY.unlikely, language);
}

export function getEntropyExplanation(result: ScanResult, language: Language): string {
  const band = getEntropyBand(result.intelligence.entropy);
  return pickLocalized(ENTROPY_COPY[band], language);
}

export function getPunycodeExplanation(result: ScanResult, language: Language): string {
  return pickLocalized(result.intelligence.punycode ? PUNYCODE_COPY.present : PUNYCODE_COPY.none, language);
}

export function getSuspiciousTldExplanation(result: ScanResult, language: Language): string {
  return pickLocalized(
    result.intelligence.suspiciousTld ? SUSPICIOUS_TLD_COPY.yes : SUSPICIOUS_TLD_COPY.no,
    language,
  );
}

export function entropyStatusIcon(band: EntropyBand): "✅" | "⚠️" | "🔴" {
  if (band === "high") {
    return "🔴";
  }
  if (band === "elevated") {
    return "⚠️";
  }
  return "✅";
}

export function reputationStatusIcon(rep: ScanResult["intelligence"]["reputation"]): "✅" | "⚠️" {
  return rep === "suspicious" ? "⚠️" : "✅";
}
