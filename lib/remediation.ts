export type RemediationLanguage = "en" | "ar";

export type RemediationCategory =
  | "https-security"
  | "header-protection"
  | "infrastructure"
  | "reputation"
  | "tls";

export type RemediationSeverity = "critical" | "high" | "medium" | "low";
export type RemediationDifficulty = "easy" | "medium" | "hard";
export type RiskReduction = "high" | "medium" | "low";

export type LocalizedText = {
  en: string;
  ar: string;
};

export type RemediationEntry = {
  id: string;
  category: RemediationCategory;
  severity: RemediationSeverity;
  title: LocalizedText;
  explanation: {
    simple: LocalizedText;
    technical: LocalizedText;
  };
  businessImpact: LocalizedText;
  severityReason: LocalizedText;
  recommendation: LocalizedText;
  codeExamples: {
    vercel?: string;
    nginx?: string;
    apache?: string;
    cloudflare?: string;
  };
  difficulty: RemediationDifficulty;
  estimatedFixTime: LocalizedText;
  riskReduction: RiskReduction;
};

export type LocalizedRemediationEntry = Omit<
  RemediationEntry,
  | "title"
  | "explanation"
  | "businessImpact"
  | "severityReason"
  | "recommendation"
  | "estimatedFixTime"
> & {
  title: string;
  explanation: {
    simple: string;
    technical: string;
  };
  businessImpact: string;
  severityReason: string;
  recommendation: string;
  estimatedFixTime: string;
};

export type RemediationFindingId =
  | "missing-hsts"
  | "missing-csp"
  | "missing-x-frame-options"
  | "missing-x-content-type-options"
  | "missing-referrer-policy"
  | "missing-permissions-policy"
  | "weak-tls"
  | "expired-ssl"
  | "self-signed-ssl"
  | "ssl-expiring-soon"
  | "suspicious-redirect"
  | "redirect-loop"
  | "cross-domain-redirect"
  | "infrastructure-exposed"
  | "domain-too-new";

const commonHeaderExamples = {
  vercel: `{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'" }
      ]
    }
  ]
}`,
  nginx: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'" always;`,
  apache: `Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
Header always set Content-Security-Policy "default-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'"`,
};

export const remediationMap = {
  "missing-hsts": {
    id: "missing-hsts",
    category: "https-security",
    severity: "high",
    title: {
      en: "Missing HTTP Strict Transport Security",
      ar: "غياب سياسة HSTS",
    },
    explanation: {
      simple: {
        en: "The site does not tell browsers to always use HTTPS for future visits.",
        ar: "الموقع لا يطلب من المتصفح استخدام HTTPS دائمًا في الزيارات القادمة.",
      },
      technical: {
        en: "Strict-Transport-Security is absent, so browsers may still attempt insecure HTTP connections before upgrading to HTTPS.",
        ar: "رأس Strict-Transport-Security غير موجود، لذلك قد يحاول المتصفح الاتصال عبر HTTP غير الآمن قبل الانتقال إلى HTTPS.",
      },
    },
    businessImpact: {
      en: "Users on public or hostile networks may be exposed to interception attempts before the secure connection is enforced.",
      ar: "قد يتعرض المستخدمون على الشبكات العامة أو غير الموثوقة لمحاولات اعتراض قبل فرض الاتصال الآمن.",
    },
    severityReason: {
      en: "This is high severity because it weakens HTTPS enforcement and can enable downgrade-style attacks.",
      ar: "تُعد المشكلة عالية الخطورة لأنها تضعف فرض HTTPS وقد تسمح بهجمات خفض مستوى الاتصال.",
    },
    recommendation: {
      en: "Enable HSTS with a long max-age after confirming that every page and subdomain works correctly over HTTPS.",
      ar: "فعّل HSTS بقيمة max-age طويلة بعد التأكد من أن جميع الصفحات والنطاقات الفرعية تعمل بشكل صحيح عبر HTTPS.",
    },
    codeExamples: {
      vercel: commonHeaderExamples.vercel,
      nginx: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`,
      apache: `Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"`,
    },
    difficulty: "easy",
    estimatedFixTime: {
      en: "15 minutes",
      ar: "15 دقيقة",
    },
    riskReduction: "high",
  },
  "missing-csp": {
    id: "missing-csp",
    category: "header-protection",
    severity: "high",
    title: {
      en: "Missing Content Security Policy",
      ar: "غياب Content Security Policy",
    },
    explanation: {
      simple: {
        en: "The browser has fewer rules to block unsafe scripts, frames, and external resources.",
        ar: "المتصفح لا يملك قواعد كافية لمنع السكربتات أو الإطارات أو الموارد غير الآمنة.",
      },
      technical: {
        en: "Content-Security-Policy is absent, reducing browser-side protection against script injection, clickjacking, and untrusted resource loading.",
        ar: "رأس Content-Security-Policy غير موجود، مما يقلل حماية المتصفح من حقن السكربتات وClickjacking وتحميل الموارد غير الموثوقة.",
      },
    },
    businessImpact: {
      en: "A successful injection issue could lead to account abuse, session theft, or damaged user trust.",
      ar: "قد يؤدي نجاح حقن محتوى ضار إلى إساءة استخدام الحسابات أو سرقة الجلسات أو إضعاف ثقة المستخدمين.",
    },
    severityReason: {
      en: "This is high severity because CSP is a major browser control that limits the impact of several common web attacks.",
      ar: "تُعد المشكلة عالية الخطورة لأن CSP من أهم ضوابط المتصفح التي تحد من أثر عدة هجمات ويب شائعة.",
    },
    recommendation: {
      en: "Start with a restrictive policy for default sources, scripts, frames, objects, and base URI, then expand only for trusted services.",
      ar: "ابدأ بسياسة مقيّدة للمصادر الافتراضية والسكربتات والإطارات والكائنات وbase URI، ثم أضف فقط الخدمات الموثوقة.",
    },
    codeExamples: {
      vercel: commonHeaderExamples.vercel,
      nginx: `add_header Content-Security-Policy "default-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'" always;`,
      apache: `Header always set Content-Security-Policy "default-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'"`,
    },
    difficulty: "medium",
    estimatedFixTime: {
      en: "1-2 hours",
      ar: "ساعة إلى ساعتين",
    },
    riskReduction: "high",
  },
  "missing-x-frame-options": {
    id: "missing-x-frame-options",
    category: "header-protection",
    severity: "medium",
    title: {
      en: "Missing Frame Protection",
      ar: "غياب حماية الإطارات",
    },
    explanation: {
      simple: {
        en: "Other sites may be able to embed your pages inside frames.",
        ar: "قد تتمكن مواقع أخرى من تضمين صفحاتك داخل إطارات.",
      },
      technical: {
        en: "X-Frame-Options is absent, and without a CSP frame-ancestors rule the page may be exposed to clickjacking.",
        ar: "رأس X-Frame-Options غير موجود، وبدون قاعدة frame-ancestors في CSP قد تتعرض الصفحة لهجمات Clickjacking.",
      },
    },
    businessImpact: {
      en: "Users can be tricked into clicking hidden login, payment, or account actions on a malicious page.",
      ar: "قد يتم خداع المستخدمين للنقر على إجراءات تسجيل دخول أو دفع أو حساب مخفية داخل صفحة ضارة.",
    },
    severityReason: {
      en: "This is medium severity because it mainly affects sensitive interactive pages and user actions.",
      ar: "تُعد المشكلة متوسطة الخطورة لأنها تؤثر غالبًا على الصفحات التفاعلية الحساسة وإجراءات المستخدم.",
    },
    recommendation: {
      en: "Set X-Frame-Options to SAMEORIGIN or DENY, and prefer CSP frame-ancestors for modern control.",
      ar: "اضبط X-Frame-Options على SAMEORIGIN أو DENY، ويفضل استخدام frame-ancestors ضمن CSP للتحكم الحديث.",
    },
    codeExamples: {
      vercel: `{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" }
      ]
    }
  ]
}`,
      nginx: `add_header X-Frame-Options "SAMEORIGIN" always;`,
      apache: `Header always set X-Frame-Options "SAMEORIGIN"`,
    },
    difficulty: "easy",
    estimatedFixTime: {
      en: "10 minutes",
      ar: "10 دقائق",
    },
    riskReduction: "medium",
  },
  "missing-x-content-type-options": {
    id: "missing-x-content-type-options",
    category: "header-protection",
    severity: "medium",
    title: {
      en: "Missing MIME Sniffing Protection",
      ar: "غياب حماية MIME Sniffing",
    },
    explanation: {
      simple: {
        en: "Browsers may try to guess file types instead of trusting the declared content type.",
        ar: "قد يحاول المتصفح تخمين نوع الملف بدلًا من الاعتماد على نوع المحتوى المعلن.",
      },
      technical: {
        en: "X-Content-Type-Options is absent, allowing MIME sniffing behavior that can turn misclassified files into executable content.",
        ar: "رأس X-Content-Type-Options غير موجود، مما يسمح بسلوك MIME sniffing الذي قد يحول الملفات المصنفة خطأ إلى محتوى قابل للتنفيذ.",
      },
    },
    businessImpact: {
      en: "A content handling mistake could become a security issue if uploaded or downloaded files are interpreted unsafely.",
      ar: "قد يتحول خطأ في التعامل مع المحتوى إلى مشكلة أمنية إذا فُسرت الملفات المرفوعة أو المحملة بشكل غير آمن.",
    },
    severityReason: {
      en: "This is medium severity because the fix is simple and prevents a known class of browser misinterpretation attacks.",
      ar: "تُعد المشكلة متوسطة الخطورة لأن إصلاحها بسيط ويمنع نوعًا معروفًا من هجمات سوء تفسير المتصفح للمحتوى.",
    },
    recommendation: {
      en: "Set X-Content-Type-Options to nosniff on all responses.",
      ar: "اضبط X-Content-Type-Options على nosniff في جميع الاستجابات.",
    },
    codeExamples: {
      vercel: `{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}`,
      nginx: `add_header X-Content-Type-Options "nosniff" always;`,
      apache: `Header always set X-Content-Type-Options "nosniff"`,
    },
    difficulty: "easy",
    estimatedFixTime: {
      en: "5 minutes",
      ar: "5 دقائق",
    },
    riskReduction: "medium",
  },
  "missing-referrer-policy": {
    id: "missing-referrer-policy",
    category: "header-protection",
    severity: "low",
    title: {
      en: "Missing Referrer Policy",
      ar: "غياب سياسة Referrer",
    },
    explanation: {
      simple: {
        en: "Browsers may share more URL information with other sites than necessary.",
        ar: "قد يشارك المتصفح معلومات من الرابط مع مواقع أخرى أكثر من اللازم.",
      },
      technical: {
        en: "Referrer-Policy is absent, so full paths, query strings, or campaign tokens may be sent during navigation.",
        ar: "رأس Referrer-Policy غير موجود، لذلك قد تُرسل المسارات الكاملة أو معاملات الرابط أو رموز الحملات أثناء التنقل.",
      },
    },
    businessImpact: {
      en: "Private paths or tracking tokens may leak to third parties, creating privacy and compliance concerns.",
      ar: "قد تتسرب مسارات خاصة أو رموز تتبع إلى أطراف خارجية، مما يسبب مخاوف خصوصية وامتثال.",
    },
    severityReason: {
      en: "This is low severity because it usually exposes metadata rather than direct access, but it still improves privacy posture.",
      ar: "تُعد المشكلة منخفضة الخطورة لأنها غالبًا تكشف بيانات وصفية لا وصولًا مباشرًا، لكنها مهمة لتحسين الخصوصية.",
    },
    recommendation: {
      en: "Set Referrer-Policy to strict-origin-when-cross-origin or stricter if the application can support it.",
      ar: "اضبط Referrer-Policy على strict-origin-when-cross-origin أو سياسة أكثر تقييدًا إذا كان التطبيق يدعم ذلك.",
    },
    codeExamples: {
      vercel: `{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}`,
      nginx: `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
      apache: `Header always set Referrer-Policy "strict-origin-when-cross-origin"`,
    },
    difficulty: "easy",
    estimatedFixTime: {
      en: "5 minutes",
      ar: "5 دقائق",
    },
    riskReduction: "low",
  },
  "missing-permissions-policy": {
    id: "missing-permissions-policy",
    category: "header-protection",
    severity: "low",
    title: {
      en: "Missing Permissions Policy",
      ar: "غياب Permissions Policy",
    },
    explanation: {
      simple: {
        en: "Browser features such as camera, microphone, and location are not restricted by policy.",
        ar: "ميزات المتصفح مثل الكاميرا والميكروفون والموقع غير مقيّدة بسياسة واضحة.",
      },
      technical: {
        en: "Permissions-Policy is absent, so unused browser capabilities are not explicitly disabled for the origin.",
        ar: "رأس Permissions-Policy غير موجود، لذلك لا يتم تعطيل إمكانات المتصفح غير المستخدمة صراحةً لهذا النطاق.",
      },
    },
    businessImpact: {
      en: "The site may appear less privacy-conscious, especially for products handling user accounts or sensitive workflows.",
      ar: "قد يبدو الموقع أقل اهتمامًا بالخصوصية، خصوصًا عند التعامل مع حسابات المستخدمين أو مسارات حساسة.",
    },
    severityReason: {
      en: "This is low severity because it is a hardening control, but it reduces unnecessary browser attack surface.",
      ar: "تُعد المشكلة منخفضة الخطورة لأنها إجراء تقوية أمني، لكنها تقلل سطح الهجوم داخل المتصفح.",
    },
    recommendation: {
      en: "Disable browser capabilities that the site does not need, then allow features only where required.",
      ar: "عطّل إمكانات المتصفح التي لا يحتاجها الموقع، ثم اسمح بالميزات فقط عند الحاجة.",
    },
    codeExamples: {
      vercel: `{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}`,
      nginx: `add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;`,
      apache: `Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"`,
    },
    difficulty: "easy",
    estimatedFixTime: {
      en: "10 minutes",
      ar: "10 دقائق",
    },
    riskReduction: "low",
  },
  "weak-tls": {
    id: "weak-tls",
    category: "tls",
    severity: "high",
    title: {
      en: "Weak TLS Configuration",
      ar: "إعدادات TLS ضعيفة",
    },
    explanation: {
      simple: {
        en: "The encrypted connection may support older protocols or weak cipher choices.",
        ar: "قد يدعم الاتصال المشفر بروتوكولات قديمة أو خيارات تشفير ضعيفة.",
      },
      technical: {
        en: "Deprecated TLS versions or weak ciphers increase exposure to downgrade, compatibility, and cryptographic attacks.",
        ar: "إصدارات TLS القديمة أو خوارزميات التشفير الضعيفة تزيد التعرض لهجمات خفض المستوى ومشكلات التوافق والتشفير.",
      },
    },
    businessImpact: {
      en: "Customers may lose confidence if the site appears to use outdated transport security.",
      ar: "قد يفقد العملاء الثقة إذا بدا أن الموقع يستخدم حماية نقل بيانات قديمة.",
    },
    severityReason: {
      en: "This is high severity because TLS protects credentials, sessions, and sensitive user traffic in transit.",
      ar: "تُعد المشكلة عالية الخطورة لأن TLS يحمي بيانات الدخول والجلسات وحركة المستخدم الحساسة أثناء النقل.",
    },
    recommendation: {
      en: "Disable TLS 1.0 and 1.1, enable TLS 1.2 or TLS 1.3, and use modern cipher suites.",
      ar: "عطّل TLS 1.0 وTLS 1.1، وفعّل TLS 1.2 أو TLS 1.3 مع حزم تشفير حديثة.",
    },
    codeExamples: {
      nginx: `ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;`,
      apache: `SSLProtocol -all +TLSv1.2 +TLSv1.3`,
    },
    difficulty: "medium",
    estimatedFixTime: {
      en: "30 minutes",
      ar: "30 دقيقة",
    },
    riskReduction: "high",
  },
  "expired-ssl": {
    id: "expired-ssl",
    category: "tls",
    severity: "critical",
    title: {
      en: "Expired SSL/TLS Certificate",
      ar: "انتهاء صلاحية شهادة SSL/TLS",
    },
    explanation: {
      simple: {
        en: "The certificate is no longer valid, so browsers may block or warn users before they enter the site.",
        ar: "الشهادة لم تعد صالحة، لذلك قد يحظر المتصفح الدخول أو يعرض تحذيرًا للمستخدمين.",
      },
      technical: {
        en: "The certificate validity period has ended, breaking trust validation for HTTPS connections.",
        ar: "انتهت مدة صلاحية الشهادة، مما يكسر التحقق من الثقة في اتصالات HTTPS.",
      },
    },
    businessImpact: {
      en: "Users may abandon the site immediately because browser warnings make the service look unsafe.",
      ar: "قد يغادر المستخدمون الموقع فورًا لأن تحذيرات المتصفح تجعل الخدمة تبدو غير آمنة.",
    },
    severityReason: {
      en: "This is critical because trust is visibly broken and secure access may fail for most users.",
      ar: "تُعد المشكلة حرجة لأن الثقة مكسورة بوضوح وقد يفشل الوصول الآمن لمعظم المستخدمين.",
    },
    recommendation: {
      en: "Renew and deploy a trusted certificate immediately, then verify automatic renewal and expiry alerts.",
      ar: "جدّد وانشر شهادة موثوقة فورًا، ثم تحقق من التجديد التلقائي وتنبيهات انتهاء الصلاحية.",
    },
    codeExamples: {
      nginx: `ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;`,
      apache: `SSLCertificateFile /etc/letsencrypt/live/example.com/fullchain.pem
SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem`,
    },
    difficulty: "medium",
    estimatedFixTime: {
      en: "15-30 minutes",
      ar: "15 إلى 30 دقيقة",
    },
    riskReduction: "high",
  },
  "self-signed-ssl": {
    id: "self-signed-ssl",
    category: "tls",
    severity: "high",
    title: {
      en: "Self-Signed SSL/TLS Certificate",
      ar: "شهادة SSL/TLS موقعة ذاتيًا",
    },
    explanation: {
      simple: {
        en: "The certificate was not issued by a trusted public certificate authority.",
        ar: "الشهادة لم تصدر من جهة شهادات عامة موثوقة.",
      },
      technical: {
        en: "A self-signed certificate cannot be validated through the browser trust store, so identity assurance is missing.",
        ar: "لا يمكن التحقق من الشهادة الموقعة ذاتيًا عبر مخزن الثقة في المتصفح، لذلك يغيب ضمان الهوية.",
      },
    },
    businessImpact: {
      en: "Visitors may see warnings and question whether the site is legitimate.",
      ar: "قد يرى الزوار تحذيرات ويتساءلون عما إذا كان الموقع حقيقيًا وموثوقًا.",
    },
    severityReason: {
      en: "This is high severity because users cannot reliably verify the site owner.",
      ar: "تُعد المشكلة عالية الخطورة لأن المستخدمين لا يستطيعون التحقق من مالك الموقع بشكل موثوق.",
    },
    recommendation: {
      en: "Replace the self-signed certificate with a certificate issued by a trusted certificate authority.",
      ar: "استبدل الشهادة الموقعة ذاتيًا بشهادة صادرة من جهة شهادات موثوقة.",
    },
    codeExamples: {
      nginx: `ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;`,
      apache: `SSLCertificateFile /etc/letsencrypt/live/example.com/fullchain.pem
SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem`,
    },
    difficulty: "medium",
    estimatedFixTime: {
      en: "20 minutes",
      ar: "20 دقيقة",
    },
    riskReduction: "high",
  },
  "ssl-expiring-soon": {
    id: "ssl-expiring-soon",
    category: "tls",
    severity: "medium",
    title: {
      en: "SSL/TLS Certificate Expiring Soon",
      ar: "قرب انتهاء شهادة SSL/TLS",
    },
    explanation: {
      simple: {
        en: "The certificate is valid now but may expire soon if renewal is missed.",
        ar: "الشهادة صالحة الآن لكنها قد تنتهي قريبًا إذا لم يتم تجديدها.",
      },
      technical: {
        en: "The certificate has a short remaining validity window, increasing the chance of an outage if renewal automation fails.",
        ar: "بقيت للشهادة مدة صلاحية قصيرة، مما يزيد احتمال تعطل الوصول إذا فشل التجديد التلقائي.",
      },
    },
    businessImpact: {
      en: "A missed renewal can suddenly create browser warnings, support tickets, and lost conversions.",
      ar: "قد يؤدي نسيان التجديد إلى تحذيرات مفاجئة في المتصفح وطلبات دعم وخسارة تحويلات.",
    },
    severityReason: {
      en: "This is medium severity because the site is still trusted today, but the failure window is approaching.",
      ar: "تُعد المشكلة متوسطة الخطورة لأن الموقع ما زال موثوقًا اليوم، لكن فترة الفشل المحتملة تقترب.",
    },
    recommendation: {
      en: "Renew the certificate early and verify that automated renewal and expiry notifications are working.",
      ar: "جدّد الشهادة مبكرًا وتأكد من عمل التجديد التلقائي وتنبيهات انتهاء الصلاحية.",
    },
    codeExamples: {},
    difficulty: "easy",
    estimatedFixTime: {
      en: "15 minutes",
      ar: "15 دقيقة",
    },
    riskReduction: "medium",
  },
  "suspicious-redirect": {
    id: "suspicious-redirect",
    category: "infrastructure",
    severity: "high",
    title: {
      en: "Suspicious Redirect Behavior",
      ar: "سلوك تحويل مشبوه",
    },
    explanation: {
      simple: {
        en: "The site redirects users in a way that may lead to unexpected or untrusted destinations.",
        ar: "الموقع يحوّل المستخدمين بطريقة قد تقود إلى وجهات غير متوقعة أو غير موثوقة.",
      },
      technical: {
        en: "Redirect behavior appears unusual, excessive, or aligned with patterns commonly seen in phishing or traffic laundering flows.",
        ar: "سلوك التحويل يبدو غير معتاد أو زائدًا أو مشابهًا لأنماط تظهر في التصيد أو تمرير الزيارات عبر مسارات غير موثوقة.",
      },
    },
    businessImpact: {
      en: "Users may lose trust if they start on your domain and end up somewhere unexpected.",
      ar: "قد يفقد المستخدمون الثقة إذا بدأوا من نطاقك وانتهوا في وجهة غير متوقعة.",
    },
    severityReason: {
      en: "This is high severity because redirect abuse can quickly turn a trusted entry point into a phishing path.",
      ar: "تُعد المشكلة عالية الخطورة لأن إساءة استخدام التحويلات قد تحول نقطة دخول موثوقة إلى مسار تصيد.",
    },
    recommendation: {
      en: "Review redirect rules, remove unexpected destinations, and allow only approved domains owned or trusted by the organization.",
      ar: "راجع قواعد التحويل، وأزل الوجهات غير المتوقعة، واسمح فقط بالنطاقات المعتمدة والمملوكة أو الموثوقة من المؤسسة.",
    },
    codeExamples: {
      nginx: `return 301 https://example.com$request_uri;`,
      apache: `Redirect permanent / https://example.com/`,
    },
    difficulty: "medium",
    estimatedFixTime: {
      en: "30 minutes",
      ar: "30 دقيقة",
    },
    riskReduction: "high",
  },
  "redirect-loop": {
    id: "redirect-loop",
    category: "infrastructure",
    severity: "medium",
    title: {
      en: "Redirect Loop",
      ar: "حلقة تحويل متكررة",
    },
    explanation: {
      simple: {
        en: "The site may send visitors between URLs repeatedly instead of reaching a final page.",
        ar: "قد ينقل الموقع الزائرين بين روابط بشكل متكرر بدلًا من الوصول إلى صفحة نهائية.",
      },
      technical: {
        en: "Redirect rules appear to cycle between locations, which can prevent clients and scanners from reaching a stable final URL.",
        ar: "قواعد التحويل تبدو وكأنها تدور بين مواقع متكررة، مما يمنع المتصفحات والماسحات من الوصول إلى رابط نهائي مستقر.",
      },
    },
    businessImpact: {
      en: "Visitors may be unable to access the site, creating failed sessions and avoidable support issues.",
      ar: "قد لا يتمكن الزوار من الوصول إلى الموقع، مما يسبب جلسات فاشلة ومشكلات دعم كان يمكن تجنبها.",
    },
    severityReason: {
      en: "This is medium severity because it mainly affects availability and user trust rather than direct data exposure.",
      ar: "تُعد المشكلة متوسطة الخطورة لأنها تؤثر أساسًا على التوفر وثقة المستخدم بدلًا من كشف البيانات مباشرة.",
    },
    recommendation: {
      en: "Normalize HTTP-to-HTTPS and canonical-domain rules so every request reaches one stable final destination.",
      ar: "وحّد قواعد التحويل من HTTP إلى HTTPS والنطاق الأساسي بحيث يصل كل طلب إلى وجهة نهائية مستقرة واحدة.",
    },
    codeExamples: {
      nginx: `server {
  listen 80;
  server_name example.com www.example.com;
  return 301 https://example.com$request_uri;
}`,
      apache: `RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://example.com%{REQUEST_URI} [R=301,L]`,
    },
    difficulty: "medium",
    estimatedFixTime: {
      en: "20 minutes",
      ar: "20 دقيقة",
    },
    riskReduction: "medium",
  },
  "cross-domain-redirect": {
    id: "cross-domain-redirect",
    category: "infrastructure",
    severity: "medium",
    title: {
      en: "Cross-Domain Redirect",
      ar: "تحويل إلى نطاق مختلف",
    },
    explanation: {
      simple: {
        en: "The site sends users from the original domain to another domain.",
        ar: "الموقع ينقل المستخدمين من النطاق الأصلي إلى نطاق آخر.",
      },
      technical: {
        en: "The redirect chain leaves the original host, which expands the trust boundary and may weaken control over the user journey.",
        ar: "سلسلة التحويلات تخرج من المضيف الأصلي، مما يوسع حدود الثقة وقد يضعف التحكم في رحلة المستخدم.",
      },
    },
    businessImpact: {
      en: "Users may be confused or concerned when a trusted site sends them to a different domain.",
      ar: "قد يشعر المستخدمون بالارتباك أو القلق عندما يرسلهم موقع موثوق إلى نطاق مختلف.",
    },
    severityReason: {
      en: "This is medium severity because cross-domain movement can be legitimate, but it increases trust and monitoring requirements.",
      ar: "تُعد المشكلة متوسطة الخطورة لأن التحويل بين النطاقات قد يكون مشروعًا، لكنه يزيد متطلبات الثقة والمراقبة.",
    },
    recommendation: {
      en: "Keep cross-domain redirects limited to approved destinations and document the owner and purpose of each destination.",
      ar: "اجعل التحويلات بين النطاقات مقتصرة على وجهات معتمدة، ووثّق مالك كل وجهة وسبب استخدامها.",
    },
    codeExamples: {
      cloudflare: `(http.request.uri.path eq "/old-path")`,
    },
    difficulty: "medium",
    estimatedFixTime: {
      en: "20 minutes",
      ar: "20 دقيقة",
    },
    riskReduction: "medium",
  },
  "infrastructure-exposed": {
    id: "infrastructure-exposed",
    category: "infrastructure",
    severity: "low",
    title: {
      en: "Infrastructure Metadata Exposed",
      ar: "كشف بيانات البنية التقنية",
    },
    explanation: {
      simple: {
        en: "The site reveals details about servers, frameworks, or hosting technology.",
        ar: "الموقع يكشف تفاصيل عن الخوادم أو الأطر البرمجية أو تقنية الاستضافة.",
      },
      technical: {
        en: "Server, framework, or platform headers expose implementation details that can help attackers prioritize known weaknesses.",
        ar: "رؤوس Server أو Framework أو المنصة تكشف تفاصيل تنفيذية قد تساعد المهاجمين على ترتيب الثغرات المعروفة حسب الأولوية.",
      },
    },
    businessImpact: {
      en: "Exposed stack details can make targeted attacks easier and reduce the perceived maturity of the security posture.",
      ar: "كشف تفاصيل التقنية قد يجعل الهجمات الموجهة أسهل ويقلل الانطباع بنضج الوضع الأمني.",
    },
    severityReason: {
      en: "This is low severity because metadata alone is not a breach, but it improves attacker reconnaissance.",
      ar: "تُعد المشكلة منخفضة الخطورة لأن البيانات الوصفية وحدها ليست اختراقًا، لكنها تحسن استطلاع المهاجمين.",
    },
    recommendation: {
      en: "Remove unnecessary server and framework headers, and keep operational diagnostics internal.",
      ar: "أزل رؤوس Server وFramework غير الضرورية، واجعل معلومات التشخيص التشغيلية داخلية.",
    },
    codeExamples: {
      nginx: `server_tokens off;`,
      apache: `ServerTokens Prod
ServerSignature Off`,
    },
    difficulty: "easy",
    estimatedFixTime: {
      en: "10 minutes",
      ar: "10 دقائق",
    },
    riskReduction: "low",
  },
  "domain-too-new": {
    id: "domain-too-new",
    category: "reputation",
    severity: "medium",
    title: {
      en: "Recently Registered Domain",
      ar: "نطاق مسجل حديثًا",
    },
    explanation: {
      simple: {
        en: "The domain appears new, which can reduce trust until reputation is established.",
        ar: "يبدو أن النطاق حديث، وهذا قد يقلل الثقة حتى تتكون له سمعة واضحة.",
      },
      technical: {
        en: "Newly registered domains are frequently used in short-lived phishing and abuse campaigns before reputation systems classify them.",
        ar: "تُستخدم النطاقات الحديثة كثيرًا في حملات تصيد وإساءة قصيرة العمر قبل أن تصنفها أنظمة السمعة.",
      },
    },
    businessImpact: {
      en: "Customers, partners, and security tools may treat a new domain with extra caution.",
      ar: "قد يتعامل العملاء والشركاء وأدوات الأمان مع النطاق الجديد بحذر إضافي.",
    },
    severityReason: {
      en: "This is medium severity because age is not proof of abuse, but it is a meaningful trust signal.",
      ar: "تُعد المشكلة متوسطة الخطورة لأن حداثة النطاق لا تثبت الإساءة، لكنها مؤشر ثقة مهم.",
    },
    recommendation: {
      en: "Use stronger verification, monitoring, email authentication, and brand-trust controls while the domain builds reputation.",
      ar: "استخدم تحققًا ومراقبة أقوى ومصادقة بريد وضوابط ثقة للعلامة التجارية أثناء بناء سمعة النطاق.",
    },
    codeExamples: {
      cloudflare: `(ip.geoip.asnum in {13335})`,
    },
    difficulty: "medium",
    estimatedFixTime: {
      en: "1 hour",
      ar: "ساعة واحدة",
    },
    riskReduction: "medium",
  },
} satisfies Record<RemediationFindingId, RemediationEntry>;

export function getRemediationById(id: string): RemediationEntry | undefined {
  return remediationMap[id as RemediationFindingId];
}

export function getLocalizedRemediation(
  id: string,
  lang: RemediationLanguage,
): LocalizedRemediationEntry | undefined {
  const remediation = getRemediationById(id);

  if (!remediation) {
    return undefined;
  }

  return {
    id: remediation.id,
    category: remediation.category,
    severity: remediation.severity,
    title: remediation.title[lang],
    explanation: {
      simple: remediation.explanation.simple[lang],
      technical: remediation.explanation.technical[lang],
    },
    businessImpact: remediation.businessImpact[lang],
    severityReason: remediation.severityReason[lang],
    recommendation: remediation.recommendation[lang],
    codeExamples: remediation.codeExamples,
    difficulty: remediation.difficulty,
    estimatedFixTime: remediation.estimatedFixTime[lang],
    riskReduction: remediation.riskReduction,
  };
}
