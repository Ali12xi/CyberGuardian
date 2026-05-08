"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageProvider";

const NAV_LABELS = {
  en: {
    home: "Scanner",
    about: "About",
    contact: "Contact",
  },
  ar: {
    home: "الفحص",
    about: "عن المنصة",
    contact: "تواصل",
  },
} as const;

const NAV_LINKS = [
  { href: "/", key: "home" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { language, t } = useLanguage();
  const labels = NAV_LABELS[language];

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-7 px-3 py-6 transition-all duration-300 sm:gap-8 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
      <nav className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600 transition hover:text-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 dark:text-cyan-300"
          href="/"
        >
          {t.brand}
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <div className="flex rounded-2xl border border-slate-200 bg-white/60 p-1 text-xs font-semibold shadow-sm dark:border-white/10 dark:bg-slate-950/60">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  className={`rounded-xl px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-cyan-300/50 ${
                    active
                      ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/10"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                  href={link.href}
                  key={link.href}
                >
                  {labels[link.key]}
                </Link>
              );
            })}
          </div>
          <LanguageToggle />
        </div>
      </nav>

      {children}

      <footer className="mt-auto pb-2 pt-6 text-center text-xs text-slate-500 dark:text-slate-500">
        <div className="mx-auto mb-4 h-px max-w-xl overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <div className="h-full w-1/2 animate-pulse bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
        </div>
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
          <span className="font-semibold text-slate-600 dark:text-slate-400">
            {t.footerEngineeredBy}
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-cyan-400/50 sm:block" />
          <span>{t.footerVersion}</span>
          <span className="hidden h-1 w-1 rounded-full bg-cyan-400/50 sm:block" />
          <span>{t.footerCopyright}</span>
        </div>
      </footer>
    </main>
  );
}
