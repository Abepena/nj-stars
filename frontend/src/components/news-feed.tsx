"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"

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

  useEffect(() => {
    async function fetchFeed() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/blog/feed`)
        const data = await response.json()
        setFeedItems(data)
      } catch (error) {
        console.error("Error fetching feed:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeed()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-muted"></div>
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2 mt-2"></div>
            </CardHeader>
          </Card>
        ))}
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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {item.image_url && (
        <div className="relative h-48 w-full">
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover"
          />
          {item.type === "instagram" && (
            <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              Instagram
            </div>
          )}
        </div>
      )}
      <CardHeader>
        <CardTitle className="line-clamp-2">{item.title}</CardTitle>
        <CardDescription>
          {item.author && <span>{item.author} • </span>}
          {formattedDate}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {item.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {item.excerpt}
          </p>
        )}
        {item.type === "instagram" && item.content && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {item.content}
          </p>
        )}
        {item.type === "instagram" && item.permalink && (
          <a
            href={item.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm mt-2 inline-block"
          >
            View on Instagram →
          </a>
        )}
      </CardContent>
    </Card>
  )
}
