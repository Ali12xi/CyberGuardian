"use client";

import PublicShell from "@/components/PublicShell";
import { useLanguage } from "@/components/LanguageProvider";

const CONTENT = {
  en: {
    eyebrow: "About CyberGuardian",
    title: "Cybersecurity intelligence that people can actually understand.",
    subtitle:
      "CyberGuardian V1 turns externally observable website security signals into deterministic, explainable, and human-readable intelligence for developers, researchers, founders, and decision makers.",
    missionTitle: "Mission",
    mission:
      "The mission is simple: make web security analysis clearer, calmer, and more useful. CyberGuardian exists to help people understand risk without drowning them in raw scanner output or unverifiable claims.",
    philosophyTitle: "Security Philosophy",
    philosophy:
      "Security intelligence should be evidence-based, contextual, and readable. A missing header is not automatically a breach, and a strong brand is not automatically safe. CyberGuardian balances technical signals with trust, confidence, and observable attack impact.",
    doesTitle: "What CyberGuardian Does",
    does: [
      "Validates URLs safely before scanning to reduce SSRF and private-network risk.",
      "Analyzes TLS, Security Headers, Redirects, Domain signals, reputation, and passive Infrastructure fingerprints.",
      "Generates deterministic scores with confidence-aware analysis instead of treating partial visibility as direct insecurity.",
      "Produces executive-grade summaries and bilingual PDF reports that are useful to technical and non-technical readers.",
    ],
    capabilitiesTitle: "Key Capabilities",
    capabilities: [
      "AI-powered security interpretation",
      "Deterministic website security scoring",
      "Human-readable threat intelligence",
      "External reputation intelligence",
      "Enterprise-style PDF reporting",
      "Arabic and English experience with RTL/LTR support",
    ],
    differentTitle: "What Makes It Different",
    different:
      "CyberGuardian is built around explainability. It does not fabricate CVEs, exaggerate weak evidence, or present reputation feeds as absolute truth. The platform correlates signals and explains what they may mean from a practical security perspective.",
    trustTitle: "Trust And Intelligence Approach",
    trust:
      "The platform treats every external signal as supporting evidence. TLS posture, browser hardening, redirects, reputation, CDN/WAF presence, and scan confidence are weighed together so the final posture feels realistic and repeatable.",
    futureTitle: "Future Vision",
    future:
      "CyberGuardian will continue growing toward a broader cybersecurity intelligence workspace with historical comparisons, organization profiles, compliance mapping, and richer collaboration workflows while keeping the analysis understandable.",
  },
  ar: {
    eyebrow: "عن CyberGuardian",
    title: "استخبارات أمنية يمكن فهمها فعليًا.",
    subtitle:
      "يحوّل CyberGuardian V1 الإشارات الأمنية المرئية خارجيًا للمواقع إلى استخبارات حتمية وقابلة للتفسير ومفهومة للمطورين والباحثين والمؤسسين وصنّاع القرار.",
    missionTitle: "المهمة",
    mission:
      "المهمة بسيطة: جعل تحليل أمن الويب أوضح وأكثر هدوءًا وفائدة. صُمم CyberGuardian لمساعدة الناس على فهم المخاطر دون إغراقهم بمخرجات فنية خام أو ادعاءات غير قابلة للتحقق.",
    philosophyTitle: "فلسفة الأمن",
    philosophy:
      "يجب أن تكون الاستخبارات الأمنية مبنية على الدليل والسياق وقابلة للقراءة. غياب Header لا يعني اختراقًا تلقائيًا، واسم المؤسسة القوي لا يعني الأمان المطلق. يوازن CyberGuardian بين الإشارات التقنية والثقة ومستوى اليقين والأثر العملي للهجوم.",
    doesTitle: "ماذا يفعل CyberGuardian",
    does: [
      "يتحقق من URL بأمان قبل الفحص لتقليل مخاطر SSRF والشبكات الخاصة.",
      "يحلل TLS وSecurity Headers وRedirects وإشارات Domain والسمعة وبصمات Infrastructure السلبية.",
      "ينتج درجات حتمية مع تحليل واعٍ لمستوى الثقة بدل اعتبار الرؤية الجزئية ضعفًا مباشرًا.",
      "ينشئ ملخصات تنفيذية وتقارير PDF ثنائية اللغة مفيدة للقراء التقنيين وغير التقنيين.",
    ],
    capabilitiesTitle: "القدرات الرئيسية",
    capabilities: [
      "تفسير أمني مدعوم بـ AI",
      "تقييم حتمي لأمن المواقع",
      "Threat Intelligence مفهومة",
      "استخبارات سمعة خارجية",
      "تقارير PDF بطابع مؤسسي",
      "تجربة عربية وإنجليزية مع دعم RTL/LTR",
    ],
    differentTitle: "ما الذي يميزه",
    different:
      "يرتكز CyberGuardian على قابلية التفسير. لا يختلق CVEs، ولا يضخم الأدلة الضعيفة، ولا يعرض مصادر السمعة كحقيقة مطلقة. تربط المنصة الإشارات وتشرح معناها من منظور أمني عملي.",
    trustTitle: "نهج الثقة والاستخبارات",
    trust:
      "تتعامل المنصة مع كل إشارة خارجية كدليل مساعد. يتم وزن حالة TLS وتقوية المتصفح وRedirects والسمعة ووجود CDN/WAF وثقة الفحص معًا لتقديم تقييم واقعي وقابل للتكرار.",
    futureTitle: "الرؤية المستقبلية",
    future:
      "سيتطور CyberGuardian نحو مساحة أوسع لاستخبارات الأمن السيبراني تشمل المقارنات التاريخية وملفات المؤسسات وخرائط الامتثال وسير عمل تعاونية أغنى، مع الحفاظ على وضوح التحليل.",
  },
} as const;

function TextCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-5 shadow-2xl shadow-cyan-500/5 sm:p-7">
      <h2 className="bidi-safe text-start text-2xl font-bold tracking-tight text-white">
        {title}
      </h2>
      <p className="bidi-safe mt-4 text-start text-sm leading-8 text-slate-300 sm:text-base">
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
      <section className="mx-auto max-w-4xl space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
          {content.eyebrow}
        </p>
        <h1 className="bidi-safe text-balance text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
          {content.title}
        </h1>
        <p className="bidi-safe mx-auto max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
          {content.subtitle}
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <TextCard body={content.mission} title={content.missionTitle} />
        <TextCard body={content.philosophy} title={content.philosophyTitle} />
      </section>

      <section className="rounded-[2rem] border border-cyan-400/20 bg-slate-950/90 p-5 shadow-2xl shadow-cyan-500/10 sm:p-7">
        <h2 className="bidi-safe text-start text-2xl font-bold text-white">
          {content.doesTitle}
        </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {content.does.map((item) => (
            <div
              className="bidi-safe rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-start text-sm leading-7 text-slate-300"
              key={item}
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-5 sm:p-7">
          <h2 className="bidi-safe text-start text-2xl font-bold text-white">
            {content.capabilitiesTitle}
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {content.capabilities.map((capability) => (
              <span
                className="bidi-safe rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold leading-6 text-cyan-100"
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
