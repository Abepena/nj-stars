import { NewsFeed } from "@/components/news-feed";
import { Hero } from "@/components/hero";
import { LayoutShell } from "@/components/layout-shell";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { FeaturedMerch } from "@/components/featured-merch";
import { CoachesSection } from "@/components/coaches-section";
import { FadeInSection } from "@/components/fade-in-section";

export default function Home() {
  return (
    <LayoutShell>
      <Hero />

      {/* Meet Our Coaches */}
      <FadeInSection direction="up" delay={0}>
        <CoachesSection />
      </FadeInSection>

      {/* The Locker Room - Featured Merch Section */}
      <FadeInSection direction="up" delay={100}>
        <FeaturedMerch limit={6} showSeeMore wrapInSection />
      </FadeInSection>

      {/* The Huddle - News Feed */}
      <FadeInSection direction="up" delay={100}>
        <NewsFeed limit={4} showSeeMore wrapInSection />
      </FadeInSection>

      {/* Newsletter Signup */}
      <FadeInSection direction="up" delay={100}>
        <NewsletterSignup />
      </FadeInSection>
    </LayoutShell>
  );
}
