/**
 * Wagtail CMS API Client
 *
 * Fetches content from the Wagtail CMS backend.
 * Used by Next.js pages/components to render CMS-managed content.
 *
 * All methods are designed for server-side fetching (SSR/SSG).
 */

import type {
  WagtailListResponse,
  BlogIndexPage,
  BlogPage,
  TeamPage,
} from '@/types/wagtail'

// Server-side fetches need to use Docker's internal network hostname
// Client-side fetches can use localhost (browser makes the request)
const WAGTAIL_API_URL =
  typeof window === 'undefined'
    ? (process.env.INTERNAL_API_URL || 'http://backend:8000')
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

/**
 * Fetch from Wagtail API with error handling
 */
async function wagtailFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${WAGTAIL_API_URL}/api/v2${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Wagtail API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch the BlogIndexPage (parent of all blog posts)
 */
export async function fetchBlogIndex(): Promise<BlogIndexPage | null> {
  try {
    const data = await wagtailFetch<WagtailListResponse<BlogIndexPage>>(
      '/pages/?type=cms.BlogIndexPage&fields=*'
    )
    return data.items[0] || null
  } catch (error) {
    console.error('Error fetching BlogIndexPage:', error)
    return null
  }
}

/**
 * Fetch all blog posts
 *
 * Returns blog posts ordered by date descending.
 * Optionally limit the number of posts returned.
 */
export async function fetchBlogPosts(limit?: number): Promise<BlogPage[]> {
  try {
    let endpoint = '/pages/?type=cms.BlogPage&fields=*&order=-date'
    if (limit) {
      endpoint += `&limit=${limit}`
    }

    const data = await wagtailFetch<WagtailListResponse<BlogPage>>(endpoint)
    return data.items
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }
}

/**
 * Fetch a single blog post by slug
 */
export async function fetchBlogPost(slug: string): Promise<BlogPage | null> {
  try {
    const data = await wagtailFetch<WagtailListResponse<BlogPage>>(
      `/pages/?type=cms.BlogPage&slug=${slug}&fields=*`
    )
    return data.items[0] || null
  } catch (error) {
    console.error(`Error fetching blog post "${slug}":`, error)
    return null
  }
}

/**
 * Fetch the TeamPage with all player profiles
 */
export async function fetchTeamPage(): Promise<TeamPage | null> {
  try {
    const data = await wagtailFetch<WagtailListResponse<TeamPage>>(
      '/pages/?type=cms.TeamPage&fields=*'
    )
    return data.items[0] || null
  } catch (error) {
    console.error('Error fetching TeamPage:', error)
    return null
  }
}

/**
 * Convert Wagtail blog posts to the unified BlogPost format
 * used by the news feed component.
 *
 * This allows blog posts to be mixed with Instagram posts in the feed.
 */
export function convertToBlogPostFormat(
  posts: BlogPage[]
): Array<{
  id: string
  type: 'blog'
  title: string
  excerpt: string
  image_url?: string
  author?: string
  published_date: string
  permalink: string
}> {
  return posts.map((post) => ({
    id: `wagtail-${post.id}`,
    type: 'blog' as const,
    title: post.title,
    excerpt: post.intro,
    image_url: post.featured_image?.url,
    published_date: post.date,
    permalink: `/news/${post.meta.slug}`,
  }))
}
