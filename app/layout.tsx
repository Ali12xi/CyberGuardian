import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: {
    default: "CyberGurdian AI — Cybersecurity Intelligence Platform",
    template: "%s | CyberGurdian AI",
  },
  description:
    "CyberGurdian AI is an AI-powered cybersecurity intelligence platform for human-readable threat insights, deterministic website security scanning, and executive-grade reporting.",
  openGraph: {
    title: "CyberGurdian AI — Cybersecurity Intelligence Platform",
    description:
      "AI-powered website security scanning with cybersecurity intelligence, human-readable threat insights, and executive-grade reporting.",
    siteName: "CyberGurdian AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CyberGurdian AI — Cybersecurity Intelligence Platform",
    description:
      "Human-readable cybersecurity intelligence, AI-powered analysis, and deterministic website security scanning.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${inter.variable} ${cairo.variable}`}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
