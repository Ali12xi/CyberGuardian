export const languages = ["en", "ar"] as const;

export type Language = (typeof languages)[number];
export type Direction = "ltr" | "rtl";

type StageTranslations = {
  dns: string;
  tls: string;
  redirects: string;
  headers: string;
  threat: string;
  aiDone: string;
  aiProgress: string;
};

export type Translations = {
  languageName: string;
  languageToggle: string;
  brand: string;
  heroTitle: string;
  heroSubtitle: string;
  urlLabel: string;
  urlPlaceholder: string;
  analyze: string;
  scanning: string;
  emptyUrl: string;
  networkError: string;
  exportFailed: string;
  invalidJson: string;
  analyzeGenericError: string;
  analyzeMethodNotAllowed: string;
  unsafeUrl: string;
  explainInvalidRequest: string;
  explainMethodNotAllowed: string;
  reportEmptyTitle: string;
  reportEmptySubtitle: string;
  scanningTarget: string;
  scanningTargetSubtitle: string;
  lowThreatDetected: string;
  mediumThreatDetected: string;
  highThreatDetected: string;
  lowThreat: string;
  mediumThreat: string;
  highThreat: string;
  grade: string;
  confidence: string;
  score: string;
  scanTimestamp: string;
  defaultExecutiveLine: string;
  trustedExecutiveLine: string;
  suspiciousExecutiveLine: string;
  aiSummary: string;
  executiveBrief: string;
  aiDescription: string;
  risk: string;
  highInfrastructureTrust: string;
  moderateInfrastructureTrust: string;
  lowInfrastructureTrust: string;
  aiStages: string[];
  executiveRiskOverview: string;
  attackSurfaceAnalysis: string;
  infrastructureTrustAssessment: string;
  recommendedSecurityActions: string;
  criticalFindings: string;
  priorityRemediationQueue: string;
  totalFindings: string;
  noHighPriorityFindings: string;
  domainIntelligence: string;
  reputationSignals: string;
  domain: string;
  reputation: string;
  suspiciousTld: string;
  punycodeIdn: string;
  typosquatting: string;
  urlEntropy: string;
  phishingKeywords: string;
  infrastructure: string;
  technologyFingerprint: string;
  noFingerprint: string;
  server: string;
  notDisclosed: string;
  liveScanTimeline: string;
  deterministicPipeline: string;
  runtime: string;
  stages: StageTranslations;
  tlsAndRedirects: string;
  valid: string;
  selfSigned: string;
  issuer: string;
  daysLeft: string;
  tlsVersion: string;
  cipher: string;
  weakCrypto: string;
  suspiciousRedirects: string;
  securityHeaders: string;
  present: string;
  missing: string;
  yes: string;
  no: string;
  likely: string;
  unknown: string;
  exportReport: string;
  exportingReport: string;
  reportExportedSuccessfully: string;
  pdfCoverTitle: string;
  pdfExecutiveSummary: string;
  pdfCriticalFindings: string;
  pdfThreatIntelligence: string;
  pdfTlsInfrastructure: string;
  pdfSecurityHeaders: string;
  pdfScanMetadata: string;
  pdfFinalUrl: string;
  pdfSecurityScore: string;
  pdfScanId: string;
  pdfRedirectChainSummary: string;
  pdfTechnicalIssue: string;
  pdfImpact: string;
  pdfRecommendation: string;
  pdfSecurityAnalytics: string;
  pdfExecutiveRecommendations: string;
  pdfWhyItMatters: string;
  pdfEstimatedImpact: string;
  pdfFixComplexity: string;
  pdfEstimatedFixTime: string;
  pdfExploitLikelihood: string;
  pdfAttackSurfaceAffected: string;
  pdfAffectedStandards: string;
  pdfScannerEngine: string;
  pdfIntelligenceEngine: string;
  pdfGeneratedBy: string;
  pdfDisclaimer: string;
  reportVersion: string;
  engineVersion: string;
  pdfThreatClassification: string;
  pdfInfrastructureTrust: string;
  pdfHeaderCoverage: string;
  pdfRiskDistribution: string;
  pdfAttackSurface: string;
  pdfInfrastructureExposure: string;
  easy: string;
  moderate: string;
  advanced: string;
  fiveMinutes: string;
  thirtyMinutes: string;
  twoHours: string;
  oneDay: string;
  browserSecurity: string;
  transportSecurity: string;
  domainTrust: string;
  redirectsSurface: string;
  metadataExposure: string;
  footerEngineeredBy: string;
  footerVersion: string;
  footerCopyright: string;
};

export const translations: Record<Language, Translations> = {
  en: {
    languageName: "English",
    languageToggle: "العربية",
    brand: "CyberGuardian AI",
    heroTitle: "AI-Powered Security Analysis",
    heroSubtitle:
      "Enterprise-grade URL intelligence with deterministic scanning, threat context, and executive-ready reporting.",
    urlLabel: "URL",
    urlPlaceholder: "https://example.com",
    analyze: "Analyze",
    scanning: "Scanning",
    emptyUrl: "Please enter a URL before scanning.",
    networkError:
      "The scan could not be completed right now. The target may be unavailable or blocking automated analysis.",
    exportFailed:
      "The report could not be exported right now. Please retry after the scan stabilizes.",
    invalidJson: "Please send a valid JSON body.",
    analyzeGenericError:
      "We could not analyze this URL safely. Please try again later.",
    analyzeMethodNotAllowed: "Only POST requests are allowed for analysis.",
    unsafeUrl: "This URL cannot be scanned safely.",
    explainInvalidRequest:
      "A valid scan result is required before generating an AI explanation.",
    explainMethodNotAllowed: "Only POST requests are allowed for AI explanations.",
    reportEmptyTitle: "Security intelligence report",
    reportEmptySubtitle: "Scan results will appear here after you enter a URL.",
    scanningTarget: "Scanning target",
    scanningTargetSubtitle: "Analyzing the URL and preparing the security report.",
    lowThreatDetected: "LOW THREAT DETECTED",
    mediumThreatDetected: "MEDIUM THREAT DETECTED",
    highThreatDetected: "HIGH THREAT DETECTED",
    lowThreat: "LOW THREAT",
    mediumThreat: "MEDIUM THREAT",
    highThreat: "HIGH THREAT",
    grade: "Grade",
    confidence: "Confidence",
    score: "Score",
    scanTimestamp: "Scan timestamp",
    defaultExecutiveLine:
      "Externally visible controls indicate manageable exposure with prioritized remediation needed.",
    trustedExecutiveLine:
      "Trusted Infrastructure with minor browser-side hardening gaps.",
    suspiciousExecutiveLine:
      "Observable trust signals require review before user trust flows are allowed.",
    aiSummary: "AI Security Summary",
    executiveBrief: "Executive intelligence brief",
    aiDescription:
      "Correlated interpretation of scan evidence, Infrastructure trust, and attacker-relevant exposure.",
    risk: "Risk",
    highInfrastructureTrust: "High Infrastructure trust",
    moderateInfrastructureTrust: "Moderate Infrastructure trust",
    lowInfrastructureTrust: "Low Infrastructure trust",
    aiStages: [
      "Correlating browser-side exposure",
      "Scoring Infrastructure trust",
      "Building executive recommendations",
    ],
    executiveRiskOverview: "Executive Risk Overview",
    attackSurfaceAnalysis: "Attack Surface Analysis",
    infrastructureTrustAssessment: "Infrastructure Trust Assessment",
    recommendedSecurityActions: "Recommended Security Actions",
    criticalFindings: "Critical Findings",
    priorityRemediationQueue: "Priority remediation queue",
    totalFindings: "total findings",
    noHighPriorityFindings:
      "No high-priority findings were detected in the observable scan surface.",
    domainIntelligence: "Domain Intelligence",
    reputationSignals: "Reputation and deception signals",
    domain: "Domain",
    reputation: "Reputation",
    suspiciousTld: "Suspicious TLD",
    punycodeIdn: "Punycode / IDN",
    typosquatting: "Typosquatting",
    urlEntropy: "URL entropy",
    phishingKeywords: "Phishing keywords",
    infrastructure: "Infrastructure",
    technologyFingerprint: "Technology fingerprint",
    noFingerprint:
      "No high-confidence framework or Infrastructure fingerprint detected.",
    server: "Server",
    notDisclosed: "Not disclosed",
    liveScanTimeline: "Live Scan Timeline",
    deterministicPipeline: "Deterministic analysis pipeline",
    runtime: "runtime",
    stages: {
      dns: "DNS resolved",
      tls: "TLS inspected",
      redirects: "Redirects analyzed",
      headers: "Security Headers evaluated",
      threat: "Threat Intelligence generated",
      aiDone: "AI interpretation completed",
      aiProgress: "AI interpretation in progress",
    },
    tlsAndRedirects: "TLS and Redirects",
    valid: "Valid",
    selfSigned: "Self-signed",
    issuer: "Issuer",
    daysLeft: "Days left",
    tlsVersion: "TLS version",
    cipher: "Cipher",
    weakCrypto: "Weak crypto",
    suspiciousRedirects: "Suspicious Redirects",
    securityHeaders: "Security Headers",
    present: "Present",
    missing: "Missing",
    yes: "Yes",
    no: "No",
    likely: "Likely",
    unknown: "Unknown",
    exportReport: "Export Report",
    exportingReport: "Exporting report",
    reportExportedSuccessfully: "Report exported successfully",
    pdfCoverTitle: "Cybersecurity Intelligence Report",
    pdfExecutiveSummary: "Cover / Executive Summary",
    pdfCriticalFindings: "Critical Findings",
    pdfThreatIntelligence: "Threat Intelligence",
    pdfTlsInfrastructure: "TLS & Infrastructure",
    pdfSecurityHeaders: "Security Headers",
    pdfScanMetadata: "Scan Metadata",
    pdfFinalUrl: "Final URL",
    pdfSecurityScore: "Security score",
    pdfScanId: "Scan ID",
    pdfRedirectChainSummary: "Redirect chain summary",
    pdfTechnicalIssue: "Technical issue",
    pdfImpact: "Impact",
    pdfRecommendation: "Recommendation",
    pdfSecurityAnalytics: "Security Intelligence Analytics",
    pdfExecutiveRecommendations: "Executive Recommendations",
    pdfWhyItMatters: "Why it matters",
    pdfEstimatedImpact: "Estimated impact",
    pdfFixComplexity: "Fix complexity",
    pdfEstimatedFixTime: "Estimated remediation time",
    pdfExploitLikelihood: "Exploit likelihood",
    pdfAttackSurfaceAffected: "Attack surface affected",
    pdfAffectedStandards: "Affected standards",
    pdfScannerEngine: "Scanner Engine",
    pdfIntelligenceEngine: "Intelligence Engine",
    pdfGeneratedBy: "Generated by CyberGuardian AI Intelligence Engine",
    pdfDisclaimer:
      "This report reflects externally observable security signals and does not confirm compromise or active intrusion.",
    reportVersion: "Report version",
    engineVersion: "Engine version",
    pdfThreatClassification: "Threat classification",
    pdfInfrastructureTrust: "Infrastructure trust assessment",
    pdfHeaderCoverage: "Header coverage",
    pdfRiskDistribution: "Risk distribution",
    pdfAttackSurface: "Attack surface",
    pdfInfrastructureExposure: "Infrastructure exposure",
    easy: "Easy",
    moderate: "Moderate",
    advanced: "Advanced",
    fiveMinutes: "5 minutes",
    thirtyMinutes: "30 minutes",
    twoHours: "2 hours",
    oneDay: "1 day",
    browserSecurity: "Browser security",
    transportSecurity: "Transport security",
    domainTrust: "Domain trust",
    redirectsSurface: "Redirects",
    metadataExposure: "Metadata exposure",
    footerEngineeredBy: "Engineered by Ali",
    footerVersion: "CyberGuardian AI V1",
    footerCopyright: "© 2026 CyberGuardian AI",
  },
  ar: {
    languageName: "العربية",
    languageToggle: "English",
    brand: "CyberGuardian AI",
    heroTitle: "تحليل أمني ذكي للمواقع",
    heroSubtitle:
      "منصة استخبارات URL مؤسسية تجمع الفحص الحتمي وسياق التهديدات وتقارير تنفيذية واضحة.",
    urlLabel: "URL",
    urlPlaceholder: "https://example.com",
    analyze: "تحليل",
    scanning: "جار الفحص",
    emptyUrl: "يرجى إدخال URL قبل بدء الفحص.",
    networkError:
      "تعذر إكمال الفحص الآن. قد يكون الهدف غير متاح أو يمنع التحليل الآلي.",
    exportFailed:
      "تعذر تصدير التقرير الآن. يرجى المحاولة بعد استقرار نتيجة الفحص.",
    invalidJson: "يرجى إرسال محتوى JSON صحيح.",
    analyzeGenericError: "تعذر فحص هذا URL بأمان. يرجى المحاولة لاحقًا.",
    analyzeMethodNotAllowed: "يُسمح فقط بطلبات POST للفحص.",
    unsafeUrl: "لا يمكن فحص هذا URL بأمان.",
    explainInvalidRequest: "يلزم وجود نتيجة فحص صحيحة قبل إنشاء شرح AI.",
    explainMethodNotAllowed: "يُسمح فقط بطلبات POST لشروحات AI.",
    reportEmptyTitle: "تقرير استخبارات أمني",
    reportEmptySubtitle: "ستظهر نتائج الفحص هنا بعد إدخال URL.",
    scanningTarget: "جار فحص الهدف",
    scanningTargetSubtitle: "يتم تحليل URL وتجهيز التقرير الأمني.",
    lowThreatDetected: "تم اكتشاف تهديد منخفض",
    mediumThreatDetected: "تم اكتشاف تهديد متوسط",
    highThreatDetected: "تم اكتشاف تهديد مرتفع",
    lowThreat: "تهديد منخفض",
    mediumThreat: "تهديد متوسط",
    highThreat: "تهديد مرتفع",
    grade: "التصنيف",
    confidence: "الثقة",
    score: "الدرجة",
    scanTimestamp: "وقت الفحص",
    defaultExecutiveLine:
      "تشير الضوابط المرئية خارجيًا إلى تعرض قابل للإدارة مع حاجة إلى معالجة مرتبة بالأولوية.",
    trustedExecutiveLine:
      "بنية Infrastructure موثوقة مع فجوات بسيطة في تقوية المتصفح.",
    suspiciousExecutiveLine:
      "تتطلب إشارات الثقة المرصودة مراجعة قبل السماح بتدفقات ثقة المستخدمين.",
    aiSummary: "AI Security Summary",
    executiveBrief: "موجز استخباراتي تنفيذي",
    aiDescription:
      "تفسير مترابط لأدلة الفحص وثقة Infrastructure والتعرض الأمني من منظور المهاجم.",
    risk: "المخاطر",
    highInfrastructureTrust: "ثقة عالية في Infrastructure",
    moderateInfrastructureTrust: "ثقة متوسطة في Infrastructure",
    lowInfrastructureTrust: "ثقة منخفضة في Infrastructure",
    aiStages: [
      "ربط التعرض من جهة المتصفح",
      "تقييم ثقة Infrastructure",
      "بناء توصيات تنفيذية",
    ],
    executiveRiskOverview: "نظرة تنفيذية على المخاطر",
    attackSurfaceAnalysis: "تحليل سطح الهجوم",
    infrastructureTrustAssessment: "تقييم ثقة Infrastructure",
    recommendedSecurityActions: "إجراءات الأمان الموصى بها",
    criticalFindings: "النتائج الحرجة",
    priorityRemediationQueue: "قائمة المعالجة ذات الأولوية",
    totalFindings: "إجمالي النتائج",
    noHighPriorityFindings:
      "لم يتم اكتشاف نتائج عالية الأولوية ضمن سطح الفحص المرئي.",
    domainIntelligence: "Domain Intelligence",
    reputationSignals: "إشارات السمعة والخداع",
    domain: "Domain",
    reputation: "السمعة",
    suspiciousTld: "TLD مشبوه",
    punycodeIdn: "Punycode / IDN",
    typosquatting: "Typosquatting",
    urlEntropy: "عشوائية URL",
    phishingKeywords: "كلمات Phishing",
    infrastructure: "Infrastructure",
    technologyFingerprint: "بصمة التقنية",
    noFingerprint: "لم يتم رصد بصمة Framework أو Infrastructure عالية الثقة.",
    server: "Server",
    notDisclosed: "غير معلن",
    liveScanTimeline: "مسار الفحص المباشر",
    deterministicPipeline: "مسار تحليل حتمي",
    runtime: "مدة التشغيل",
    stages: {
      dns: "تم تحليل DNS",
      tls: "تم تحليل TLS",
      redirects: "تم تحليل Redirects",
      headers: "تم تحليل Security Headers",
      threat: "تم إنشاء Threat Intelligence",
      aiDone: "اكتمل تفسير AI",
      aiProgress: "تفسير AI قيد التنفيذ",
    },
    tlsAndRedirects: "TLS و Redirects",
    valid: "صالح",
    selfSigned: "موقع ذاتيًا",
    issuer: "الجهة المصدرة",
    daysLeft: "الأيام المتبقية",
    tlsVersion: "إصدار TLS",
    cipher: "Cipher",
    weakCrypto: "تشفير ضعيف",
    suspiciousRedirects: "Redirects مشبوهة",
    securityHeaders: "Security Headers",
    present: "موجود",
    missing: "مفقود",
    yes: "نعم",
    no: "لا",
    likely: "مرجح",
    unknown: "غير معروف",
    exportReport: "تصدير التقرير",
    exportingReport: "جار تصدير التقرير",
    reportExportedSuccessfully: "تم تصدير التقرير بنجاح",
    pdfCoverTitle: "تقرير استخبارات أمنية",
    pdfExecutiveSummary: "الغلاف / الملخص التنفيذي",
    pdfCriticalFindings: "النتائج الحرجة",
    pdfThreatIntelligence: "Threat Intelligence",
    pdfTlsInfrastructure: "TLS وInfrastructure",
    pdfSecurityHeaders: "Security Headers",
    pdfScanMetadata: "بيانات الفحص",
    pdfFinalUrl: "Final URL",
    pdfSecurityScore: "درجة الأمان",
    pdfScanId: "Scan ID",
    pdfRedirectChainSummary: "ملخص Redirects",
    pdfTechnicalIssue: "المشكلة التقنية",
    pdfImpact: "الأثر",
    pdfRecommendation: "التوصية",
    pdfSecurityAnalytics: "تحليلات Security Intelligence",
    pdfExecutiveRecommendations: "التوصيات التنفيذية",
    pdfWhyItMatters: "سبب الأهمية",
    pdfEstimatedImpact: "الأثر المتوقع",
    pdfFixComplexity: "تعقيد المعالجة",
    pdfEstimatedFixTime: "وقت المعالجة المتوقع",
    pdfExploitLikelihood: "احتمالية الاستغلال",
    pdfAttackSurfaceAffected: "سطح الهجوم المتأثر",
    pdfAffectedStandards: "المعايير المتأثرة",
    pdfScannerEngine: "Scanner Engine",
    pdfIntelligenceEngine: "Intelligence Engine",
    pdfGeneratedBy: "تم إنشاؤه بواسطة CyberGuardian AI Intelligence Engine",
    pdfDisclaimer:
      "يعكس هذا التقرير إشارات أمنية مرئية خارجيًا ولا يؤكد وجود اختراق أو تسلل نشط.",
    reportVersion: "إصدار التقرير",
    engineVersion: "إصدار المحرك",
    pdfThreatClassification: "تصنيف التهديد",
    pdfInfrastructureTrust: "تقييم الثقة في Infrastructure",
    pdfHeaderCoverage: "تغطية Headers",
    pdfRiskDistribution: "توزيع المخاطر",
    pdfAttackSurface: "سطح الهجوم",
    pdfInfrastructureExposure: "تعرض Infrastructure الأمني",
    easy: "سهل",
    moderate: "متوسط",
    advanced: "متقدم",
    fiveMinutes: "5 دقائق",
    thirtyMinutes: "30 دقيقة",
    twoHours: "ساعتان",
    oneDay: "يوم واحد",
    browserSecurity: "أمان المتصفح",
    transportSecurity: "أمان النقل",
    domainTrust: "ثقة Domain",
    redirectsSurface: "Redirects",
    metadataExposure: "تعرض البيانات الوصفية",
    footerEngineeredBy: "تمت هندسته بواسطة علي",
    footerVersion: "CyberGuardian AI V1",
    footerCopyright: "© 2026 CyberGuardian AI",
  },
};

export function getDirection(language: Language): Direction {
  return language === "ar" ? "rtl" : "ltr";
}
