import type { Metadata } from "next";
import ContactPage from "@/components/ContactPage";

export const metadata: Metadata = {
  title: "Contact CyberGuardian AI",
  description:
    "Contact CyberGuardian AI for cybersecurity research, collaboration, development feedback, and AI-powered website security intelligence discussions.",
  openGraph: {
    title: "Contact CyberGuardian AI",
    description:
      "Connect with CyberGuardian AI for security research, collaboration, and website security scanning feedback.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact CyberGuardian AI",
    description:
      "Reach CyberGuardian AI for cybersecurity intelligence collaboration, research, and product feedback.",
  },
};

export default function Contact() {
  return <ContactPage />;
}
