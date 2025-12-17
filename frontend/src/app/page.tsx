import { NewsFeed } from "@/components/news-feed";
import { Hero } from "@/components/hero";
import { LayoutShell } from "@/components/layout-shell";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { FeaturedMerch } from "@/components/featured-merch";
import { FadeInSection } from "@/components/fade-in-section";
import { AboutPreview } from "@/components/about-preview";
import { ProgramsSection } from "@/components/programs-section";
import { ScheduleSection } from "@/components/schedule-section";
import { ContactForm } from "@/components/contact-form";

export default function Home() {
  return (
    <LayoutShell>
      <Hero />

      {/* About Preview - Team intro and core values */}
      <FadeInSection direction="up" delay={0}>
        <AboutPreview />
      </FadeInSection>

      {/* Programs & Training */}
      <FadeInSection direction="up" delay={0}>
        <ProgramsSection />
      </FadeInSection>

      {/* The Schedule - Event Types */}
      <FadeInSection direction="up" delay={0}>
        <ScheduleSection />
      </FadeInSection>

      {/* The Locker Room - Featured Merch Section */}
      <FadeInSection direction="up" delay={0}>
        <FeaturedMerch limit={6} showSeeMore wrapInSection />
      </FadeInSection>

      {/* The Huddle - News Feed */}
      <FadeInSection direction="up" delay={100}>
        <NewsFeed limit={4} showSeeMore wrapInSection />
      </FadeInSection>

      {/* Contact Form */}
      <FadeInSection direction="up" delay={100}>
        <ContactForm wrapInSection compact />
      </FadeInSection>

      {/* Newsletter Signup */}
      <FadeInSection direction="up" delay={100}>
        <NewsletterSignup />
      </FadeInSection>
    </LayoutShell>
  );
}
