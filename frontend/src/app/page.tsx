import { NewsFeed } from "@/components/news-feed";
import { Hero } from "@/components/hero";
import { LayoutShell } from "@/components/layout-shell";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { FeaturedMerch } from "@/components/featured-merch";
import { FadeInSection } from "@/components/fade-in-section";

export default function Home() {
  return (
    <LayoutShell>
      <Hero />

      {/* The Locker Room - Featured Merch Section */}
      <FadeInSection direction="up" delay={0}>
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
