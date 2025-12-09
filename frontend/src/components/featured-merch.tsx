"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ErrorMessage } from "@/components/error-message"
import { ProductCardSkeleton } from "@/components/skeletons/product-card-skeleton"
import { ProductQuickView } from "@/components/product-quick-view"

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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface FeaturedMerchProps {
  limit?: number
  showSeeMore?: boolean
}

export function FeaturedMerch({ limit = 3, showSeeMore = false }: FeaturedMerchProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
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
    <>
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => setQuickViewProduct(product)}
            />
          ))}
        </div>
        {showSeeMore && (
          <div className="flex justify-center">
            <Link href="/shop">
              <Button variant="outline" size="lg" className="px-8">
                Gear Up →
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          open={!!quickViewProduct}
          onOpenChange={(open) => !open && setQuickViewProduct(null)}
        />
      )}
    </>
  )
}

interface ProductCardProps {
  product: Product
  onClick: () => void
}

function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <article
      className="flex flex-col cursor-pointer group"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label={`View ${product.name}`}
    >
      {/* Image - square aspect ratio with rounded corners */}
      <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-muted">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center p-8 relative">
            <Image
              src="/brand/logos/logo square thick muted.svg"
              alt={product.name}
              fill
              className="opacity-30 object-contain p-8"
            />
          </div>
        )}

        {/* Out of stock overlay */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">Sold Out</span>
          </div>
        )}
      </div>

      {/* Content - flat layout, no prices on homepage */}
      <div className="flex flex-col pt-3 space-y-1">
        {/* Product name */}
        <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Category */}
        <span className="text-xs text-muted-foreground">
          {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
        </span>
      </div>
    </article>
  )
}
