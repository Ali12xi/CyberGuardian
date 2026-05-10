import type { Metadata } from "next";
import ContactPage from "@/components/ContactPage";

export const metadata: Metadata = {
  title: "Contact CyberGurdian AI",
  description:
    "Contact CyberGurdian AI for cybersecurity research, collaboration, development feedback, and AI-powered website security intelligence discussions.",
  openGraph: {
    title: "Contact CyberGurdian AI",
    description:
      "Connect with CyberGurdian AI for security research, collaboration, and website security scanning feedback.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact CyberGurdian AI",
    description:
      "Reach CyberGurdian AI for cybersecurity intelligence collaboration, research, and product feedback.",
  },
};

export default function Contact() {
  return <ContactPage />;
}
