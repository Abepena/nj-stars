"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface HeroProps {
  heading?: string;
  tagline?: string;
  subheading?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

interface NextTryout {
  slug: string;
  title: string;
  start_datetime: string;
}

// Default fallback content (used when Wagtail data unavailable)
const defaults = {
  heading: "Elite Training.",
  tagline: "Built for Rising Stars.",
  subheading:
    "Focused training and real competition for players serious about their game.",
  ctaLabel: "Get in the Game",
};

// Local hero video from brand assets
const HERO_VIDEO_URL = "/brand/assets/videos/hero.mp4";
const USE_HERO_VIDEO = true;

export function Hero({
  heading,
  tagline,
  subheading,
  ctaLabel,
  ctaUrl,
}: HeroProps) {
  const [nextTryout, setNextTryout] = useState<NextTryout | null>(null);

  // Fetch next upcoming tryout
  useEffect(() => {
    async function fetchNextTryout() {
      try {
        const res = await fetch(
          `${API_BASE}/api/events/?event_type=tryout&upcoming=true&limit=1`
        );
        if (res.ok) {
          const data = await res.json();
          const events = data.results || data;
          if (events.length > 0) {
            setNextTryout({
              slug: events[0].slug,
              title: events[0].title,
              start_datetime: events[0].start_datetime,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch next tryout:", err);
      }
    }
    fetchNextTryout();
  }, []);

  // Dynamic CTA based on next tryout
  const dynamicCtaUrl = nextTryout
    ? `/events?highlight=${nextTryout.slug}`
    : "/events";
  const dynamicCtaLabel = nextTryout
    ? `Next Tryout – ${format(new Date(nextTryout.start_datetime), "MMM d")}`
    : defaults.ctaLabel;
  return (
    <section className="h-[calc(100dvh-56px)] md:h-[calc(100dvh-68px)] flex flex-col relative overflow-hidden">
      {/* Video Background - object-position keeps player centered */}
      <div className="absolute inset-0 z-0">
        {/* Dark background shown while video loads */}
        <div className="absolute inset-0 bg-[hsl(var(--bg-primary))]" />

        {USE_HERO_VIDEO ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover object-[center_20%] animate-fade-in-video"
          >
            <source src={HERO_VIDEO_URL} type="video/mp4" />
          </video>
        ) : (
          /* Fallback gradient background when video is disabled */
          <div className="w-full h-full bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary" />
        )}
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-black/10" />
        {/* Gradient that fades into the page background */}
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--bg-primary))] via-transparent to-black/10" />
      </div>

      {/* Bottom fade into page - extended seamless transition */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[hsl(var(--bg-primary))] via-[hsl(var(--bg-primary)/0.7)] to-transparent z-[1] pointer-events-none" />
      {/* Subtle pink glow at bottom to blend with next section */}
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80%] h-40 bg-[radial-gradient(ellipse_at_center,hsl(var(--neon-pink)/0.08)_0%,transparent_70%)] blur-2xl z-[1] pointer-events-none" />

      {/* Content - Bottom on all screens, with safe area for nav */}
      <div className="relative z-10 w-full mt-auto px-4 pt-20 pb-12 md:pb-16">
        <div className="container mx-auto px-4 text-center md:text-left">
          <div className="max-w-4xl">
            <h1 className="text-4xl pb-2 sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]">
              {/* Pink accent line - gradient matching the bottom bar */}
              <div className="w-full h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent mb-1 max-w-[200px] md:max-w-[280px] mx-auto md:mx-0" />
              <span className="block text-white drop-shadow-lg">
                {heading || defaults.heading}
              </span>
              <span className="relative inline-block text-3xl sm:text-4xl md:text-4xl lg:text-5xl mt-2 md:mt-3 text-white/90 drop-shadow-lg">
                {tagline || defaults.tagline}
                {/* Pink underline accent */}
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
              </span>
            </h1>

            <p className="mt-6 md:mt-6 text-base sm:text-lg md:text-lg text-white/80 leading-relaxed max-w-xl mx-auto md:mx-0 drop-shadow-md">
              {subheading || defaults.subheading}
            </p>

            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row sm:justify-center md:justify-start gap-3">
              <Link href={ctaUrl || dynamicCtaUrl}>
                <Button
                  size="lg"
                  variant="cta"
                  className="w-full sm:w-auto text-base px-6 py-5 border-2 border-white/20"
                >
                  {ctaLabel || dynamicCtaLabel} →
                </Button>
              </Link>
              <Link href="/events">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base px-6 py-5 bg-white/10 border-2 border-white/40 text-white hover:bg-white/20"
                >
                  View Schedule
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
