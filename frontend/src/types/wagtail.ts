/**
 * TypeScript types for Wagtail CMS API responses
 *
 * These types match the Wagtail API v2 response format.
 * Used by wagtail-client.ts to provide type-safe CMS data fetching.
 */

// Base meta information included with all Wagtail pages
export interface WagtailPageMeta {
  type: string
  detail_url: string
  html_url: string
  slug: string
  show_in_menus: boolean
  seo_title: string
  search_description: string
  first_published_at: string
  alias_of: null | number
  locale: string
}

// Base Wagtail page structure
export interface WagtailPage {
  id: number
  meta: WagtailPageMeta
  title: string
}

// Wagtail API list response wrapper
export interface WagtailListResponse<T> {
  meta: {
    total_count: number
  }
  items: T[]
}

// StreamField block types
export interface RichTextBlock {
  type: 'rich_text'
  value: string
  id: string
}

export interface HighlightBlock {
  type: 'highlight'
  value: {
    title: string
    text: string
    image: WagtailImage | null
  }
  id: string
}

export interface HeadingBlock {
  type: 'heading'
  value: string
  id: string
}

export interface ParagraphBlock {
  type: 'paragraph'
  value: string
  id: string
}

export interface ImageBlock {
  type: 'image'
  value: WagtailImage
  id: string
}

export type HomePageBodyBlock = RichTextBlock | HighlightBlock

export type BlogPageBodyBlock = HeadingBlock | ParagraphBlock | ImageBlock

// Wagtail Image (when rendered via ImageRenditionField)
export interface WagtailImage {
  url: string
  width: number
  height: number
  alt: string
}

// Author reference
export interface WagtailAuthor {
  id: number
  meta: {
    type: string
  }
}

// HomePage
export interface HomePage extends WagtailPage {
  hero_heading: string
  hero_tagline: string
  hero_subheading: string
  hero_image: WagtailImage | null
  cta_label: string
  cta_url: string
  show_huddle_section: boolean
  huddle_limit: number
  show_merch_section: boolean
  merch_limit: number
  show_newsletter_signup: boolean
  newsletter_heading: string
  newsletter_subheading: string
  body: HomePageBodyBlock[]
}

// BlogIndexPage
export interface BlogIndexPage extends WagtailPage {
  intro: string
}

// Blog category types
export type BlogCategory = 'news' | 'tryouts' | 'camp' | 'tournament' | 'merch' | 'sale' | 'announcement'

// Category display labels
export const CATEGORY_LABELS: Record<BlogCategory, string> = {
  news: 'News',
  tryouts: 'Tryouts',
  camp: 'Camp',
  tournament: 'Tournament',
  merch: 'Merch Drop',
  sale: 'Sale',
  announcement: 'Announcement',
}

// BlogPage
export interface BlogPage extends WagtailPage {
  date: string
  category: BlogCategory
  author: WagtailAuthor | null
  intro: string
  featured_image: WagtailImage | null
  body: BlogPageBodyBlock[]
}

// PlayerProfile (inline model on TeamPage)
export interface PlayerProfile {
  id: number
  meta: {
    type: string
  }
  name: string
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C' | ''
  number: string
  grade: string
  height: string
  bio: string
  headshot: WagtailImage | null
}

// TeamPage
export interface TeamPage extends WagtailPage {
  intro: string
  players: PlayerProfile[]
}

// Position display names
export const POSITION_LABELS: Record<string, string> = {
  PG: 'Point Guard',
  SG: 'Shooting Guard',
  SF: 'Small Forward',
  PF: 'Power Forward',
  C: 'Center',
}
