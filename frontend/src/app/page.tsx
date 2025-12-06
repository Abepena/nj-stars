import { NewsFeed } from "@/components/news-feed";
import { Hero } from "@/components/hero";
import { LayoutShell } from "@/components/layout-shell";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { FeaturedMerch } from "@/components/featured-merch";
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

      {/* The Huddle - News Feed */}
      {homePage?.show_huddle_section && (
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">The Huddle</h2>
              <p className="text-xl text-muted-foreground">
                Latest news, updates, and highlights from NJ Stars
              </p>
            </div>
            <NewsFeed limit={homePage?.huddle_limit || 3} showSeeMore />
          </div>
        </section>
      )}

      {/* Featured Merch Section - from Wagtail CMS */}
      {homePage?.show_merch_section && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Featured Merch</h2>
              <p className="text-xl text-muted-foreground">
                Rep NJ Stars with official team gear
              </p>
            </div>
            <FeaturedMerch limit={homePage?.merch_limit || 3} showSeeMore />
          </div>
        </section>
      )}

      {/* Newsletter Signup - from Wagtail CMS */}
      <NewsletterSignup
        heading={homePage?.newsletter_heading}
        subheading={homePage?.newsletter_subheading}
        show={homePage?.show_newsletter_signup}
      />
    </LayoutShell>
  );
}
