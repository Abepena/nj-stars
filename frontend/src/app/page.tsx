import { NewsFeed } from "@/components/news-feed";
import { Hero } from "@/components/hero";
import { LayoutShell } from "@/components/layout-shell";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { FeaturedMerch } from "@/components/featured-merch";
import { CoachesSection } from "@/components/coaches-section";
import { FadeInSection } from "@/components/fade-in-section";
import { SectionHeader } from "@/components/section-header";

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
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <FeaturedMerch limit={6} showSeeMore />
          </div>
        </section>
      </FadeInSection>

      {/* The Huddle - News Feed */}
      <FadeInSection direction="up" delay={100}>
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <SectionHeader
              title="The Huddle"
              subtitle="Latest news, updates, and highlights from NJ Stars"
            />
            <NewsFeed limit={4} showSeeMore />
          </div>
        </section>
      </FadeInSection>

      {/* Newsletter Signup */}
      <FadeInSection direction="up" delay={100}>
        <NewsletterSignup />
      </FadeInSection>
    </LayoutShell>
  );
}
