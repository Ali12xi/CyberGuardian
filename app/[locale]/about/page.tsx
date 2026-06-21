import type { Metadata } from "next";
import AboutPage from "@/components/AboutPage";

export const metadata: Metadata = {
  title: "About CyberGuardian AI — Cybersecurity Intelligence Platform",
  description:
    "Learn how CyberGuardian analyzes external attack surface data, builds trust scores, and correlates signals across TLS posture, security headers, and reputation intelligence.",
};

export default function About() {
  return <AboutPage />;
}
