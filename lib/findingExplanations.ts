export type FindingExplanation = {
  plainEn: string;
  plainAr: string;
  whyMattersEn: string;
  whyMattersAr: string;
};

/** Plain-language copy only (not i18n strings for UI chrome). */
export const FINDING_EXPLANATIONS: Record<string, FindingExplanation> = {
  "missing-hsts": {
    plainEn:
      "Your site does not tell browsers to always use HTTPS on future visits. Someone on the same coffee-shop Wi‑Fi could downgrade or intercept traffic before it becomes secure.",
    plainAr:
      "موقعك لا يُجبر المتصفح على استخدام HTTPS دائماً في الزيارات القادمة. شخص على نفس شبكة الواي فاي قد يعترض الاتصال قبل أن يصبح آمناً.",
    whyMattersEn:
      "HSTS reduces downgrade and cookie hijacking risk on untrusted networks by forcing HTTPS first.",
    whyMattersAr:
      "يقلل HSTS من خطر تخفيض البروتوكول وسرعة اعتراض الجلسات على الشبكات غير الموثوقة بفرض HTTPS أولاً.",
  },
  "missing-csp": {
    plainEn:
      "There is no Content Security Policy on this response. If another weakness exists, injected scripts could run with more impact than they otherwise would.",
    plainAr:
      "لا توجد سياسة أمان للمحتوى في هذه الاستجابة. إن وُجد ضعف آخر، قد تعمل سكربتات حقن بأثر أكبر من المعتاد.",
    whyMattersEn:
      "Modern browsers use CSP as a primary line of defense against cross-site script injection at render time.",
    whyMattersAr:
      "تستخدم المتصفحات الحديثة CSP كخط دفاع رئيسي ضد حقن السكربتات عند العرض.",
  },
  "missing-x-frame-options": {
    plainEn:
      "Your page can be shown inside another site’s frame without restriction. Attackers can hide real buttons under fake content and trick people into clicking the wrong thing.",
    plainAr:
      "يمكن عرض صفحتك داخل إطار موقع آخر دون قيود. قد يخفي المهاجمون أزراراً حقيقية تحت محتوى مزيف ويخدعون النقر.",
    whyMattersEn:
      "Frame controls reduce clickjacking risk where invisible overlays steal clicks or credentials.",
    whyMattersAr:
      "تقلل ضوابط الإطارات من خطر النقر الخادع حيث تُسرق النقرات أو بيانات الدخول عبر طبقات غير مرئية.",
  },
  "missing-x-content-type-options": {
    plainEn:
      "The browser is not told to avoid guessing file types from content. Uploaded files that look harmless could be treated as executable in edge cases.",
    plainAr:
      "لم يُطلب من المتصفح تجنب تخمين أنواع الملفات من المحتوى. قد تُعامل ملفات تبدو بريئة كقابلة للتنفيذ في حالات حدّية.",
    whyMattersEn:
      "MIME sniffing defenses limit browsers from executing unexpected script-like content from non-script responses.",
    whyMattersAr:
      "تقيّد دفاعات MIME sniffing قيام المتصفح بتنفيذ محتوى شبيه بالسكربت من استجابات غير مخصصة لذلك.",
  },
  "missing-referrer-policy": {
    plainEn:
      "Referrer details may leak more than necessary when users follow links away from your site. That can expose internal paths or tokens in URLs.",
    plainAr:
      "قد تتسرّب تفاصيل المرجع أكثر من اللازم عند انتقال المستخدمين لروابط خارج موقعك. قد يكشف ذلك مسارات داخلية أو رموزاً في الرابط.",
    whyMattersEn:
      "A referrer policy narrows what navigation metadata is shared to partner sites and analytics.",
    whyMattersAr:
      "يحدّد سياسة المرجع ما تُشاركه المتصفحات من بيانات التنقل مع المواقع الشريكة والتحليلات.",
  },
  "missing-permissions-policy": {
    plainEn:
      "Powerful browser features like camera or microphone are not explicitly locked down by policy. Accidental or malicious misuse becomes easier if another flaw appears.",
    plainAr:
      "لم تُقفل ميزات المتصفح القوية مثل الكاميرا أو الميكروفون صراحةً بالسياسة. يصبح سوء الاستخدام أسهل إن ظهر خلل آخر.",
    whyMattersEn:
      "Permissions-Policy sets a default deny posture for sensitive APIs unless you opt in per origin.",
    whyMattersAr:
      "تفرض Permissions-Policy رفضاً افتراضياً لواجهات حساسة ما لم تُفعّل صراحةً لكل أصل.",
  },
  "weak-tls": {
    plainEn:
      "The connection may be using an older TLS version or settings that are no longer considered safe. Attackers with network access could decrypt or alter traffic more easily.",
    plainAr:
      "قد يستخدم الاتصال إصدار TLS أو إعدادات لم تعد تعتبر آمناً. من يملك وصولاً للشبكة قد يفك التشفير أو يعدّل الحركة بسهولة أكبر.",
    whyMattersEn:
      "Deprecated TLS removes modern cryptographic guarantees browsers and auditors expect.",
    whyMattersAr:
      "إزالة TLS القديمة تُضعف ضمانات التشفير التي يتوقعها المتصفحون والمدققون.",
  },
  "expired-ssl": {
    plainEn:
      "The certificate date has passed. Visitors will see warnings and may leave, and automated tools will flag the site as untrustworthy.",
    plainAr:
      "انتهت صلاحية الشهادة. سيرى الزوار تحذيرات وقد يغادرون، والأدوات الآلية ستصنّف الموقع غير موثوق.",
    whyMattersEn:
      "Expired certificates break the trust chain browsers use to prove identity and encryption.",
    whyMattersAr:
      "تعطل الشهادات المنتهية سلسلة الثقة التي يعتمدها المتصفح لإثبات الهوية والتشفير.",
  },
  "self-signed-ssl": {
    plainEn:
      "The certificate is not signed by a public authority browsers already trust. Visitors cannot tell your site apart from an impersonator without extra steps.",
    plainAr:
      "الشهادة غير موقعة من جهة يثق بها المتصفح عامةً. لا يستطيع الزوار تمييز موقعك عن منتحل دون خطوات إضافية.",
    whyMattersEn:
      "Public CAs anchor trust so clients can validate identity without manual exceptions.",
    whyMattersAr:
      "ترسيخ الثقة عبر جهات عامة يتيح للعميل التحقق من الهوية دون استثناءات يدوية.",
  },
  "ssl-expiring-soon": {
    plainEn:
      "The certificate will expire soon. If renewal slips, visitors will suddenly see errors and partners may pause integrations.",
    plainAr:
      "ستنتهي صلاحية الشهادة قريباً. إن تأخر التجديد، ستظهر للزوار أخطاء فجأة وقد توقف الشركاء التكامل.",
    whyMattersEn:
      "Renewal windows prevent unplanned outages and preserve monitoring continuity.",
    whyMattersAr:
      "نوافذ التجديد تمنع انقطاعاً غير مخطط وتحافظ على استمرار المراقبة.",
  },
  "suspicious-redirect": {
    plainEn:
      "Redirects go somewhere unexpected or look risky. Users could land on a different site than they intended, or loops could break login flows.",
    plainAr:
      "توجّه إعادة التوجيه إلى وجهات غير متوقعة أو تبدو خطرة. قد يصل المستخدمون لموقع غير المقصود أو تتعطل تدفقات الدخول.",
    whyMattersEn:
      "Redirect integrity protects session continuity and prevents open redirect abuse.",
    whyMattersAr:
      "سلامة إعادة التوجيه تحمي استمرارية الجلسة وتمنع إساءة التحويل المفتوح.",
  },
  "redirect-loop": {
    plainEn:
      "The browser would bounce between URLs forever until it gives up. Users cannot complete the action they started.",
    plainAr:
      "سيرتد المتصفح بين الروابط إلى أن يستسلم. لا يستطيع المستخدمون إكمال الإجراء الذي بدأوه.",
    whyMattersEn:
      "Loops waste capacity and are a strong signal of misconfiguration or abuse.",
    whyMattersAr:
      "الحلقات تستهلك الموارد وإشارة قوية لسوء تهيئة أو إساءة استخدام.",
  },
  "cross-domain-redirect": {
    plainEn:
      "Traffic jumps to a different site name than where the user started. That can be normal, but it can also hide phishing if unexpected.",
    plainAr:
      "ينتقل الطلب إلى اسم موقع مختلف عن البداية. قد يكون طبيعياً، لكنه قد يخفي تصيداً إن كان غير متوقع.",
    whyMattersEn:
      "Cross-domain hops increase review burden for security and fraud teams.",
    whyMattersAr:
      "تزيد القفزات بين النطاقات عبء المراجعة على فرق الأمن والاحتيال.",
  },
  "infrastructure-exposed": {
    plainEn:
      "Software names or versions are visible in public responses. Attackers can match those versions to known weaknesses without probing deeply.",
    plainAr:
      "تظهر أسماء أو إصدارات البرمجيات في استجابات عامة. يمكن للمهاجمين مطابقة الإصدارات مع نقاط ضعف معروفة دون تعمق.",
    whyMattersEn:
      "Version fingerprinting speeds up targeted exploitation planning.",
    whyMattersAr:
      "تمكّن بصمة الإصدار من تسريع تخطيط الاستغلال المستهدف.",
  },
  "domain-too-new": {
    plainEn:
      "The domain name is very new. Fraudsters often use fresh domains briefly, so some filters treat youth as a caution flag—not proof of harm.",
    plainAr:
      "اسم النطاق جديد جداً. غالباً ما يستخدم المحتالون نطاقات طازجة لفترة قصيرة، لذا تعامل بعض المرشحات الجدة كتحذير وليس كدليل ضرر.",
    whyMattersEn:
      "Domain age is a weak signal used alongside other evidence in abuse models.",
    whyMattersAr:
      "عمر النطاق إشارة ضعيفة تُستخدم مع أدلة أخرى في نماذج الإساءة.",
  },
};

export function getFindingExplanation(id: string): FindingExplanation | undefined {
  return FINDING_EXPLANATIONS[id];
}
