import Link from "next/link"
import { Button } from "@/components/ui/button"
import { NewsFeed } from "@/components/news-feed"

export default function NewsPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            NJ Stars
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/news" className="hover:text-primary transition-colors font-semibold">
              News
            </Link>
            <Link href="/shop" className="hover:text-primary transition-colors">
              Shop
            </Link>
            <Link href="/events" className="hover:text-primary transition-colors">
              Events
            </Link>
            <Link href="/portal/login">
              <Button>Portal Login</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">The Huddle</h1>
          <p className="text-xl">
            Stay connected with the latest news, updates, and highlights
          </p>
        </div>
      </section>

      {/* News Feed */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <NewsFeed />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} NJ Stars Basketball. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
