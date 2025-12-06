import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeroProps {
  heading?: string;
  tagline?: string;
  subheading?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

// Default fallback content (used when Wagtail data unavailable)
const defaults = {
  heading: "Elite Training.",
  tagline: "Built for Rising Stars.",
  subheading: "Focused training and real competition for players serious about their game.",
  ctaLabel: "Register for Tryouts",
};

export function Hero({ heading, tagline, subheading, ctaLabel, ctaUrl }: HeroProps) {
  return (
    <section className="bg-card border-b border-border py-16 md:py-20 min-h-[50vh] flex items-center">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-6xl px-6 mx-auto md:mx-6 text-left">
          <h1 className="text-5xl pb-2 sm:text-8xl font-black tracking-tight leading-none bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent">
            <span className="block">{heading || defaults.heading}</span>
            <span className="block text-4xl sm:text-6xl mt-1">
              {tagline || defaults.tagline}
            </span>
          </h1>

          <p className="mt-2 text-base sm:text-xl text-muted-foreground leading-relaxed max-w-xl md:mx-0">
            {subheading || defaults.subheading}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row sm:justify-center md:justify-start gap-3 sm:gap-4">
            <Link href={ctaUrl || "/events"}>
              <Button
                size="lg"
                variant="cta"
                className="w-full sm:w-auto"
              >
                {ctaLabel || defaults.ctaLabel} →
              </Button>
            </Link>
            <Link href="/events/tryouts">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8"
              >
                View Schedule
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
