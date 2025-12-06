"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { ErrorMessage } from "@/components/error-message"
import { LoadingSpinner } from "@/components/loading-spinner"
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

interface FeedItem {
  id: string
  type: "blog" | "instagram"
  title: string
  content?: string
  excerpt?: string
  image_url?: string
  author?: string
  published_date: string
  permalink?: string
  media_type?: string
}

export function NewsFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFeed() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('http://localhost:8000/api/instagram/')

        if (!response.ok) {
          throw new Error(`Failed to fetch news feed: ${response.statusText}`)
        }

        const data = await response.json()

        // Transform Instagram posts to FeedItem format
        const instagramFeed: FeedItem[] = (data.results || []).map((post: InstagramPost) => {
          // Extract title from first line before emoji or create from hashtags
          const firstLine = post.caption.split('\n')[0]
          const titleText = firstLine.replace(/[🏀💪🔥⭐🎯🏆📸🔊💯🌟]/g, '').trim()
          const title = titleText.substring(0, 60) + (titleText.length > 60 ? '...' : '')

          // Use caption without title for content
          const contentLines = post.caption.split('\n').slice(1).join('\n').trim()
          const content = contentLines || post.caption

          return {
            id: post.instagram_id,
            type: "instagram" as const,
            title: title || 'Instagram Post',
            content: content,
            image_url: post.media_url,
            published_date: post.timestamp,
            permalink: post.permalink,
            media_type: post.media_type,
          }
        })

        setFeedItems(instagramFeed)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load news feed'
        setError(errorMessage)
        setFeedItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchFeed()
  }, [])

  // Show error if there's an error
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <ErrorMessage error={error} />
      </div>
    )
  }

  // Show spinner while loading
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" text="Loading news feed..." />
      </div>
    )
  }

  // Show "coming soon" message if no data
  if (feedItems.length === 0) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {feedItems.map((item) => (
        <FeedCard key={item.id} item={item} />
      ))}
    </div>
  )
}

function FeedCard({ item }: { item: FeedItem }) {
  const formattedDate = format(new Date(item.published_date), "MMM dd, yyyy")

  return (
    <Card className="overflow-hidden flex flex-col h-[540px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      {/* Image - 80% of card */}
      {item.image_url ? (
        <div className="relative h-[432px] w-full">
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="h-[432px] w-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">No Image</span>
        </div>
      )}

      {/* Content - 20% of card */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-start justify-between mb-1">
          <CardTitle className="line-clamp-1 text-base font-bold flex-1">{item.title}</CardTitle>
          <span className="ml-2 px-2 py-1 rounded-md text-xs font-semibold bg-accent/10 text-accent whitespace-nowrap">
            {item.type === "blog" ? "BLOG" : "INSTAGRAM"}
          </span>
        </div>

        <CardDescription className="text-xs text-muted-foreground mb-2">
          {formattedDate}
        </CardDescription>

        {item.permalink && (
          <a
            href={item.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent/80 text-sm inline-flex items-center gap-1 transition-colors mt-auto"
          >
            View on Instagram →
          </a>
        )}
      </div>
    </Card>
  )
}
