"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ErrorMessage } from "@/components/error-message"
import { ProductCardSkeleton } from "@/components/skeletons/product-card-skeleton"
import { ProductQuickView } from "@/components/product-quick-view"
import { shouldSkipImageOptimization } from "@/lib/utils"
import { useBag } from "@/lib/bag"

interface ProductImage {
  id: number
  url: string
  alt_text: string
  is_primary: boolean
  sort_order: number
}

interface ColorOption {
  name: string
  hex: string
}

interface ProductVariant {
  id: number
  printify_variant_id: number | null
  title: string
  size: string
  color: string
  color_hex: string
  price: number | null
  effective_price: number
  is_enabled: boolean
  is_available: boolean
  sort_order: number
}

interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: string
  compare_at_price: string | null
  category: string
  image_url: string
  primary_image_url: string | null
  images: ProductImage[]
  variants: ProductVariant[]
  available_sizes: string[]
  available_colors: ColorOption[]
  is_active: boolean
  featured: boolean
  best_selling: boolean
  on_sale: boolean
  stock_quantity: number
  in_stock: boolean
  fulfillment_type?: 'pod' | 'local'
  is_pod?: boolean
  is_local?: boolean
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface FeaturedMerchProps {
  limit?: number
  showSeeMore?: boolean
  title?: string
  subtitle?: string
  wrapInSection?: boolean
}

export function FeaturedMerch({
  limit = 6,
  showSeeMore = false,
  title = "The Locker Room",
  subtitle = "Rep NJ Stars with official team gear",
  wrapInSection = false
}: FeaturedMerchProps) {
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

  // Hide section entirely on error (as requested)
  if (error) {
    return null
  }

  // Show skeleton while loading
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Mobile/Tablet: Header skeleton */}
        <div className="lg:hidden text-center mb-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded mx-auto" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded mx-auto mt-2" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Desktop Header skeleton */}
          <div className="hidden lg:flex lg:col-span-2 flex-col justify-center p-6 lg:p-8">
            <div className="h-10 w-56 bg-muted animate-pulse rounded" />
            <div className="h-5 w-72 bg-muted animate-pulse rounded mt-2" />
            <div className="h-12 w-32 bg-muted animate-pulse rounded mt-5" />
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  // Show "coming soon" message if no data - but also hide if wrapInSection
  if (products.length === 0) {
    if (wrapInSection) return null // Hide entire section when no products
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

  const content = (
    <>
      <div className="space-y-8">
        {/* Mobile/Tablet: Header above grid */}
        <div className="lg:hidden text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>

        {/* Desktop (lg+): 4-column grid with header in first 2 cols, Mobile/Tablet: 2-column grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Desktop Header - spans 2 columns, 1 row only, hidden on mobile/tablet */}
          <div className="hidden lg:flex lg:col-span-2 flex-col justify-center p-6 lg:p-8">
            <h2 className="lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight">{title}</h2>
            <p className="text-muted-foreground mt-2 text-base lg:text-lg">{subtitle}</p>
            {showSeeMore && (
              <div className="mt-5">
                <Link href="/shop">
                  <Button variant="outline" size="lg" className="px-8">
                    Gear Up →
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => setQuickViewProduct(product)}
            />
          ))}
        </div>

        {/* Mobile/Tablet: Show "Gear Up" button below grid */}
        {showSeeMore && (
          <div className="flex justify-center lg:hidden">
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

  if (wrapInSection) {
    return (
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          {content}
        </div>
      </section>
    )
  }

  return content
}

interface ProductCardProps {
  product: Product
  onClick: () => void
}

function ProductCard({ product, onClick }: ProductCardProps) {
  const { addToBag } = useBag()
  const [isAdding, setIsAdding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleAddToBag = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!product.in_stock || isAdding || showSuccess) return

    setIsAdding(true)
    try {
      await addToBag(product.id, 1)
      // Show success state
      setShowSuccess(true)
      // Reset after animation
      setTimeout(() => setShowSuccess(false), 2000)
    } catch {
      // Error is handled by bag context
    } finally {
      setIsAdding(false)
    }
  }

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
        {(product.primary_image_url || product.image_url) ? (
          <Image
            src={product.primary_image_url || product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized={shouldSkipImageOptimization(product.primary_image_url || product.image_url)}
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

        {/* Hover overlay with price and add to bag button */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
          {/* Price badge - bottom left */}
          <div className="absolute bottom-3 left-3">
            <span className="bg-white text-black text-sm font-semibold px-3 py-1.5 rounded-full shadow-lg">
              ${parseFloat(product.price).toFixed(2)}
              {product.compare_at_price && (
                <span className="ml-1.5 text-muted-foreground line-through text-xs">
                  ${parseFloat(product.compare_at_price).toFixed(2)}
                </span>
              )}
            </span>
          </div>

          {/* Add to bag button - top right */}
          <button
            onClick={handleAddToBag}
            disabled={!product.in_stock || isAdding}
            className={`absolute top-3 right-3 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 disabled:opacity-50 ${
              showSuccess
                ? 'bg-green-500 scale-110 animate-success-pulse'
                : 'bg-white hover:bg-gray-100'
            }`}
            aria-label={showSuccess ? "Added to bag" : "Add to bag"}
          >
            {showSuccess ? (
              <Check className="w-5 h-5 text-white animate-checkmark" strokeWidth={3} />
            ) : (
              <ShoppingBag className="w-5 h-5 text-black" />
            )}
          </button>
        </div>

        {/* Out of stock overlay */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">Sold Out</span>
          </div>
        )}
      </div>

      {/* Content - flat layout */}
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
