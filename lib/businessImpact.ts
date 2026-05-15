export type BusinessImpactCategory =
  | "user_data_risk"
  | "trust_risk"
  | "compliance_risk"
  | "account_security"
  | "infrastructure";

export type BusinessImpactRow = {
  category: BusinessImpactCategory;
  en: string;
  ar: string;
};

export const BUSINESS_IMPACT: Record<string, BusinessImpactRow> = {
  "missing-hsts": {
    category: "user_data_risk",
    en: "Puts visitor sessions at risk on shared or hostile networks",
    ar: "يعرض جلسات الزوار للخطر على الشبكات المشتركة أو العدائية",
  },
  "missing-csp": {
    category: "user_data_risk",
    en: "Increases impact if cross-site script injection is possible elsewhere",
    ar: "يزيد الأثر إن وُجدت إمكانية لحقن سكربت بين المواقع في مكان آخر",
  },
  "missing-x-frame-options": {
    category: "account_security",
    en: "Enables clickjacking that can trick users into harmful clicks",
    ar: "يتيح النقر الخادع الذي يخدع المستخدمين لنقرات ضارة",
  },
  "missing-x-content-type-options": {
    category: "user_data_risk",
    en: "Raises risk of unexpected execution from mislabeled uploads",
    ar: "يرفع خطر تنفيذ غير متوقع من رفعات مُصنَّفة خطأ",
  },
  "missing-referrer-policy": {
    category: "compliance_risk",
    en: "May leak sensitive URL details to third parties",
    ar: "قد تتسرّب تفاصيل حساسة من الرابط لأطراف ثالثة",
  },
  "missing-permissions-policy": {
    category: "compliance_risk",
    en: "Weakens least-privilege posture for browser capabilities",
    ar: "يضعف وضع أقل الصلاحيات لميزات المتصفح",
  },
  "weak-tls": {
    category: "trust_risk",
    en: "Undermines confidence in transport encryption",
    ar: "يقوّض الثقة في تشفير النقل",
  },
  "expired-ssl": {
    category: "trust_risk",
    en: "Immediately breaks trust for browsers and partners",
    ar: "يكسر الثقة فوراً لدى المتصفحات والشركاء",
  },
  "self-signed-ssl": {
    category: "trust_risk",
    en: "Visitors cannot verify identity without manual trust exceptions",
    ar: "لا يستطيع الزوار التحقق من الهوية دون استثناءات ثقة يدوية",
  },
  "ssl-expiring-soon": {
    category: "trust_risk",
    en: "Renewal delays cause sudden outages and support spikes",
    ar: "تأخير التجديد يسبب انقطاعاً مفاجئاً وذروة في الدعم",
  },
  "suspicious-redirect": {
    category: "account_security",
    en: "Can break login journeys or send users to unintended destinations",
    ar: "قد يعطل رحلات الدخول أو يوجّه لوجهات غير مقصودة",
  },
  "redirect-loop": {
    category: "infrastructure",
    en: "Availability and reliability impact for core flows",
    ar: "أثر على التوفر والاعتمادية للتدفقات الأساسية",
  },
  "cross-domain-redirect": {
    category: "trust_risk",
    en: "Requires extra review to rule out phishing or misconfiguration",
    ar: "يتطلب مراجعة إضافية لاستبعاد التصيد أو سوء التهيئة",
  },
  "infrastructure-exposed": {
    category: "infrastructure",
    en: "Exposes stack details useful for targeted attacks",
    ar: "يكشف تفاصيل مكدس مفيدة للهجمات المستهدفة",
  },
  "domain-too-new": {
    category: "trust_risk",
    en: "Youth alone is not guilt—but it raises screening friction",
    ar: "الحداثة وحدها ليست إدانة—لكنها تزيد احتكاك الفحص",
  },
};

export function getBusinessImpact(id: string): BusinessImpactRow | undefined {
  return BUSINESS_IMPACT[id];
}
