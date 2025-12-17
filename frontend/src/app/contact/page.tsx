import { ContactForm } from "@/components/contact-form"
import { LayoutShell } from "@/components/layout-shell"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us | NJ Stars Elite",
  description: "Get in touch with NJ Stars Elite. Questions about programs, registration, payments, or technical issues? We're here to help.",
}

export default function ContactPage() {
  return (
    <LayoutShell>
      <ContactForm wrapInSection />
    </LayoutShell>
  )
}
