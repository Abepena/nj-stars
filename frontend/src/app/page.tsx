import Link from "next/link"
import { Button } from "@/components/ui/button"
import { NewsFeed } from "@/components/news-feed"

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            NJ Stars
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/news" className="hover:text-primary transition-colors">
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

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            NJ Stars Basketball
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Building champions on and off the court. Join the premier AAU basketball program in New Jersey.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/events">
              <Button size="lg" variant="secondary">
                View Events
              </Button>
            </Link>
            <Link href="/shop">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                Shop Merch
              </Button>
            </Link>
          </div>

          {/* Newsletter Signup */}
          <div className="mt-12 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-md text-gray-900"
              />
              <Button type="submit" variant="secondary">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>

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
