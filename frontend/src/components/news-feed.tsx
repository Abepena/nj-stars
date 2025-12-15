"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ErrorMessage } from "@/components/error-message"
import { NewsCardSkeleton } from "@/components/skeletons/news-card-skeleton"
import { format } from "date-fns"

interface InstagramPost {
  id: number
  instagram_id: string
  caption: string
  media_type: string
  media_url: string
  permalink: string
  timestamp: string
}

type BlogCategory = 'news' | 'tryouts' | 'camp' | 'tournament' | 'merch' | 'sale' | 'announcement'

interface WagtailBlogPost {
  id: number
  meta: {
    slug: string
    first_published_at: string
  }
  title: string
  date: string
  category: BlogCategory
  intro: string
  featured_image: { url: string } | null
}

interface NewsFeedProps {
  limit?: number
  showSeeMore?: boolean
  wrapInSection?: boolean
}

interface FeedItem {
  id: string
  type: "huddle" | "instagram"
  category?: BlogCategory
  title: string
  content?: string
  excerpt?: string
  image_url?: string
  author?: string
  published_date: string
  permalink?: string
  media_type?: string
}

// Category tag colors - clean text colors for Nike-style
const CATEGORY_CONFIG: Record<BlogCategory | 'instagram', { label: string; className: string }> = {
  news: { label: 'News', className: 'text-info' },
  tryouts: { label: 'Tryouts', className: 'text-warning' },
  camp: { label: 'Camp', className: 'text-success' },
  tournament: { label: 'Tournament', className: 'text-secondary' },
  merch: { label: 'Merch', className: 'text-primary' },
  sale: { label: 'Sale', className: 'text-tertiary' },
  announcement: { label: 'Announcement', className: 'text-accent' },
  instagram: { label: 'Instagram', className: 'text-primary' },
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function NewsFeed({ limit, showSeeMore = false, wrapInSection = false }: NewsFeedProps) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFeed() {
      try {
        setLoading(true)
        setError(null)

        // Fetch both Instagram and Wagtail blog posts in parallel
        const [instagramResponse, blogResponse] = await Promise.all([
          fetch(`${API_BASE}/api/instagram/`).catch(() => null),
          fetch(`${API_BASE}/api/v2/pages/?type=cms.BlogPage&fields=date,intro,featured_image,category&order=-date&limit=10`).catch(() => null),
        ])

        const allItems: FeedItem[] = []

        // Process Instagram posts
        if (instagramResponse?.ok) {
          const instagramData = await instagramResponse.json()
          const instagramFeed: FeedItem[] = (instagramData.results || []).map((post: InstagramPost) => {
            const firstLine = post.caption.split('\n')[0]
            const titleText = firstLine.replace(/[🏀💪🔥⭐🎯🏆📸🔊💯🌟]/g, '').trim()
            const title = titleText.substring(0, 60) + (titleText.length > 60 ? '...' : '')
            const contentLines = post.caption.split('\n').slice(1).join('\n').trim()
            const content = contentLines || post.caption

            return {
              id: `ig-${post.instagram_id}`,
              type: "instagram" as const,
              title: title || 'Instagram Post',
              content: content,
              image_url: post.media_url,
              published_date: post.timestamp,
              permalink: post.permalink,
              media_type: post.media_type,
            }
          })
          allItems.push(...instagramFeed)
        }

        // Process Wagtail blog posts
        if (blogResponse?.ok) {
          const blogData = await blogResponse.json()
          const blogFeed: FeedItem[] = (blogData.items || []).map((post: WagtailBlogPost) => ({
            id: `blog-${post.id}`,
            type: "huddle" as const,
            category: post.category || "news",
            title: post.title,
            excerpt: post.intro,
            image_url: post.featured_image?.url,
            published_date: post.date,
            permalink: `/news/${post.meta.slug}`,
          }))
          allItems.push(...blogFeed)
        }

        // Sort all items by date (newest first)
        allItems.sort((a, b) =>
          new Date(b.published_date).getTime() - new Date(a.published_date).getTime()
        )

        // Apply limit if specified
        const limitedItems = limit ? allItems.slice(0, limit) : allItems
        setFeedItems(limitedItems)

        // Only show error if BOTH sources failed
        if (!instagramResponse?.ok && !blogResponse?.ok) {
          throw new Error('Failed to fetch news feed from any source')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load news feed'
        setError(errorMessage)
        setFeedItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchFeed()
  }, [limit])

  // Hide section entirely on error (as requested)
  if (error) {
    return null
  }

  // Show skeleton while loading
  if (loading) {
    return (
      <div role="status" aria-label="Loading news feed" className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <span className="sr-only">Loading news feed...</span>
        {[1, 2, 3, 4].map((i) => (
          <NewsCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Show "coming soon" message if no data - but also hide if wrapInSection
  if (feedItems.length === 0) {
    if (wrapInSection) return null // Hide entire section when no items
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-24 h-24 mb-6 rounded-full bg-accent/10 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold mb-2">News Feed Coming Soon</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          We're working on bringing you the latest updates, blog posts, and Instagram content. Check back soon!
        </p>
      </div>
    )
  }

  const content = (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {feedItems.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
      {showSeeMore && (
        <div className="flex justify-center">
          <Link href="/news">
            <Button variant="outline" size="lg" className="px-8">
              More Updates →
            </Button>
          </Link>
        </div>
      )}
    </div>
  )

  if (wrapInSection) {
    return (
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          {/* Section Header - matching Programs & Schedule style */}
          <div className="mb-10">
            <p className="text-sm font-medium text-tertiary uppercase tracking-wider mb-2">
              Stay Updated
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              The Huddle
            </h2>
          </div>
          {content}
        </div>
      </section>
    )
  }

  return content
}

// Clean Nike-style feed card
function FeedCard({ item }: { item: FeedItem }) {
  const formattedDate = format(new Date(item.published_date), "MMM dd, yyyy")

  // Get tag config based on item type and category
  const getTagConfig = () => {
    if (item.type === "instagram") {
      return CATEGORY_CONFIG.instagram
    }
    // For huddle posts, use the category or default to 'news'
    const category = item.category || "news"
    return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.news
  }

  const tagConfig = getTagConfig()

  const cardContent = (
    <article className="flex flex-col cursor-pointer group">
      {/* Image - rounded corners, no card border */}
      <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-muted">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center p-8 relative">
            <Image
              src="/brand/logos/logo square thick muted.svg"
              alt={item.title}
              fill
              className="opacity-30 object-contain p-8"
            />
          </div>
        )}
      </div>

      {/* Content - Nike style: tag, title, date */}
      <div className="flex flex-col pt-3 space-y-1">
        {/* Tag label */}
        <span className={`text-xs font-medium ${tagConfig.className}`}>
          {tagConfig.label}
        </span>

        {/* Title */}
        <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h3>

        {/* Date */}
        <p className="text-xs text-muted-foreground">
          {formattedDate}
        </p>
      </div>
    </article>
  )

  // Huddle posts use internal Link, Instagram uses external anchor
  if (item.type === "huddle" && item.permalink) {
    return <Link href={item.permalink}>{cardContent}</Link>
  }

  if (item.type === "instagram" && item.permalink) {
    return (
      <a href={item.permalink} target="_blank" rel="noopener noreferrer" title="Opens in new window">
        {cardContent}
        <span className="sr-only">(opens in new window)</span>
      </a>
    )
  }

  return cardContent
}
