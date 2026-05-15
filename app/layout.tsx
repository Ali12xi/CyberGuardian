import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import { BRAND, CANONICAL_SITE_URL, VERSION } from "@/lib/brand";
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

const siteDescription =
  "CyberGurdian AI is an AI-powered cybersecurity intelligence platform for human-readable threat insights, deterministic website security scanning, and executive-grade reporting.";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${CANONICAL_SITE_URL}#organization`,
      name: BRAND,
      url: CANONICAL_SITE_URL,
      description: siteDescription,
    },
    {
      "@type": "WebSite",
      "@id": `${CANONICAL_SITE_URL}#website`,
      name: BRAND,
      url: CANONICAL_SITE_URL,
      description: siteDescription,
      publisher: { "@id": `${CANONICAL_SITE_URL}#organization` },
      inLanguage: ["en", "ar"],
    },
    {
      "@type": "SoftwareApplication",
      name: BRAND,
      applicationCategory: "SecurityApplication",
      operatingSystem: "Web",
      description: siteDescription,
      softwareVersion: VERSION,
      provider: { "@id": `${CANONICAL_SITE_URL}#organization` },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_SITE_URL),
  title: {
    default: "CyberGurdian AI — Cybersecurity Intelligence Platform",
    template: `%s | ${BRAND}`,
  },
  description: siteDescription,
  manifest: "/manifest.json",
  alternates: {
    canonical: CANONICAL_SITE_URL,
  },
  openGraph: {
    title: "CyberGurdian AI — Cybersecurity Intelligence Platform",
    description:
      "CyberGurdian AI delivers AI-powered website security scanning, cybersecurity intelligence, and executive-grade reporting.",
    siteName: BRAND,
    type: "website",
    url: CANONICAL_SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CyberGurdian AI — Cybersecurity Intelligence Platform",
    description:
      "CyberGurdian AI — human-readable cybersecurity intelligence, deterministic website security scanning, and executive-grade reporting.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className="dark" style={{ colorScheme: "dark" }}>
      <body className={`${inter.variable} ${cairo.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
