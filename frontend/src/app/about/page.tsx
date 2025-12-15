import { PageHeader } from "@/components/page-header"
import { LayoutShell } from "@/components/layout-shell"
import { CoachesSection } from "@/components/coaches-section"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Users, Flame, Shield } from "lucide-react"

export default function AboutPage() {
  return (
    <LayoutShell>
      <PageHeader
        title="About NJ Stars Elite"
        subtitle="Building elite basketball players and young leaders in New Jersey."
      />

      <section className="py-8">
        <div className="container mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "About" },
            ]}
          />
        </div>
      </section>

      {/* About Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Main About Paragraph */}
            <div className="prose prose-invert prose-lg max-w-none mb-12">
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Based out of Moonachie, NJ, <span className="text-foreground font-medium">NJ Stars Elite</span> has
                quickly become one of the premier AAU basketball programs serving families and players throughout
                Bergen County. We develop young athletes from grades 2nd through 10th, focusing on mastering
                fundamental skills while fostering the teamwork and decision-making abilities that translate
                both on and off the court. <span className="text-foreground font-medium">We don&apos;t recruit
                stars—we develop them.</span> Our mission is to grow talent from within our community, turning
                dedicated young players into elite athletes through hard work and expert coaching.
              </p>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mt-4">
                What sets us apart is our commitment to creating a <span className="text-foreground font-medium">family-like atmosphere</span> where
                players, coaches, and families come together as a close-knit community. The bonds formed through
                our program go beyond the game—we&apos;re shaping athletes who excel in basketball while growing
                into strong, well-rounded individuals who make a positive impact in their communities.
              </p>
            </div>

            {/* Core Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {/* Family */}
              <div className="bg-card/50 border border-border/50 rounded-xl p-6 text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Family</h3>
                <p className="text-muted-foreground text-sm">
                  Every player is a valued member of the NJ Stars family. We lift each other up and succeed together,
                  building bonds that last a lifetime.
                </p>
              </div>

              {/* Hustle */}
              <div className="bg-card/50 border border-border/50 rounded-xl p-6 text-center">
                <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flame className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Hustle</h3>
                <p className="text-muted-foreground text-sm">
                  We embrace the grind, giving our all during every practice, drill, and game. Hard work and
                  dedication define our approach.
                </p>
              </div>

              {/* Character */}
              <div className="bg-card/50 border border-border/50 rounded-xl p-6 text-center">
                <div className="w-14 h-14 bg-tertiary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-tertiary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Character</h3>
                <p className="text-muted-foreground text-sm">
                  Sportsmanship, discipline, and respect in everything we do. How we conduct ourselves on and
                  off the court reflects who we are.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Our Coaches */}
      <CoachesSection />
    </LayoutShell>
  )
}
