import type { Metadata } from "next";
import ContactPage from "@/components/ContactPage";

export const metadata: Metadata = {
  title: "Contact CyberGuardian AI — Cybersecurity Intelligence Platform",
  description:
    "Reach the CyberGuardian security team for platform inquiries, engineering collaboration, or research partnerships.",
};

export default function Contact() {
  return <ContactPage />;
}
