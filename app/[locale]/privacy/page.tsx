import type { Metadata } from "next";
import PublicShell from "@/components/PublicShell";

export const metadata: Metadata = {
  title: "Privacy & Usage — CyberGurdian AI Cybersecurity Intelligence Platform",
  description:
    "How CyberGurdian handles data: publicly observable signals only, no credential collection, responsible use policy, and scan limitations.",
};

const CONTACT_EMAIL = "cybergurdianai@gmail.com";

const CONTENT = {
  en: {
    eyebrow: "Legal & Transparency",
    title: "Privacy & Usage",
    subtitle:
      "How CyberGurdian works, what it analyzes, and how results should be interpreted.",
    closing:
      "This policy may evolve as CyberGurdian expands its capabilities and infrastructure.",
    sections: [
      {
        title: "What CyberGurdian Analyzes",
        body: "CyberGurdian assesses the externally observable security posture of domains and web infrastructure. This includes TLS configuration, HTTP security headers, redirect behavior, DNS records, and other signals that are publicly accessible without authentication.",
      },
      {
        title: "Publicly Observable Data Only",
        body: "All analysis is performed on data that is openly available on the public internet. CyberGurdian does not access private systems, internal networks, or any data that requires credentials or authorization to retrieve.",
      },
      {
        title: "No Credential Collection",
        body: "CyberGurdian does not collect, store, or process usernames, passwords, API keys, or any form of authentication credentials — neither from the entities being assessed nor from users of the platform.",
      },
      {
        title: "External Intelligence Sources",
        body: "Assessments may incorporate signals from external threat intelligence sources and reputation databases. These sources are used to enrich analysis but do not constitute the sole basis of any score.",
      },
      {
        title: "Scan Limitations",
        body: "Results represent a point-in-time assessment of externally observable signals. They are not guarantees of security or insecurity. Infrastructure changes rapidly — a score reflects the state at the time of assessment, not a permanent characterization of any entity.",
      },
      {
        title: "Responsible Use",
        body: "CyberGurdian is designed for legitimate security research, procurement due diligence, and organizational risk assessment. Use of the platform to facilitate attacks, harassment, or unauthorized surveillance is strictly prohibited.",
      },
      {
        title: "Contact",
        body: "For questions about this policy or platform behavior, contact the CyberGurdian security team directly.",
      },
    ],
  },
  ar: {
    eyebrow: "الشفافية والاستخدام",
    title: "الخصوصية والاستخدام",
    subtitle: "كيف يعمل CyberGurdian، وما الذي يحلله، وكيف ينبغي تفسير النتائج.",
    closing: "قد تتطور هذه السياسة مع توسع قدرات CyberGurdian وبنيته التحتية.",
    sections: [
      {
        title: "ما الذي يحلله CyberGurdian",
        body: "يقيّم CyberGurdian الوضعية الأمنية الخارجية القابلة للرصد للنطاقات والبنية التحتية للويب. يشمل ذلك إعدادات TLS، ورؤوس أمان HTTP، وسلوك إعادة التوجيه، وسجلات DNS، وغيرها من الإشارات المتاحة للعموم دون الحاجة إلى مصادقة.",
      },
      {
        title: "بيانات عامة فقط",
        body: "يُجرى جميع التحليل على بيانات متاحة على الإنترنت العام. لا يصل CyberGurdian إلى الأنظمة الخاصة، أو الشبكات الداخلية، أو أي بيانات تستلزم بيانات اعتماد أو تفويضاً للوصول إليها.",
      },
      {
        title: "لا جمع لبيانات الاعتماد",
        body: "لا يجمع CyberGurdian أسماء المستخدمين أو كلمات المرور أو مفاتيح API أو أي شكل من أشكال بيانات الاعتماد — لا من الجهات الخاضعة للتقييم، ولا من مستخدمي المنصة.",
      },
      {
        title: "مصادر الاستخبارات الخارجية",
        body: "قد تتضمن التقييمات إشارات من مصادر استخبارات التهديدات الخارجية وقواعد بيانات السمعة. تُستخدم هذه المصادر لإثراء التحليل، لكنها لا تشكل الأساس الوحيد لأي درجة.",
      },
      {
        title: "حدود الفحص",
        body: "تمثل النتائج تقييماً في لحظة زمنية محددة للإشارات الخارجية القابلة للرصد. وهي ليست ضمانات للأمان أو عدمه. تتغير البنية التحتية بسرعة — تعكس الدرجة الحالة وقت التقييم، لا وصفاً دائماً لأي جهة.",
      },
      {
        title: "الاستخدام المسؤول",
        body: "صُمِّم CyberGurdian للبحث الأمني المشروع، والعناية الواجبة في المشتريات، وتقييم المخاطر المؤسسية. يُحظر صراحةً استخدام المنصة لتسهيل الهجمات، أو التحرش، أو المراقبة غير المصرح بها.",
      },
      {
        title: "التواصل",
        body: "للاستفسار عن هذه السياسة أو سلوك المنصة، تواصل مع فريق أمن CyberGurdian مباشرةً.",
      },
    ],
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

export default function PrivacyPage({ params }: { params: { locale: string } }) {
  const locale = params.locale === "ar" ? "ar" : "en";
  const content = CONTENT[locale];
  const contactSection = content.sections[6];

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
        {content.sections.slice(0, 6).map((section) => (
          <TextCard body={section.body} key={section.title} title={section.title} />
        ))}
        <article className="min-w-0 rounded-[2rem] border border-white/10 bg-slate-950/90 p-4 shadow-2xl shadow-cyan-500/5 min-[390px]:p-5 sm:bg-slate-950/80 sm:p-7 lg:col-span-2">
          <h2 className="bidi-safe break-words text-start text-xl font-bold tracking-tight text-white min-[390px]:text-2xl">
            {contactSection.title}
          </h2>
          <p className="bidi-safe mt-4 overflow-hidden break-words text-start text-sm leading-8 text-slate-300 sm:text-base">
            {contactSection.body}
          </p>
          <a
            className="mt-4 inline-block break-all text-start text-base font-bold leading-8 text-cyan-300 transition hover:text-cyan-200 min-[390px]:text-lg"
            dir="ltr"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
        </article>
      </section>

      <p className="bidi-safe mx-auto max-w-3xl px-2 text-center text-sm leading-7 text-slate-500 dark:text-slate-400 sm:text-slate-400">
        {content.closing}
      </p>
    </PublicShell>
  );
}
