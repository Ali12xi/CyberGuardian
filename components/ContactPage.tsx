"use client";

import PublicShell from "@/components/PublicShell";
import { useLanguage } from "@/components/LanguageProvider";

const CONTACT = {
  email: "ali7abdrahman@gmail.com",
  github: "https://github.com/Ali12xi",
};

const CONTENT = {
  en: {
    eyebrow: "Contact",
    title: "Connect with CyberGuardian.",
    subtitle:
      "For collaboration, security research, product feedback, or technical discussion, reach out through the channels below.",
    intro:
      "CyberGuardian welcomes thoughtful conversations with developers, researchers, organizations, and builders who care about practical cybersecurity intelligence.",
    collaborationTitle: "Collaboration",
    collaboration:
      "Open to product feedback, responsible security research, integration ideas, and partnerships that make web security easier to understand.",
    researchTitle: "Security Research",
    research:
      "If you are a researcher reviewing CyberGuardian or have suggestions for improving analysis quality, deterministic scoring, or bilingual reporting, your input is welcome.",
    emailLabel: "Email",
    githubLabel: "GitHub",
    emailAction: "Send email",
    githubAction: "View profile",
  },
  ar: {
    eyebrow: "تواصل",
    title: "تواصل مع CyberGuardian.",
    subtitle:
      "للتعاون أو أبحاث الأمن أو ملاحظات المنتج أو النقاش التقني، يمكنك استخدام قنوات التواصل أدناه.",
    intro:
      "يرحب CyberGuardian بالنقاشات الجادة مع المطورين والباحثين والمؤسسات والمهتمين ببناء استخبارات أمنية عملية ومفهومة.",
    collaborationTitle: "التعاون",
    collaboration:
      "متاح لملاحظات المنتج، وأبحاث الأمن المسؤولة، وأفكار التكامل، والشراكات التي تجعل أمن الويب أسهل فهمًا.",
    researchTitle: "أبحاث الأمن",
    research:
      "إذا كنت باحثًا تراجع CyberGuardian أو لديك اقتراحات لتحسين جودة التحليل أو التقييم الحتمي أو التقارير ثنائية اللغة، فمساهمتك مرحب بها.",
    emailLabel: "البريد الإلكتروني",
    githubLabel: "GitHub",
    emailAction: "إرسال بريد",
    githubAction: "عرض الملف",
  },
} as const;

function ContactLink({
  label,
  value,
  href,
  action,
}: {
  label: string;
  value: string;
  href: string;
  action: string;
}) {
  return (
    <article className="rounded-[2rem] border border-cyan-400/20 bg-slate-950/90 p-5 shadow-2xl shadow-cyan-500/10 sm:p-7">
      <p className="bidi-safe text-start text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
        {label}
      </p>
      <p className="mt-4 break-all text-start text-lg font-bold leading-8 text-white" dir="ltr">
        {value}
      </p>
      <a
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400 px-5 text-sm font-bold text-slate-950 shadow-2xl shadow-cyan-500/20 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
        href={href}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
        target={href.startsWith("http") ? "_blank" : undefined}
      >
        {action}
      </a>
    </article>
  );
}

export default function ContactPage() {
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

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-5 shadow-2xl shadow-cyan-500/5 sm:p-7">
          <p className="bidi-safe text-start text-base leading-8 text-slate-300">
            {content.intro}
          </p>
          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <h2 className="bidi-safe text-start text-lg font-bold text-white">
                {content.collaborationTitle}
              </h2>
              <p className="bidi-safe mt-3 text-start text-sm leading-7 text-slate-400">
                {content.collaboration}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <h2 className="bidi-safe text-start text-lg font-bold text-white">
                {content.researchTitle}
              </h2>
              <p className="bidi-safe mt-3 text-start text-sm leading-7 text-slate-400">
                {content.research}
              </p>
            </div>
          </div>
        </article>

        <div className="grid gap-5">
          <ContactLink
            action={content.emailAction}
            href={`mailto:${CONTACT.email}`}
            label={content.emailLabel}
            value={CONTACT.email}
          />
          <ContactLink
            action={content.githubAction}
            href={CONTACT.github}
            label={content.githubLabel}
            value={CONTACT.github}
          />
        </div>
      </section>
    </PublicShell>
  );
}
