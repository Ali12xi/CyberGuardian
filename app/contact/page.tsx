import type { Metadata } from "next";
import ContactPage from "@/components/ContactPage";

export const metadata: Metadata = {
  title: "Contact CyberGuardian",
  description:
    "Contact CyberGuardian for cybersecurity research, collaboration, development feedback, and AI-powered website security intelligence discussions.",
  openGraph: {
    title: "Contact CyberGuardian",
    description:
      "Connect with CyberGuardian for security research, collaboration, and website security scanning feedback.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact CyberGuardian",
    description:
      "Reach CyberGuardian for cybersecurity intelligence collaboration, research, and product feedback.",
  },
};

export default function Contact() {
  return <ContactPage />;
}
