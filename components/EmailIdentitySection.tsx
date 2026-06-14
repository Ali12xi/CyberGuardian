"use client";

import { useLanguage } from "@/components/LanguageProvider";
import {
  DKIM_COPY,
  DNSSEC_COPY,
  DMARC_COPY,
  SECURITY_TXT_COPY,
  SPF_COPY,
} from "@/lib/emailTrustCopy";
import {
  DNSSEC_INDETERMINATE,
  SECURITY_TXT_INDETERMINATE,
  getDkimAnchor,
  getDmarcInterpretation,
  getHaseenInterpretation,
  getSpfInterpretation,
  interpretDkim,
  interpretDmarc,
  interpretDnssec,
  interpretSecurityTxt,
  interpretSpf,
  type EmailInterpretationState,
} from "@/lib/emailTrustInterpretation";
import type { Language } from "@/lib/i18n";
import type { EmailTrustIntelligence } from "@/lib/types";

const SECTION_COPY = {
  kicker: { en: "📧 EMAIL IDENTITY", ar: "📧 هوية البريد" },
  title: { en: "Email Identity Intelligence", ar: "موثوقية هوية البريد" },
} as const;

const STATE_ICON: Record<EmailInterpretationState, string> = {
  observed: "✅",
  absent: "⚪",
  indeterminate: "❓",
};

function EmailRow({
  icon,
  name,
  explanation,
  footnote,
  language,
}: {
  icon: string;
  name: { en: string; ar: string };
  explanation: string;
  footnote?: string;
  language: Language;
}) {
  const dir = language === "ar" ? "rtl" : "ltr";
  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.04] p-3 sm:p-4">
      <div className="flex items-baseline gap-2">
        <span aria-hidden>{icon}</span>
        <span dir={dir} className="bidi-safe text-start text-sm font-semibold text-white/90">
          {name[language]}
        </span>
      </div>
      <p dir={dir} className="bidi-safe mt-1 text-start text-sm leading-6 text-slate-300">
        {explanation}
      </p>
      {footnote ? (
        <p
          dir={dir}
          className="bidi-safe mt-1 text-start text-xs italic leading-5 text-slate-400"
        >
          {footnote}
        </p>
      ) : null}
    </li>
  );
}

export function EmailIdentitySection({
  emailTrust,
}: {
  emailTrust?: EmailTrustIntelligence;
}) {
  const { language } = useLanguage();

  if (!emailTrust || !emailTrust.hasEmailSurface) {
    return null;
  }

  const spf = interpretSpf(emailTrust.spf);
  const dmarc = interpretDmarc(emailTrust.dmarc);
  const dkim = interpretDkim(emailTrust.dkim);
  const dnssec = interpretDnssec(emailTrust.dnssec);
  const securityTxt = interpretSecurityTxt(emailTrust.securityTxt);

  const spfText = getSpfInterpretation(spf, language);
  const dmarcText = getDmarcInterpretation(dmarc, language);

  const dkimText =
    dkim.state === "observed"
      ? DKIM_COPY.observed[language]
      : DKIM_COPY.notFound[language];
  const dkimAnchor = getDkimAnchor(dkim, language);
  const dkimExplanation = dkimAnchor ? `${dkimText} ${dkimAnchor}` : dkimText;

  const dnssecText =
    dnssec.state === "observed"
      ? DNSSEC_COPY.observed[language]
      : dnssec.state === "absent"
        ? DNSSEC_COPY.absent[language]
        : DNSSEC_INDETERMINATE[language];

  const securityTxtText =
    securityTxt.state === "observed"
      ? SECURITY_TXT_COPY.observed[language]
      : securityTxt.state === "absent"
        ? SECURITY_TXT_COPY.absent[language]
        : SECURITY_TXT_INDETERMINATE[language];

  const dir = language === "ar" ? "rtl" : "ltr";

  return (
    <section
      role="region"
      aria-label={SECTION_COPY.title[language]}
      className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-4 min-[390px]:p-5 sm:bg-slate-950/80 md:p-7"
    >
      <p className="bidi-safe text-start text-xs font-semibold uppercase tracking-wider text-cyan-300/80">
        {SECTION_COPY.kicker[language]}
      </p>
      <h3 className="bidi-safe mt-2 text-start text-xl font-bold text-white">
        {SECTION_COPY.title[language]}
      </h3>

      <ul className="mt-5 space-y-3">
        <EmailRow
          icon={STATE_ICON[spf.state]}
          name={SPF_COPY.protocolName}
          explanation={spfText}
          language={language}
        />
        <EmailRow
          icon={STATE_ICON[dmarc.state]}
          name={DMARC_COPY.protocolName}
          explanation={dmarcText}
          language={language}
        />
        <EmailRow
          icon={STATE_ICON[dkim.state]}
          name={DKIM_COPY.protocolName}
          explanation={dkimExplanation}
          footnote={DKIM_COPY.limitationFootnote[language]}
          language={language}
        />
        <EmailRow
          icon={STATE_ICON[dnssec.state]}
          name={DNSSEC_COPY.protocolName}
          explanation={dnssecText}
          language={language}
        />
        <EmailRow
          icon={STATE_ICON[securityTxt.state]}
          name={SECURITY_TXT_COPY.protocolName}
          explanation={securityTxtText}
          language={language}
        />
      </ul>

      {dmarc.haseenPattern ? (
        <div className="mt-4">
          <span
            dir={dir}
            className="bidi-safe inline-flex items-center rounded-full border border-slate-500/40 bg-slate-800/40 px-3 py-1 text-xs text-slate-300"
          >
            {getHaseenInterpretation(language)}
          </span>
        </div>
      ) : null}
    </section>
  );
}
