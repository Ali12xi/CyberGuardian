import { ENGINE_NAME, VERSION } from "@/lib/brand";
import type { ObservableCoverage } from "@/lib/types";

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
  heroVersion: string;
  heroVersionLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadges: string[];
  howItWorksTitle: string;
  howItWorksCards: {
    title: string;
    description: string;
  }[];
  postScanTitle: string;
  postScanButton: string;
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
  scanTokenRequired: string;
  scanTokenExpired: string;
  scanTokenInvalid: string;
  scanTokenUnavailable: string;
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
  /** @deprecated Use `securityVisibility` for the scan visibility metric label. */
  confidence: string;
  securityVisibility: string;
  visibilityHigh: string;
  visibilityPartial: string;
  visibilityLimited: string;
  /** Short labels for the Security Visibility metric card only (full phrases stay in visibility*). */
  visibilityCardHigh: string;
  visibilityCardPartial: string;
  visibilityCardLimited: string;
  score: string;
  scanTimestamp: string;
  defaultExecutiveLine: string;
  trustedExecutiveLine: string;
  suspiciousExecutiveLine: string;
  aiSummary: string;
  executiveBrief: string;
  overviewCard: string;
  attackSurfaceCard: string;
  infrastructureTrustCard: string;
  actionsCard: string;
  scanCompletedIn: string;
  noAttackSurfaceDetected: string;
  noRankedActionsBrief: string;
  exposureHighLabel: string;
  exposureLowLabel: string;
  cdnActiveLabel: string;
  cdnNoneShort: string;
  tlsSummaryLabel: string;
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
  securityActionPlan: string;
  actionPlanUrgent: string;
  actionPlanThisWeek: string;
  actionPlanLater: string;
  actionPlanTotalEffort: string;
  effortBandNone: string;
  effortBandMinimal: string;
  effortBandLight: string;
  effortBandModerate: string;
  effortBandHeavy: string;
  effortBandSevere: string;
  whyThisMattersLabel: string;
  technicalFix: string;
  detectedPlatform: string;
  recommendedForStack: string;
  placeInsideLabel: string;
  fixesRisksLabel: string;
  otherPlatforms: string;
  difficultyLabel: string;
  layerBusinessImpact: string;
  priorityLevelImmediate: string;
  priorityLevelThisWeek: string;
  priorityLevelLater: string;
  copySnippet: string;
  copiedSnippet: string;
  noSnippetForFinding: string;
  totalFindings: string;
  noHighPriorityFindings: string;
  scoreBreakdownTitle: string;
  scoreBreakdownKicker: string;
  scoreBreakdownSubtitle: string;
  scoreBreakdownLegendGood: string;
  scoreBreakdownLegendNeeds: string;
  scoreBreakdownLegendDanger: string;
  scoreBreakdownLegendFootnote: string;
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
  unlikely: string;
  noneDetected: string;
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
  pdfDisclaimerTitle: string;
  pdfHowToFix: string;
  pdfConfidencePartialVisibility: string;
  pdfSnippetLabel: string;
  pdfRiskReduction: string;
  pdfRiskReductionHigh: string;
  pdfRiskReductionMedium: string;
  pdfRiskReductionLow: string;
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
    brand: "CyberGurdian AI",
    heroVersion: VERSION,
    heroVersionLabel: "Smart Protection System",
    heroTitle: "AI-Powered Security Intelligence",
    heroSubtitle:
      "Analyze websites, detect security risks,\nand generate clear security reports.",
    heroBadges: [
      "✓ Real Security Signals",
      "✓ Explainable AI Insights",
      "✓ Professional Security Reports",
    ],
    howItWorksTitle: "How It Works",
    howItWorksCards: [
      {
        title: "Enter the URL",
        description: "Submit a website URL to begin the security analysis.",
      },
      {
        title: "Smart Analysis",
        description:
          "CyberGurdian AI analyzes headers, SSL, and security posture.",
      },
      {
        title: "Security Report",
        description:
          "Receive a clear report with risks and security recommendations.",
      },
    ],
    postScanTitle: "Need another scan?",
    postScanButton: "New Scan",
    urlLabel: "URL",
    urlPlaceholder: "https://github.com",
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
    scanTokenRequired: "Security scan required before analysis",
    scanTokenExpired: "Scan session expired. Please scan again.",
    scanTokenInvalid: "Invalid scan token. Please scan again.",
    scanTokenUnavailable:
      "Scan verification is temporarily unavailable. Please try again later or contact the administrator.",
    reportEmptyTitle: "Security Analysis Results",
    reportEmptySubtitle: "Scan results will appear here after entering a URL.",
    scanningTarget: "Scanning target",
    scanningTargetSubtitle: "Analyzing the URL and preparing the security report.",
    lowThreatDetected: "LOW THREAT DETECTED",
    mediumThreatDetected: "MEDIUM THREAT DETECTED",
    highThreatDetected: "HIGH THREAT DETECTED",
    lowThreat: "LOW THREAT",
    mediumThreat: "MEDIUM THREAT",
    highThreat: "HIGH THREAT",
    grade: "Grade",
    confidence: "Security Visibility",
    securityVisibility: "Security Visibility",
    visibilityHigh: "High Visibility",
    visibilityPartial: "Partial Visibility",
    visibilityLimited: "Limited Visibility",
    visibilityCardHigh: "High",
    visibilityCardPartial: "Partial",
    visibilityCardLimited: "Limited",
    score: "Score",
    scanTimestamp: "Scan timestamp",
    defaultExecutiveLine:
      "Externally visible controls indicate manageable exposure with prioritized remediation needed.",
    trustedExecutiveLine:
      "Trusted Infrastructure with minor browser-side hardening gaps.",
    suspiciousExecutiveLine:
      "Trust-related signals require review before user trust flows are allowed.",
    aiSummary: "AI Security Summary",
    executiveBrief: "Security Assessment",
    overviewCard: "Overview",
    attackSurfaceCard: "Attack surface",
    infrastructureTrustCard: "Infrastructure trust",
    actionsCard: "Recommended actions",
    scanCompletedIn: "Scan completed in",
    noAttackSurfaceDetected: "No significant attack surface detected on this scan surface.",
    noRankedActionsBrief: "No ranked findings here — open the Security Action Plan for prioritized fixes.",
    exposureHighLabel: "Server exposure: elevated",
    exposureLowLabel: "Server exposure: reduced",
    cdnActiveLabel: "CDN / edge",
    cdnNoneShort: "None detected",
    tlsSummaryLabel: "TLS",
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
    securityActionPlan: "Security Action Plan",
    actionPlanUrgent: "🔴 {count} immediate fixes",
    actionPlanThisWeek: "🟡 {count} this week",
    actionPlanLater: "🟢 {count} later",
    actionPlanTotalEffort: "⏱ Approx. total effort: {band}",
    effortBandNone: "~0 min",
    effortBandMinimal: "~10–25 min",
    effortBandLight: "~20–40 min",
    effortBandModerate: "~35–55 min",
    effortBandHeavy: "~30–50 min",
    effortBandSevere: "~60–90 min",
    whyThisMattersLabel: "Why this matters:",
    technicalFix: "Technical fix",
    detectedPlatform: "Detected",
    recommendedForStack: "Recommended for your detected stack",
    placeInsideLabel: "Place inside:",
    fixesRisksLabel: "Fixes:",
    otherPlatforms: "Other platforms",
    difficultyLabel: "Difficulty:",
    layerBusinessImpact: "Business impact",
    priorityLevelImmediate: "Immediate priority",
    priorityLevelThisWeek: "This week",
    priorityLevelLater: "Later",
    copySnippet: "Copy",
    copiedSnippet: "Copied ✓",
    noSnippetForFinding: "No reference snippet is available for this signal. Use your platform docs or the advisory above.",
    totalFindings: "total findings",
    noHighPriorityFindings:
      "No high-priority findings were detected on the externally visible scan surface.",
    scoreBreakdownTitle: "Score breakdown",
    scoreBreakdownKicker: "Independent signals",
    scoreBreakdownSubtitle:
      "Each bar is an independent health signal for that area—not a point-by-point split of the headline score.",
    scoreBreakdownLegendGood: "● 80–100% Good",
    scoreBreakdownLegendNeeds: "● 40–79% Needs improvement",
    scoreBreakdownLegendDanger: "● 0–39% Serious risk",
    scoreBreakdownLegendFootnote:
      "“Serious risk” red is used mainly for TLS, domain trust, and redirect safety. Headers and infrastructure stay amber at minimum when issues are style gaps, not confirmed compromise.",
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
      "No strong framework or Infrastructure fingerprint detected.",
    server: "Server:",
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
    tlsAndRedirects: "TLS & Redirects",
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
    unlikely: "Unlikely",
    noneDetected: "None detected",
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
    pdfIntelligenceEngine: ENGINE_NAME,
    pdfGeneratedBy: `Generated by ${ENGINE_NAME}`,
    pdfDisclaimer:
      "This report reflects externally observable security signals and does not confirm compromise or active intrusion.",
    pdfDisclaimerTitle: "Disclaimer",
    pdfHowToFix: "How to fix",
    pdfConfidencePartialVisibility:
      "Partial scan visibility detected. Interpret the security score alongside security visibility (how much posture was observable externally); limited telemetry may reduce certainty.",
    pdfSnippetLabel: "Reference configuration",
    pdfRiskReduction: "Risk reduction",
    pdfRiskReductionHigh: "High",
    pdfRiskReductionMedium: "Medium",
    pdfRiskReductionLow: "Low",
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
    footerVersion: VERSION,
    footerCopyright: "© 2026 CyberGurdian AI",
  },
  ar: {
    languageName: "العربية",
    languageToggle: "English",
    brand: "CyberGurdian AI",
    heroVersion: VERSION,
    heroVersionLabel: "نظام الحماية الذكي",
    heroTitle: "تحليلات أمنية ذكية",
    heroSubtitle:
      "حلّل المواقع واكتشف المخاطر الأمنية\nبتقارير واضحة وسهلة الفهم.",
    heroBadges: [
      "✓ إشارات أمنية حقيقية",
      "✓ تحليلات واضحة بالذكاء الاصطناعي",
      "✓ تقارير أمنية احترافية",
    ],
    howItWorksTitle: "كيف يعمل النظام؟",
    howItWorksCards: [
      {
        title: "أدخل الرابط",
        description: "أدخل رابط الموقع وابدأ التحليل الأمني فورًا.",
      },
      {
        title: "التحليل الذكي",
        description: "يفحص النظام الهيدرز، SSL، والبنية الأمنية للموقع.",
      },
      {
        title: "التقرير الأمني",
        description: "احصل على تقرير واضح مع المخاطر والتوصيات الأمنية.",
      },
    ],
    postScanTitle: "هل تريد فحص موقع آخر؟",
    postScanButton: "فحص جديد",
    urlLabel: "URL",
    urlPlaceholder: "https://github.com",
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
    scanTokenRequired: "يجب إجراء فحص أمني أولاً",
    scanTokenExpired: "انتهت صلاحية الجلسة. يرجى إعادة الفحص.",
    scanTokenInvalid: "رمز الفحص غير صالح. يرجى إعادة الفحص.",
    scanTokenUnavailable:
      "التحقق من الفحص غير متاح مؤقتًا. يرجى المحاولة لاحقًا أو التواصل مع المسؤول.",
    reportEmptyTitle: "نتائج التحليل الأمني",
    reportEmptySubtitle: "ستظهر نتائج الفحص هنا بعد إدخال الرابط.",
    scanningTarget: "جار فحص الهدف",
    scanningTargetSubtitle: "يتم تحليل URL وتجهيز التقرير الأمني.",
    lowThreatDetected: "تم اكتشاف تهديد منخفض",
    mediumThreatDetected: "تم اكتشاف تهديد متوسط",
    highThreatDetected: "تم اكتشاف تهديد مرتفع",
    lowThreat: "تهديد منخفض",
    mediumThreat: "تهديد متوسط",
    highThreat: "تهديد مرتفع",
    grade: "التصنيف",
    confidence: "مستوى الرؤية الأمنية",
    securityVisibility: "مستوى الرؤية الأمنية",
    visibilityHigh: "رؤية عالية",
    visibilityPartial: "رؤية جزئية",
    visibilityLimited: "رؤية محدودة",
    visibilityCardHigh: "عالية",
    visibilityCardPartial: "جزئية",
    visibilityCardLimited: "محدودة",
    score: "الدرجة",
    scanTimestamp: "وقت الفحص",
    defaultExecutiveLine:
      "تشير الضوابط المرئية خارجيًا إلى تعرض قابل للإدارة مع حاجة إلى معالجة مرتبة بالأولوية.",
    trustedExecutiveLine:
      "بنية Infrastructure موثوقة مع فجوات بسيطة في تقوية المتصفح.",
    suspiciousExecutiveLine:
      "تتطلب إشارات الثقة مراجعة قبل السماح بتدفقات ثقة المستخدمين.",
    aiSummary: "AI Security Summary",
    executiveBrief: "التحليل الأمني",
    overviewCard: "نظرة عامة",
    attackSurfaceCard: "سطح الهجوم",
    infrastructureTrustCard: "ثقة البنية التحتية",
    actionsCard: "إجراءات موصى بها",
    scanCompletedIn: "اكتمل الفحص في",
    noAttackSurfaceDetected: "لم يُرصد سطح هجوم مهم على سطح الفحص هذا.",
    noRankedActionsBrief: "لا توجد نتائج مرتبة هنا — افتح خطة العمل الأمنية للإصلاحات ذات الأولوية.",
    exposureHighLabel: "تعرض الخادم: مرتفع",
    exposureLowLabel: "تعرض الخادم: منخفض",
    cdnActiveLabel: "CDN / الحافة",
    cdnNoneShort: "لا يوجد",
    tlsSummaryLabel: "TLS",
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
    securityActionPlan: "خطة العمل الأمنية",
    actionPlanUrgent: "🔴 {count} إصلاح فوري",
    actionPlanThisWeek: "🟡 {count} هذا الأسبوع",
    actionPlanLater: "🟢 {count} لاحقاً",
    actionPlanTotalEffort: "⏱ الجهد الإجمالي التقريبي: {band}",
    effortBandNone: "~0 دقيقة",
    effortBandMinimal: "~10–25 دقيقة",
    effortBandLight: "~20–40 دقيقة",
    effortBandModerate: "~35–55 دقيقة",
    effortBandHeavy: "~30–50 دقيقة",
    effortBandSevere: "~60–90 دقيقة",
    whyThisMattersLabel: "لماذا يهم الأمر:",
    technicalFix: "الإصلاح التقني",
    detectedPlatform: "مكتشف",
    recommendedForStack: "موصى به لبيئتك",
    placeInsideLabel: "ضعه داخل:",
    fixesRisksLabel: "يصلح:",
    otherPlatforms: "منصات أخرى",
    difficultyLabel: "الصعوبة:",
    layerBusinessImpact: "الأثر على الأعمال",
    priorityLevelImmediate: "أولوية فورية",
    priorityLevelThisWeek: "هذا الأسبوع",
    priorityLevelLater: "لاحقاً",
    copySnippet: "نسخ",
    copiedSnippet: "تم النسخ ✓",
    noSnippetForFinding: "لا يوجد مقتطف مرجعي لهذه الإشارة. راجع وثائق منصتك أو النص الإرشادي أعلاه.",
    totalFindings: "إجمالي النتائج",
    noHighPriorityFindings:
      "لم يتم اكتشاف نتائج عالية الأولوية ضمن سطح الفحص المرئي.",
    scoreBreakdownTitle: "تحليل تفصيلي للدرجة",
    scoreBreakdownKicker: "إشارات مستقلة",
    scoreBreakdownSubtitle:
      "كل شريط مؤشر صحة مستقل لهذا المجال—وليس تقسيماً رقمياً للدرجة الرئيسية.",
    scoreBreakdownLegendGood: "● 80–100% جيد",
    scoreBreakdownLegendNeeds: "● 40–79% يحتاج تحسين",
    scoreBreakdownLegendDanger: "● 0–39% خطر جسيم",
    scoreBreakdownLegendFootnote:
      "يُستخدم اللون الأحمر للخطر الجسيم بشكل رئيسي في TLS وثقة النطاق وسلامة إعادة التوجيه. رؤوس الأمان والبنية التحتية تبقى كحد أدنى باللون الكهرماني عند الفجوات دون افتراض اختراق مؤكد.",
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
    noFingerprint: "لم يتم رصد بصمة إطار عمل أو Infrastructure قوية.",
    server: "الخادم:",
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
    tlsAndRedirects: "TLS وإعادة التوجيه",
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
    unlikely: "غير مرجح",
    noneDetected: "لا يوجد",
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
    pdfIntelligenceEngine: ENGINE_NAME,
    pdfGeneratedBy: `تم الإنشاء بواسطة ${ENGINE_NAME}`,
    pdfDisclaimer:
      "يعكس هذا التقرير إشارات أمنية مرئية خارجيًا ولا يؤكد وجود اختراق أو تسلل نشط.",
    pdfDisclaimerTitle: "إخلاء مسؤولية",
    pdfHowToFix: "طريقة الإصلاح",
    pdfConfidencePartialVisibility:
      "تم رصد رؤية جزئية للفحص. فسّر درجة الأمان مع مستوى الرؤية الأمنية (مدى قابلية رصد الوضع الأمني خارجيًا)؛ قد يقل اليقين عند محدودية البيانات المرصودة.",
    pdfSnippetLabel: "مرجع تهيئة",
    pdfRiskReduction: "تقليل الخطر",
    pdfRiskReductionHigh: "مرتفع",
    pdfRiskReductionMedium: "متوسط",
    pdfRiskReductionLow: "منخفض",
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
    footerVersion: VERSION,
    footerCopyright: "© 2026 CyberGurdian AI",
  },
};

export function formatSecurityVisibilityOverall(
  overall: ObservableCoverage["overall"],
  t: Translations,
): string {
  if (overall === "full") {
    return t.visibilityHigh;
  }
  if (overall === "partial") {
    return t.visibilityPartial;
  }
  return t.visibilityLimited;
}

export function getDirection(language: Language): Direction {
  return language === "ar" ? "rtl" : "ltr";
}
