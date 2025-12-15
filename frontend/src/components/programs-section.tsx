import Link from "next/link"
import { Users, Dumbbell, Trophy, Target } from "lucide-react"

const programs = [
  {
    icon: Users,
    title: "Team Training",
    description: "Structured practices focused on team play, offensive and defensive systems, and game-speed situations.",
    href: "/events?event_type=practice+tryouts",
  },
  {
    icon: Target,
    title: "Skills Development",
    description: "Individual skill sessions covering ball handling, shooting mechanics, footwork, and basketball IQ.",
    href: "/events?event_type=open_gym",
  },
  {
    icon: Trophy,
    title: "Competitive Play",
    description: "Local and regional AAU tournaments throughout the season to test skills against top competition.",
    href: "/events?event_type=tournament+games",
  },
  {
    icon: Dumbbell,
    title: "Camps & Conditioning",
    description: "Physical conditioning and skills camps offered during school breaks and the off-season.",
    href: "/events?event_type=camp",
  },
]

export function ProgramsSection() {
  return (
    <section className="py-16 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-10">
          <p className="text-sm font-medium text-secondary uppercase tracking-wider mb-2">
            What We Offer
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Programs & Training
          </h2>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {programs.map((program) => (
            <Link
              key={program.title}
              href={program.href}
              className="group bg-card border border-border rounded-xl p-6 text-center hover:border-secondary/50 transition-all"
            >
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:bg-secondary/10 transition-colors">
                <program.icon className="w-6 h-6 text-muted-foreground group-hover:text-secondary transition-colors" />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-secondary transition-colors">
                {program.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {program.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
