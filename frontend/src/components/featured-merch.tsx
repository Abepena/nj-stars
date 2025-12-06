"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ErrorMessage } from "@/components/error-message"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ProductCardSkeleton } from "@/components/skeletons/product-card-skeleton"

interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: string
  compare_at_price: string | null
  category: string
  image_url: string
  is_active: boolean
  featured: boolean
  best_selling: boolean
  on_sale: boolean
  stock_quantity: number
  in_stock: boolean
}

type ProductTag = 'featured' | 'best_selling' | 'on_sale'

// Product tag colors and labels - using design tokens
const TAG_CONFIG: Record<ProductTag, { label: string; className: string }> = {
  featured: { label: 'FEATURED', className: 'bg-secondary/15 text-secondary' },
  best_selling: { label: 'BEST SELLING', className: 'bg-warning/15 text-warning' },
  on_sale: { label: 'ON SALE!', className: 'bg-destructive/15 text-destructive' },
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface FeaturedMerchProps {
  limit?: number
  showSeeMore?: boolean
}

export function FeaturedMerch({ limit = 3, showSeeMore = false }: FeaturedMerchProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        setError(null)

        // Fetch featured products (or any that have tags)
        const response = await fetch(`${API_BASE}/api/payments/products/?featured=true`)

        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }

        const data = await response.json()
        const limitedProducts = limit ? (data.results || []).slice(0, limit) : (data.results || [])
        setProducts(limitedProducts)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load products'
        setError(errorMessage)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [limit])

  // Show error if there's an error
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <ErrorMessage error={error} />
      </div>
    )
  }

  // Show skeleton while loading
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Show "coming soon" message if no data
  if (products.length === 0) {
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
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold mb-2">Merch Coming Soon</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          We're working on bringing you the latest NJ Stars gear. Check back soon!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {showSeeMore && (
        <div className="flex justify-center">
          <Link href="/shop">
            <Button variant="outline" size="lg" className="px-8">
              See More →
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  // Determine which tag to show (priority: on_sale > best_selling > featured)
  const getTag = (): ProductTag | null => {
    if (product.on_sale) return 'on_sale'
    if (product.best_selling) return 'best_selling'
    if (product.featured) return 'featured'
    return null
  }

  const tag = getTag()
  const tagConfig = tag ? TAG_CONFIG[tag] : null

  const hasDiscount = product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price)

  const cardContent = (
    <Card className="overflow-hidden flex flex-col h-auto md:h-[540px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      {/* Image - responsive aspect ratio */}
      {product.image_url ? (
        <div className="relative w-full aspect-[4/3] md:h-[432px] md:aspect-auto">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-full aspect-[4/3] md:h-[432px] md:aspect-auto bg-muted flex items-center justify-center p-8 relative">
          <Image
            src="/brand/logos/logo square thick muted.svg"
            alt={product.name}
            fill
            className="opacity-30 object-contain p-8"
          />
        </div>
      )}

      {/* Content - 20% of card */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-start justify-between mb-1">
          <CardTitle className="line-clamp-1 text-base font-bold flex-1">{product.name}</CardTitle>
          {tagConfig && (
            <span className={`ml-2 px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${tagConfig.className}`}>
              {tagConfig.label}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-lg font-bold text-foreground">${product.price}</span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.compare_at_price}
            </span>
          )}
        </div>

        {!product.in_stock && (
          <CardDescription className="text-xs text-red-500 mb-2">
            Out of Stock
          </CardDescription>
        )}

        <span className="text-accent hover:text-accent/80 text-sm inline-flex items-center gap-1 transition-colors mt-auto">
          Shop Now →
        </span>
      </div>
    </Card>
  )

  return (
    <Link href={`/shop/${product.slug}`}>
      {cardContent}
    </Link>
  )
}
