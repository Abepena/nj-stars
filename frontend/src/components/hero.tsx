"use client"

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

// Local hero video from brand assets
const HERO_VIDEO_URL = "/brand/videos/hero.mov" 

export function Hero({ heading, tagline, subheading, ctaLabel, ctaUrl }: HeroProps) {
  return (
    <section className="bg-card border-b border-border min-h-[calc(100vh-80px)] flex flex-col relative overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={HERO_VIDEO_URL} type="video/mp4" />
        </video>
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Additional gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      </div>

      {/* Content - Bottom on all screens, centered on desktop */}
      <div className="relative z-10 w-full mt-auto px-4 py-8 md:py-16">
        <div className="container mx-auto px-4 text-center md:text-left">
          <div className="max-w-4xl">
          <h1 className="text-4xl pb-2 sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]">
            {/* Pink accent line - gradient matching the bottom bar */}
            <div className="w-full h-0.5 bg-gradient-to-r from-primary to-primary/0 mb-1 max-w-[200px] md:max-w-[280px] mx-auto md:mx-0" />
            <span className="block text-white drop-shadow-lg">{heading || defaults.heading}</span>
            <span className="relative inline-block text-3xl sm:text-4xl md:text-4xl lg:text-5xl mt-2 md:mt-3 text-white/90 drop-shadow-lg">
              {tagline || defaults.tagline}
              {/* Pink underline accent */}
              <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-primary/0" />
            </span>
          </h1>

          <p className="mt-6 md:mt-6 text-base sm:text-lg md:text-lg text-white/80 leading-relaxed max-w-xl mx-auto md:mx-0 drop-shadow-md">
            {subheading || defaults.subheading}
          </p>

          <div className="mt-6 md:mt-8 flex flex-col sm:flex-row sm:justify-center md:justify-start gap-3">
            <Link href={ctaUrl || "/events"}>
              <Button
                size="lg"
                variant="cta"
                className="w-full sm:w-auto text-base px-6 py-5 border-2 border-white/20"
              >
                {ctaLabel || defaults.ctaLabel} →
              </Button>
            </Link>
            <Link href="/events/tryouts">
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
