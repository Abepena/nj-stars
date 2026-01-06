import { ContactForm } from "@/components/contact-form"
import { LayoutShell } from "@/components/layout-shell"
import { Handshake, Megaphone, Users, Star } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us | NJ Stars Elite",
  description: "Get in touch with NJ Stars Elite. Questions about programs, registration, payments, or technical issues? We're here to help.",
}

const sponsorshipBenefits = [
  {
    icon: Megaphone,
    title: "Event Visibility",
    description: "Your brand featured at tournaments, games, and community events throughout the season.",
  },
  {
    icon: Users,
    title: "Community Reach",
    description: "Connect with hundreds of families across Bergen County who support youth athletics.",
  },
  {
    icon: Star,
    title: "Brand Association",
    description: "Align your business with positive values: teamwork, discipline, and youth development.",
  },
]

export default function ContactPage() {
  return (
    <LayoutShell background="gradient-grid">
      <ContactForm wrapInSection />

      {/* Sponsorship Section */}
      <section className="py-16 md:py-20 section-seamless">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-black/80 border border-white/20 mb-4">
                <Handshake className="w-7 h-7 text-secondary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Become a Sponsor
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Partner with NJ Stars Elite and support youth basketball in Bergen County.
                We offer sponsorship opportunities for local businesses looking to make an impact
                in the community while gaining visibility at our events.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
              {sponsorshipBenefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="card-merch-style transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_0_40px_hsl(var(--neon-pink)/0.2)]"
                >
                  <div className="card-merch-style-inner p-6 text-center h-full">
                    <div className="w-12 h-12 bg-bg-tertiary border border-white/[0.08] rounded-full flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="w-6 h-6 text-text-secondary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Interested in sponsoring an event or becoming a program partner?
              </p>
              <a
                href="mailto:njstarsbasketball@gmail.com?subject=Sponsorship%20Inquiry"
                className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/90 transition-colors"
              >
                <Handshake className="w-5 h-5" />
                Contact Us About Sponsorship
              </a>
            </div>
          </div>
        </div>
      </section>
    </LayoutShell>
  )
}
