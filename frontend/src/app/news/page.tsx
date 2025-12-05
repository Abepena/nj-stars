import { NewsFeed } from "@/components/news-feed"
import { PageHeader } from "@/components/page-header"
import { LayoutShell } from "@/components/layout-shell"

export default function NewsPage() {
  return (
    <LayoutShell>
      <PageHeader
        title="The Huddle"
        subtitle="Stay connected with the latest news, updates, and highlights."
      />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <NewsFeed />
        </div>
      </section>
    </LayoutShell>
  )
}
