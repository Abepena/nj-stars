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
    <section className="bg-card border-b border-border min-h-[calc(100vh-80px)] flex items-center relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="max-w-4xl px-2 sm:px-6 text-left">
          <h1 className="text-5xl pb-2 sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-[0.9] bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent">
            <span className="block">{heading || defaults.heading}</span>
            <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl mt-2 md:mt-4">
              {tagline || defaults.tagline}
            </span>
          </h1>

          <p className="mt-6 md:mt-8 text-lg sm:text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
            {subheading || defaults.subheading}
          </p>

          <div className="mt-10 md:mt-12 flex flex-col sm:flex-row sm:justify-start gap-4">
            <Link href={ctaUrl || "/events"}>
              <Button
                size="lg"
                variant="cta"
                className="w-full sm:w-auto text-base md:text-lg px-8 py-6"
              >
                {ctaLabel || defaults.ctaLabel} →
              </Button>
            </Link>
            <Link href="/events/tryouts">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base md:text-lg px-8 py-6"
              >
                View Schedule
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}
