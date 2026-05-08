import type { Metadata } from "next";
import AboutPage from "@/components/AboutPage";

export const metadata: Metadata = {
  title: "About CyberGuardian AI",
  description:
    "Learn about CyberGuardian AI V1, an AI-powered cybersecurity intelligence platform for deterministic, explainable, human-readable website security analysis.",
  openGraph: {
    title: "About CyberGuardian AI",
    description:
      "CyberGuardian AI turns website security scanning into explainable cybersecurity intelligence and executive-grade reporting.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About CyberGuardian AI",
    description:
      "AI-powered cybersecurity intelligence with deterministic website security analysis and human-readable threat insights.",
  },
};

export default function About() {
  return <AboutPage />;
}
