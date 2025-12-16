import { Users, Dumbbell, Trophy, Target } from "lucide-react"
import { IconCard } from "@/components/ui/icon-card"

const programs = [
  {
    icon: Users,
    title: "Team Training",
    description: "Structured practices focused on team play, offensive and defensive systems, and game-speed situations.",
    href: "/events?event_type=practice+tryouts&view=list",
  },
  {
    icon: Target,
    title: "Skills Development",
    description: "Individual skill sessions covering ball handling, shooting mechanics, footwork, and basketball IQ.",
    href: "/events?event_type=open_gym&view=list",
  },
  {
    icon: Trophy,
    title: "Competitive Play",
    description: "Local and regional AAU tournaments throughout the season to test skills against top competition.",
    href: "/events?event_type=tournament+games&view=list",
  },
  {
    icon: Dumbbell,
    title: "Camps & Conditioning",
    description: "Physical conditioning and skills camps offered during school breaks and the off-season.",
    href: "/events?event_type=camp&view=list",
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
            <IconCard
              key={program.title}
              icon={program.icon}
              title={program.title}
              description={program.description}
              href={program.href}
              accentColor="secondary"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
