import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, Flame, Shield, Trophy, Target, Star } from "lucide-react"

const coreValues = [
  {
    icon: Users,
    title: "Family",
    description: "A close-knit community where players, coaches, and families grow together.",
  },
  {
    icon: Flame,
    title: "Hustle",
    description: "We embrace the grind—giving our all in every practice, drill, and game.",
  },
  {
    icon: Shield,
    title: "Character",
    description: "Discipline, respect, and sportsmanship define who we are on and off the court.",
  },
]

const highlights = [
  { icon: Trophy, label: "Tournament Champions", value: "12+" },
  { icon: Target, label: "Training Sessions", value: "200+" },
  { icon: Star, label: "Player Development", value: "2nd-10th" },
]

export function AboutPreview() {
  return (
    <section className="py-16 md:py-20 section-seamless">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto mb-12">
          <p className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2 text-center">
            About Our Program
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-center text-foreground">
            We Don&apos;t Recruit Stars. We Build Them.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed text-left">
            Based in Moonachie, NJ, NJ Stars Elite is one of Bergen County&apos;s premier AAU basketball
            programs. We develop young athletes from 2nd through 12th grade, focusing on fundamentals,
            teamwork, and the decision-making skills that translate both on and off the court.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto mb-12">
          {highlights.map((item) => (
            <div key={item.label} className="text-center">
              <div className="flex justify-center mb-2">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-2xl md:text-3xl font-bold">{item.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mb-10">
          {coreValues.map((value) => (
            <div
              key={value.title}
              className="card-merch-style transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_0_40px_hsl(var(--neon-pink)/0.2)]"
            >
              <div className="card-merch-style-inner p-6 text-center h-full">
                <div className="w-12 h-12 bg-bg-tertiary border border-white/[0.08] rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-6 h-6 text-text-secondary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/about">
            <Button variant="outline" size="lg">
              Learn More About Us
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
