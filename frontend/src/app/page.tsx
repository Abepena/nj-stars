import { NewsFeed } from "@/components/news-feed";
import { Hero } from "@/components/hero";
import { LayoutShell } from "@/components/layout-shell";

export default function Home() {
  return (
    <LayoutShell>
      <Hero />

      {/* The Huddle - News Feed */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">The Huddle</h2>
            <p className="text-xl text-muted-foreground">
              Latest news, updates, and highlights from NJ Stars
            </p>
          </div>
          <NewsFeed />
        </div>
      </section>
    </LayoutShell>
  );
}
