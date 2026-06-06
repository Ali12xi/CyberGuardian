export const EMAIL_SECTION_COPY = {
  kicker: {
    en: "📧 Email Identity",
    ar: "📧 موثوقية البريد الإلكتروني",
  },
  title: {
    en: "Email Trust Posture",
    ar: "وضع موثوقية البريد",
  },
  subtitle: {
    en:
      "What we can observe about your domain's email authentication " +
      "publication — not whether individual messages are authentic.",
    ar:
      "ما يمكننا ملاحظته حول نشر مصادقة البريد الإلكتروني لنطاقك — " +
      "وليس ما إذا كانت الرسائل الفردية موثوقة.",
  },
} as const;

export const SPF_COPY = {
  protocolName: {
    en: "Sender Policy Framework (SPF)",
    ar: "بروتوكول SPF (سياسة المرسل)",
  },
  observed: {
    en:
      "Your domain publishes SPF records that restrict which mail " +
      "servers can send email on its behalf.",
    ar:
      "نطاقك ينشر سجلات SPF تحدد خوادم البريد المسموح لها بإرسال " +
      "البريد نيابةً عنه.",
  },
  absent: {
    en:
      "No SPF record published. Receivers cannot verify which servers " +
      "are authorized to send mail from this domain.",
    ar:
      "لا يوجد سجل SPF منشور. لا يستطيع المستقبلون التحقق من الخوادم " +
      "المخوّلة بإرسال البريد من هذا النطاق.",
  },
} as const;

export const DKIM_COPY = {
  protocolName: {
    en: "DomainKeys Identified Mail (DKIM)",
    ar: "بروتوكول DKIM (مفاتيح النطاق المعرّفة)",
  },
  observed: {
    en:
      "DKIM selectors observed for this domain. Public keys are " +
      "published, allowing receivers to verify signatures on email.",
    ar:
      "تكوين DKIM مكتشف لهذا النطاق. تم نشر مفاتيح عامة تسمح للمستقبلين " +
      "بالتحقق من التوقيعات على البريد.",
  },
  notFound: {
    en:
      "No DKIM selectors observed among common patterns. Domain may " +
      "use uncommon selector names or no DKIM signing.",
    ar:
      "لم تُرصد محددات DKIM ضمن الأنماط الشائعة. قد يستخدم النطاق " +
      "أسماء محددات غير شائعة أو لا يستخدم توقيع DKIM.",
  },
  limitationFootnote: {
    en:
      "Signature validation requires an actual email sample; " +
      "we observe configuration only.",
    ar: "التحقق من التوقيع يتطلب عينة بريد فعلية؛ نحن نلاحظ التكوين فقط.",
  },
} as const;

export const DMARC_COPY = {
  protocolName: {
    en: "Domain-based Message Authentication (DMARC)",
    ar: "بروتوكول DMARC (مصادقة الرسائل المعتمدة على النطاق)",
  },
  observed: {
    en:
      "Your domain DMARC policy instructs receivers on how to handle " +
      "unauthenticated mail claiming to be from your domain.",
    ar:
      "سياسة DMARC لنطاقك تُرشد المستقبلين حول كيفية التعامل مع " +
      "البريد غير المصادق عليه الذي يدّعي أنه من نطاقك.",
  },
  absent: {
    en:
      "No DMARC policy published. Receivers have no instruction for " +
      "handling unauthenticated mail from this domain.",
    ar:
      "لا توجد سياسة DMARC منشورة. ليس لدى المستقبلين توجيه للتعامل " +
      "مع البريد غير المصادق عليه من هذا النطاق.",
  },
} as const;

export const DNSSEC_COPY = {
  protocolName: {
    en: "DNS Security Extensions (DNSSEC)",
    ar: "امتدادات أمان DNS (DNSSEC)",
  },
  observed: {
    en:
      "DNSSEC records observed at the resolver. DNS responses for " +
      "your domain can be cryptographically verified.",
    ar:
      "تم رصد سجلات DNSSEC عند المحلل. يمكن التحقق من استجابات DNS " +
      "لنطاقك بشكل مشفّر.",
  },
  absent: {
    en:
      "DNSSEC not observed for this domain. DNS responses are not " +
      "cryptographically signed.",
    ar:
      "لم يُرصد DNSSEC لهذا النطاق. استجابات DNS غير موقّعة بشكل مشفّر.",
  },
} as const;

export const SECURITY_TXT_COPY = {
  protocolName: {
    en: "Security Disclosure (security.txt)",
    ar: "ملف security.txt (الإفصاح الأمني)",
  },
  observed: {
    en:
      "Your domain publishes a security disclosure file for " +
      "researchers to report vulnerabilities.",
    ar: "نطاقك ينشر ملف إفصاح أمني يتيح للباحثين الإبلاغ عن الثغرات.",
  },
  absent: {
    en:
      "No security disclosure file observed. No standardized channel " +
      "advertised for vulnerability reports.",
    ar:
      "لم يُرصد ملف إفصاح أمني. لا توجد قناة قياسية معلنة لتقارير " +
      "الثغرات.",
  },
} as const;
