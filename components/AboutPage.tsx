"use client";

import PublicShell from "@/components/PublicShell";
import { useLanguage } from "@/components/LanguageProvider";
import { VERSION } from "@/lib/brand";

const CONTENT = {
  en: {
    eyebrow: "About CyberGurdian AI",
    title: "Cybersecurity intelligence that people can actually understand.",
    subtitle:
      `CyberGurdian AI ${VERSION} turns externally observable website security signals into deterministic, explainable, and human-readable intelligence for developers, researchers, founders, and decision makers.`,
    missionTitle: "How the System Works",
    mission:
      "CyberGurdian operates as a structured intelligence layer, not a simple lookup tool. When an entity is submitted for assessment, the system initiates a multi-stage pipeline: signals are collected across technical, behavioral, and reputational dimensions, normalized against a consistent baseline, and fed into a scoring engine that produces a traceable, defensible result. Signals may include TLS posture, browser security headers, redirect behavior, infrastructure fingerprints, reputation indicators, and externally observable attack surface data. Every output is reproducible — the same inputs produce the same score.",
    philosophyTitle: "How Trust is Analyzed",
    philosophy:
      "Trust is not binary. CyberGurdian evaluates it across four dimensions: technical exposure (what the entity's infrastructure reveals), behavioral posture (how the entity responds to known threat patterns), third-party signals (what external intelligence sources report), and cross-signal consistency (whether findings across dimensions align or contradict each other). Each dimension is weighted independently before being combined — so a strong score in one area cannot mask a critical failure in another.",
    doesTitle: "How the Score is Built",
    does: [
      "The CyberGurdian score is a composite index, not an average.",
      "It is constructed in layers: raw signals are first validated for reliability, then normalized to a 0–100 scale per category, then weighted according to the entity's industry and exposure profile.",
      "The final score reflects severity-adjusted risk — a single critical vulnerability carries more weight than ten low-severity observations.",
      "Scores are versioned, meaning each assessment captures a point-in-time state that can be compared against future evaluations.",
    ],
    capabilitiesTitle: "How Signals are Correlated",
    capabilities: [
      "Isolated signals are rarely meaningful.",
      "CyberGurdian's correlation engine looks for patterns across signal clusters — a misconfigured endpoint combined with a weak certificate chain and reputation anomalies tells a different story than any of those findings alone.",
      "The system maps relationships between signals to identify compounding risk: where two moderate findings reinforce each other, the combined risk is escalated, not averaged.",
    ],
    differentTitle: "Why This Platform is Different",
    different:
      "Most external security scoring systems stop at a score. CyberGurdian treats the score as the beginning of the explanation, not the end. The platform produces a structured narrative — what the score means, what drove it, and what the most actionable next steps are. It is designed for security teams and analysts who need to defend a decision, not just report a metric. Every report is audit-ready, exportable, and written to be understood by a non-technical stakeholder.",
    trustTitle: "Philosophy",
    trust:
      "CyberGurdian was built on one principle: security decisions should be grounded in evidence, not instinct. The platform does not reward surface-level compliance or penalize entities for factors outside their control. It rewards transparency, consistency, and genuine risk management. We believe that trust, when measured rigorously, becomes a competitive advantage — and that the organizations who understand their own risk posture are the ones best equipped to protect their partners.",
    futureTitle: "Vision",
    future:
      "The next phase of CyberGurdian is designed toward continuous trust monitoring — where entity posture is tracked over time, drift is detected automatically, and security teams are alerted before risk materializes. We are building toward a future where external attack surface risk is managed with the same rigor as financial risk: with live data, defined thresholds, and board-level visibility.",
  },
  ar: {
    eyebrow: "عن CyberGurdian AI",
    title: "استخبارات أمنية يمكن فهمها فعليًا.",
    subtitle:
      `يحوّل CyberGurdian AI ${VERSION} الإشارات الأمنية المرئية خارجيًا للمواقع إلى استخبارات حتمية وقابلة للتفسير ومفهومة للمطورين والباحثين والمؤسسين وصنّاع القرار.`,
    missionTitle: "كيف يعمل النظام",
    mission:
      "يعمل CyberGurdian كطبقة استخباراتية منظّمة، لا كأداة بحث بسيطة. عند إرسال أي جهة للتقييم، يبدأ النظام سلسلة معالجة متعددة المراحل: تُجمَع الإشارات عبر أبعاد تقنية وسلوكية ومرتبطة بالسمعة، وتُعيَّر وفق خط أساس موحّد، ثم تُغذَّى في محرك تسجيل ينتج نتيجة قابلة للتتبع والدفاع عنها. قد تشمل هذه الإشارات: حالة TLS، ورؤوس أمان المتصفح، وسلوك إعادة التوجيه، وبصمات البنية التحتية، ومؤشرات السمعة، وبيانات سطح الهجوم الخارجي القابلة للرصد. كل مخرجات النظام قابلة للإعادة — المدخلات ذاتها تنتج الدرجة ذاتها دائماً.",
    philosophyTitle: "كيف يتم تحليل الثقة",
    philosophy:
      "الثقة ليست ثنائية. يقيّمها CyberGurdian عبر أربعة أبعاد: الكشف التقني (ما تكشفه البنية التحتية للجهة)، والوضعية السلوكية (كيف تستجيب الجهة لأنماط التهديد المعروفة)، والإشارات الخارجية (ما تُفيد به مصادر الاستخبارات الخارجية)، والاتساق عبر الإشارات (ما إذا كانت النتائج عبر الأبعاد المختلفة تتوافق أو تتعارض). يُوزَن كل بُعد بشكل مستقل قبل الدمج — بحيث لا يمكن لدرجة قوية في مجال واحد أن تُخفي إخفاقاً حرجاً في مجال آخر.",
    doesTitle: "كيف تُبنى الدرجة",
    does: [
      "درجة CyberGurdian مؤشر مركّب، لا متوسط حسابي.",
      "تُبنى في طبقات: تُتحقق الإشارات الخام أولاً من موثوقيتها، ثم تُعيَّر على مقياس من 0 إلى 100 لكل فئة، ثم تُرجَّح وفق قطاع الجهة وملف تعرّضها.",
      "تعكس الدرجة النهائية المخاطر المعدّلة بالخطورة — ثغرة واحدة حرجة تحمل وزناً أكبر من عشر ملاحظات منخفضة الخطورة.",
      "لكل درجة إصدار خاص بها، بمعنى أن كل تقييم يلتقط حالة في لحظة زمنية محددة يمكن مقارنتها بتقييمات مستقبلية.",
    ],
    capabilitiesTitle: "كيف يتم ربط الإشارات",
    capabilities: [
      "الإشارات المعزولة نادراً ما تكون ذات معنى.",
      "يبحث محرك الارتباط في CyberGurdian عن أنماط عبر مجموعات الإشارات — نقطة نهاية مُهيَّأة بشكل خاطئ مع سلسلة شهادات ضعيفة وشذوذات في السمعة تعطي دلالة مختلفة تماماً عن أي من هذه النتائج منفردة.",
      "يرسم النظام العلاقات بين الإشارات للكشف عن المخاطر المتراكمة: حيث تتعزز نتيجتان متوسطتان كل منهما الأخرى، يُصعَّد الخطر المشترك بدلاً من احتسابه كمتوسط.",
    ],
    differentTitle: "لماذا هذه المنصة مختلفة",
    different:
      "معظم أنظمة تسجيل الأمن الخارجية تتوقف عند الدرجة. CyberGurdian يتعامل مع الدرجة باعتبارها بداية التفسير لا نهايته. تُنتج المنصة سرداً منظّماً — ماذا تعني الدرجة، وما الذي أفضى إليها، وما هي خطوات العمل الأكثر أولوية. صُمِّمت لفرق الأمن والمحللين الذين يحتاجون إلى تبرير قرار، لا مجرد الإبلاغ عن رقم. كل تقرير جاهز للتدقيق، قابل للتصدير، ومكتوب ليُفهَم من غير المتخصصين.",
    trustTitle: "الفلسفة",
    trust:
      "بُني CyberGurdian على مبدأ واحد: قرارات الأمن يجب أن تستند إلى الدليل، لا إلى الحدس. لا تكافئ المنصة الامتثال الشكلي، ولا تعاقب الجهات على عوامل خارج نطاق سيطرتها. تكافئ الشفافية، والاتساق، وإدارة المخاطر الحقيقية. نؤمن بأن الثقة، حين تُقاس بصرامة، تصبح ميزة تنافسية — وأن المؤسسات التي تفهم حقيقة تعرضها للمخاطر هي الأقدر على حماية شركائها.",
    futureTitle: "الرؤية",
    future:
      "المرحلة القادمة من CyberGurdian مُصمَّمة نحو مراقبة مستمرة للثقة — حيث تُتابَع وضعية الجهات بمرور الوقت، وتُكتشف الانحرافات تلقائياً، وتُنبَّه فرق الأمن قبل أن تتحول المخاطر إلى حوادث فعلية. نسير نحو مستقبل تُدار فيه مخاطر سطح الهجوم الخارجي بنفس الصرامة التي تُدار بها المخاطر المالية: ببيانات حية، وعتبات محددة، ورؤية على مستوى مجلس الإدارة.",
  },
} as const;

function TextCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="min-w-0 rounded-[2rem] border border-white/10 bg-slate-950/90 p-4 shadow-2xl shadow-cyan-500/5 min-[390px]:p-5 sm:bg-slate-950/80 sm:p-7">
      <h2 className="bidi-safe break-words text-start text-xl font-bold tracking-tight text-white min-[390px]:text-2xl">
        {title}
      </h2>
      <p className="bidi-safe mt-4 overflow-hidden break-words text-start text-sm leading-8 text-slate-300 sm:text-base">
        {body}
      </p>
    </article>
  );
}

export default function AboutPage() {
  const { language } = useLanguage();
  const content = CONTENT[language];

  return (
    <PublicShell>
      <section className="mx-auto w-full max-w-4xl space-y-4 px-1 text-center sm:px-0">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300 sm:text-cyan-300 sm:tracking-[0.3em]">
          {content.eyebrow}
        </p>
        <h1 className="bidi-safe text-balance text-[1.8rem] font-black leading-tight tracking-tight text-slate-950 dark:text-white min-[390px]:text-3xl sm:text-4xl sm:text-white lg:text-5xl">
          {content.title}
        </h1>
        <p className="bidi-safe mx-auto max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 min-[390px]:text-base sm:text-lg sm:leading-8 sm:text-slate-300">
          {content.subtitle}
        </p>
      </section>

      <section className="grid min-w-0 gap-5 lg:grid-cols-2">
        <TextCard body={content.mission} title={content.missionTitle} />
        <TextCard body={content.philosophy} title={content.philosophyTitle} />
      </section>

      <section className="min-w-0 rounded-[2rem] border border-cyan-400/20 bg-slate-950/90 p-4 shadow-2xl shadow-cyan-500/10 min-[390px]:p-5 sm:p-7">
        <h2 className="bidi-safe break-words text-start text-xl font-bold text-white min-[390px]:text-2xl">
          {content.doesTitle}
        </h2>
        <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2">
          {content.does.map((item) => (
            <div
              className="bidi-safe min-w-0 overflow-hidden break-words rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-start text-sm leading-7 text-slate-200 sm:bg-white/[0.04] sm:text-slate-300"
              key={item}
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="min-w-0 rounded-[2rem] border border-white/10 bg-slate-950/90 p-4 min-[390px]:p-5 sm:bg-slate-950/80 sm:p-7">
          <h2 className="bidi-safe break-words text-start text-xl font-bold text-white min-[390px]:text-2xl">
            {content.capabilitiesTitle}
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {content.capabilities.map((capability) => (
              <span
                className="bidi-safe max-w-full overflow-hidden break-words rounded-full border border-cyan-300/30 bg-cyan-300/[0.08] px-3 py-2 text-sm font-semibold leading-6 text-cyan-50 min-[390px]:px-4 sm:bg-cyan-300/10 sm:text-cyan-100"
                key={capability}
              >
                {capability}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          <TextCard body={content.different} title={content.differentTitle} />
          <TextCard body={content.trust} title={content.trustTitle} />
          <TextCard body={content.future} title={content.futureTitle} />
        </div>
      </section>
    </PublicShell>
  );
}
