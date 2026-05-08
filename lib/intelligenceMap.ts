export type IntelligenceSeverity = "critical" | "high" | "medium" | "low";

export type IntelligenceEntry = {
  id: string;
  technical: {
    en: string;
    ar: string;
  };
  impact: {
    en: string;
    ar: string;
  };
  remediation: {
    en: string;
    ar: string;
  };
  severity: IntelligenceSeverity;
  estimatedFixTime: {
    en: string;
    ar: string;
  };
};

export const intelligenceMap = {
  "missing-hsts": {
    id: "missing-hsts",
    technical: {
      en: "Missing Strict-Transport-Security header",
      ar: "رأس Strict-Transport-Security مفقود",
    },
    impact: {
      en: "Users on public WiFi can be pushed toward insecure connections where attackers may intercept their traffic.",
      ar: "قد يتعرض المستخدمون على شبكات WiFi العامة لاعتراض الاتصال إذا تم إجبار المتصفح على استخدام اتصال غير آمن.",
    },
    remediation: {
      en: "Enable Strict-Transport-Security with a long max-age after confirming HTTPS works across the entire site.",
      ar: "فعّل Strict-Transport-Security بقيمة max-age طويلة بعد التأكد من أن HTTPS يعمل على كامل الموقع.",
    },
    severity: "high",
    estimatedFixTime: {
      en: "15 minutes",
      ar: "15 دقيقة",
    },
  },
  "missing-csp": {
    id: "missing-csp",
    technical: {
      en: "Missing Content-Security-Policy header",
      ar: "رأس Content-Security-Policy مفقود",
    },
    impact: {
      en: "If attackers inject malicious JavaScript, the browser has fewer restrictions to stop account theft or session abuse.",
      ar: "إذا تم حقن JavaScript ضار، فلن يملك المتصفح قيودًا كافية لمنع سرقة الحسابات أو إساءة استخدام الجلسات.",
    },
    remediation: {
      en: "Deploy a Content-Security-Policy that restricts scripts, frames, images, and connections to trusted sources.",
      ar: "طبّق Content-Security-Policy يقيّد السكربتات والإطارات والصور والاتصالات على المصادر الموثوقة فقط.",
    },
    severity: "high",
    estimatedFixTime: {
      en: "1-2 hours",
      ar: "ساعة إلى ساعتين",
    },
  },
  "missing-x-frame-options": {
    id: "missing-x-frame-options",
    technical: {
      en: "Missing X-Frame-Options header",
      ar: "رأس X-Frame-Options مفقود",
    },
    impact: {
      en: "Attackers can embed sensitive pages in hidden frames and trick users into clicking login or payment actions.",
      ar: "يمكن للمهاجمين تضمين صفحات حساسة داخل إطارات مخفية وخداع المستخدم للنقر على إجراءات تسجيل دخول أو دفع.",
    },
    remediation: {
      en: "Set X-Frame-Options to DENY or SAMEORIGIN, or enforce frame-ancestors through CSP.",
      ar: "اضبط X-Frame-Options على DENY أو SAMEORIGIN، أو استخدم frame-ancestors ضمن CSP.",
    },
    severity: "medium",
    estimatedFixTime: {
      en: "10 minutes",
      ar: "10 دقائق",
    },
  },
  "missing-x-content-type-options": {
    id: "missing-x-content-type-options",
    technical: {
      en: "Missing X-Content-Type-Options header",
      ar: "رأس X-Content-Type-Options مفقود",
    },
    impact: {
      en: "Some browsers may guess file types incorrectly and execute uploaded or downloaded content as script.",
      ar: "قد تخمّن بعض المتصفحات نوع الملفات بشكل خاطئ وتنفذ محتوى مرفوعًا أو محملًا كسكربت.",
    },
    remediation: {
      en: "Set X-Content-Type-Options to nosniff on all HTTP responses.",
      ar: "اضبط X-Content-Type-Options على nosniff في جميع استجابات HTTP.",
    },
    severity: "medium",
    estimatedFixTime: {
      en: "5 minutes",
      ar: "5 دقائق",
    },
  },
  "missing-referrer-policy": {
    id: "missing-referrer-policy",
    technical: {
      en: "Missing Referrer-Policy header",
      ar: "رأس Referrer-Policy مفقود",
    },
    impact: {
      en: "Sensitive URLs, campaign tokens, or private paths may leak to third-party services when users navigate away.",
      ar: "قد تتسرب روابط حساسة أو رموز تتبع أو مسارات خاصة إلى خدمات خارجية عند انتقال المستخدمين.",
    },
    remediation: {
      en: "Set Referrer-Policy to strict-origin-when-cross-origin or a stricter policy that fits the application.",
      ar: "اضبط Referrer-Policy على strict-origin-when-cross-origin أو سياسة أكثر تقييدًا تناسب التطبيق.",
    },
    severity: "low",
    estimatedFixTime: {
      en: "5 minutes",
      ar: "5 دقائق",
    },
  },
  "missing-permissions-policy": {
    id: "missing-permissions-policy",
    technical: {
      en: "Missing Permissions-Policy header",
      ar: "رأس Permissions-Policy مفقود",
    },
    impact: {
      en: "Browser features such as camera, microphone, or location may remain available to pages that do not need them.",
      ar: "قد تبقى ميزات مثل الكاميرا أو الميكروفون أو الموقع متاحة لصفحات لا تحتاج إليها.",
    },
    remediation: {
      en: "Define a Permissions-Policy that disables unused browser capabilities by default.",
      ar: "عرّف Permissions-Policy يعطّل إمكانات المتصفح غير المستخدمة بشكل افتراضي.",
    },
    severity: "low",
    estimatedFixTime: {
      en: "10 minutes",
      ar: "10 دقائق",
    },
  },
  "weak-tls": {
    id: "weak-tls",
    technical: {
      en: "Weak TLS protocol or cipher",
      ar: "بروتوكول أو Cipher ضعيف في TLS",
    },
    impact: {
      en: "Encrypted traffic may be easier to downgrade, intercept, or decrypt on hostile networks.",
      ar: "قد يصبح الاتصال المشفر أسهل في الخفض أو الاعتراض أو فك التشفير على الشبكات العدائية.",
    },
    remediation: {
      en: "Disable deprecated TLS versions and weak ciphers, and prefer TLS 1.2+ with modern cipher suites.",
      ar: "عطّل إصدارات TLS القديمة والـ ciphers الضعيفة واعتمد TLS 1.2 أو أحدث مع حزم تشفير حديثة.",
    },
    severity: "high",
    estimatedFixTime: {
      en: "30 minutes",
      ar: "30 دقيقة",
    },
  },
  "expired-ssl": {
    id: "expired-ssl",
    technical: {
      en: "Expired SSL/TLS certificate",
      ar: "شهادة SSL/TLS منتهية الصلاحية",
    },
    impact: {
      en: "Users will see browser security warnings and may abandon the site because trust is visibly broken.",
      ar: "سيرى المستخدمون تحذيرات أمنية في المتصفح وقد يغادرون الموقع لأن الثقة أصبحت مكسورة بوضوح.",
    },
    remediation: {
      en: "Renew and deploy a valid certificate immediately, then verify automated renewal is working.",
      ar: "جدّد الشهادة وانشر شهادة صالحة فورًا، ثم تحقق من عمل التجديد التلقائي.",
    },
    severity: "critical",
    estimatedFixTime: {
      en: "15-30 minutes",
      ar: "15 إلى 30 دقيقة",
    },
  },
  "self-signed-ssl": {
    id: "self-signed-ssl",
    technical: {
      en: "Self-signed SSL/TLS certificate",
      ar: "شهادة SSL/TLS موقعة ذاتيًا",
    },
    impact: {
      en: "Visitors cannot verify that the site belongs to a trusted owner, which makes impersonation easier.",
      ar: "لا يستطيع الزوار التأكد من أن الموقع تابع لجهة موثوقة، ما يجعل انتحال الهوية أسهل.",
    },
    remediation: {
      en: "Replace the self-signed certificate with one issued by a trusted certificate authority.",
      ar: "استبدل الشهادة الموقعة ذاتيًا بشهادة صادرة من جهة شهادات موثوقة.",
    },
    severity: "high",
    estimatedFixTime: {
      en: "20 minutes",
      ar: "20 دقيقة",
    },
  },
  "ssl-expiring-soon": {
    id: "ssl-expiring-soon",
    technical: {
      en: "SSL/TLS certificate expiring soon",
      ar: "شهادة SSL/TLS ستنتهي قريبًا",
    },
    impact: {
      en: "The site may start showing security errors within 30 days if renewal fails or is missed.",
      ar: "قد يبدأ الموقع بعرض أخطاء أمنية خلال 30 يومًا إذا فشل التجديد أو تم نسيانه.",
    },
    remediation: {
      en: "Renew the certificate now and confirm automated renewal alerts are enabled.",
      ar: "جدّد الشهادة الآن وتأكد من تفعيل تنبيهات التجديد التلقائي.",
    },
    severity: "medium",
    estimatedFixTime: {
      en: "15 minutes",
      ar: "15 دقيقة",
    },
  },
  "suspicious-redirect": {
    id: "suspicious-redirect",
    technical: {
      en: "Suspicious redirect behavior",
      ar: "سلوك Redirect مشبوه",
    },
    impact: {
      en: "Users may be silently sent to phishing, malware, or untrusted pages after trusting the original domain.",
      ar: "قد يتم إرسال المستخدمين بصمت إلى صفحات تصيد أو برمجيات ضارة أو جهات غير موثوقة بعد ثقتهم بالنطاق الأصلي.",
    },
    remediation: {
      en: "Review redirect rules and allow only expected destinations controlled by the organization.",
      ar: "راجع قواعد Redirect واسمح فقط بالوجهات المتوقعة والخاضعة لسيطرة المؤسسة.",
    },
    severity: "high",
    estimatedFixTime: {
      en: "30 minutes",
      ar: "30 دقيقة",
    },
  },
  "redirect-loop": {
    id: "redirect-loop",
    technical: {
      en: "Redirect loop detected",
      ar: "تم اكتشاف حلقة Redirect",
    },
    impact: {
      en: "Users cannot reach the site reliably, which breaks access and can damage trust during critical journeys.",
      ar: "لا يستطيع المستخدمون الوصول إلى الموقع بشكل موثوق، مما يعطل الاستخدام ويؤثر على الثقة في اللحظات المهمة.",
    },
    remediation: {
      en: "Fix the redirect rules so each request reaches a stable final destination without cycling.",
      ar: "أصلح قواعد Redirect بحيث يصل كل طلب إلى وجهة نهائية مستقرة دون دوران.",
    },
    severity: "medium",
    estimatedFixTime: {
      en: "20 minutes",
      ar: "20 دقيقة",
    },
  },
  "cross-domain-redirect": {
    id: "cross-domain-redirect",
    technical: {
      en: "Cross-domain redirect",
      ar: "Redirect إلى نطاق مختلف",
    },
    impact: {
      en: "The original site hands users to another domain, which can confuse users and expose them to weaker controls.",
      ar: "ينقل الموقع الأصلي المستخدمين إلى نطاق آخر، مما قد يربكهم ويعرضهم لضوابط أضعف.",
    },
    remediation: {
      en: "Limit cross-domain redirects to approved destinations and document why each one is required.",
      ar: "قيّد Redirect بين النطاقات على وجهات معتمدة ووثّق سبب الحاجة لكل وجهة.",
    },
    severity: "medium",
    estimatedFixTime: {
      en: "20 minutes",
      ar: "20 دقيقة",
    },
  },
  "infrastructure-exposed": {
    id: "infrastructure-exposed",
    technical: {
      en: "Infrastructure metadata exposed",
      ar: "بيانات Infrastructure مكشوفة",
    },
    impact: {
      en: "Attackers can identify the server stack and prioritize known exploits for that technology.",
      ar: "يمكن للمهاجمين معرفة مكونات الخادم وترتيب استغلالات معروفة لتلك التقنيات حسب الأولوية.",
    },
    remediation: {
      en: "Reduce unnecessary server and framework headers while keeping operational diagnostics internal.",
      ar: "قلّل رؤوس Server وFramework غير الضرورية واجعل معلومات التشخيص التشغيلية داخلية.",
    },
    severity: "low",
    estimatedFixTime: {
      en: "10 minutes",
      ar: "10 دقائق",
    },
  },
  "domain-too-new": {
    id: "domain-too-new",
    technical: {
      en: "Recently registered domain",
      ar: "Domain مسجل حديثًا",
    },
    impact: {
      en: "New domains are often used in phishing campaigns before reputation systems can classify them.",
      ar: "تُستخدم النطاقات الجديدة كثيرًا في حملات التصيد قبل أن تتمكن أنظمة السمعة من تصنيفها.",
    },
    remediation: {
      en: "Add stronger verification, monitoring, and brand-trust controls before routing users through the domain.",
      ar: "أضف تحققًا ومراقبة وضوابط ثقة أقوى قبل توجيه المستخدمين عبر هذا النطاق.",
    },
    severity: "medium",
    estimatedFixTime: {
      en: "1 hour",
      ar: "ساعة واحدة",
    },
  },
} satisfies Record<string, IntelligenceEntry>;

export type IntelligenceFindingId = keyof typeof intelligenceMap;
