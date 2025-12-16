import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconCard } from "@/components/ui/icon-card"
import { UserPlus, Trophy, Dribbble, DoorOpen, ArrowRight } from "lucide-react"

const eventTypes = [
  {
    icon: UserPlus,
    title: "Tryouts",
    description: "Show us what you've got. Open tryouts for players looking to join the team.",
    href: "/events?event_type=tryout",
  },
  {
    icon: Dribbble,
    title: "Games",
    description: "Regular season matchups against local teams. Come support the squad.",
    href: "/events?event_type=game",
  },
  {
    icon: Trophy,
    title: "Tournaments",
    description: "AAU tournaments and showcases where our teams compete at the highest level.",
    href: "/events?event_type=tournament",
  },
  {
    icon: DoorOpen,
    title: "Open Gym",
    description: "Drop-in sessions for extra reps, pickup games, and skill work.",
    href: "/events?event_type=open_gym",
  },
]

export function ScheduleSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <p className="text-sm font-medium text-success uppercase tracking-wider mb-2">
              What&apos;s Happening
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              The Schedule
            </h2>
          </div>
          <Link href="/events" className="hidden md:block">
            <Button variant="ghost" className="gap-2">
              View All Events <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Event Types Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {eventTypes.map((eventType) => (
            <IconCard
              key={eventType.title}
              icon={eventType.icon}
              title={eventType.title}
              description={eventType.description}
              href={eventType.href}
              accentColor="success"
            />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center md:hidden">
          <Link href="/events">
            <Button variant="outline" className="gap-2">
              View All Events <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
