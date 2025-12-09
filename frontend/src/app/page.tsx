import { NewsFeed } from "@/components/news-feed";
import { Hero } from "@/components/hero";
import { LayoutShell } from "@/components/layout-shell";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { FeaturedMerch } from "@/components/featured-merch";
import { CoachesSection } from "@/components/coaches-section";
import { FadeInSection } from "@/components/fade-in-section";
import { SectionHeader } from "@/components/section-header";
import { fetchHomePage } from "@/lib/wagtail-client";

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default async function Home() {
  // Fetch CMS content for the homepage
  const homePage = await fetchHomePage();

  return (
    <LayoutShell>
      <Hero
        heading={homePage?.hero_heading}
        tagline={homePage?.hero_tagline}
        subheading={homePage?.hero_subheading}
        ctaLabel={homePage?.cta_label}
        ctaUrl={homePage?.cta_url}
      />

      {/* Meet Our Coaches - Moved above The Huddle */}
      <FadeInSection direction="up" delay={0}>
        <CoachesSection />
      </FadeInSection>

      {/* The Huddle - News Feed */}
      {homePage?.show_huddle_section && (
        <FadeInSection direction="up" delay={100}>
          <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4">
              <SectionHeader
                title="The Huddle"
                subtitle="Latest news, updates, and highlights from NJ Stars"
              />
              <NewsFeed limit={homePage?.huddle_limit || 3} showSeeMore />
            </div>
          </section>
        </FadeInSection>
      )}

      {/* The Locker Room - Featured Merch Section */}
      {homePage?.show_merch_section && (
        <FadeInSection direction="up" delay={100}>
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="container mx-auto px-4">
              <SectionHeader
                title="The Locker Room"
                subtitle="Rep NJ Stars with official team gear"
              />
              <FeaturedMerch limit={homePage?.merch_limit || 3} showSeeMore />
            </div>
          </section>
        </FadeInSection>
      )}

      {/* Newsletter Signup - from Wagtail CMS */}
      <FadeInSection direction="up" delay={100}>
        <NewsletterSignup
          heading={homePage?.newsletter_heading}
          subheading={homePage?.newsletter_subheading}
          show={homePage?.show_newsletter_signup}
        />
      </FadeInSection>
    </LayoutShell>
  );
}
