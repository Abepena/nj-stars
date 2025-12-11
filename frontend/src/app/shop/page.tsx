"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { PageHeader } from "@/components/page-header"
import { LayoutShell } from "@/components/layout-shell"
import { ErrorMessage } from "@/components/error-message"
import { ProductCardSkeleton } from "@/components/skeletons/product-card-skeleton"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ProductQuickView } from "@/components/product-quick-view"
import { FilterSidebar, type FilterCategory, type FilterTag, type FilterColor, type SortOption } from "@/components/filter-sidebar"
import { Button } from "@/components/ui/button"
import { getCategoryColor } from "@/lib/category-colors"
import { shouldSkipImageOptimization } from "@/lib/utils"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface ProductImage {
  id: number
  url: string
  alt_text: string
  is_primary: boolean
  sort_order: number
}

type FulfillmentType = 'pod' | 'local'

interface ProductColor {
  name: string
  hex: string
}

interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: string
  compare_at_price: string | null
  // Fulfillment
  fulfillment_type: FulfillmentType
  is_pod: boolean
  is_local: boolean
  shipping_estimate: string
  fulfillment_display: string
  // Images
  image_url: string
  primary_image_url: string | null
  images: ProductImage[]
  // Stock & Status
  stock_quantity: number
  category: string
  in_stock: boolean
  featured: boolean
  best_selling?: boolean
  on_sale?: boolean
  // Variants (from Printify sync)
  available_colors: ProductColor[]
  available_sizes: string[]
}


// Product Card - entire card is clickable to open QuickView
// Badges are clickable to filter
interface ProductCardProps {
  product: Product
  onClick: () => void
  onTagClick: (tag: string) => void
  onCategoryClick: (category: string) => void
  selectedTags: string[]
  selectedCategories: string[]
}

function ProductCard({ product, onClick, onTagClick, onCategoryClick, selectedTags, selectedCategories }: ProductCardProps) {
  const hasDiscount = product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price)
  const colors = product.available_colors || []

  // Handle badge click without triggering card click
  const handleBadgeClick = (e: React.MouseEvent, handler: () => void) => {
    e.stopPropagation()
    handler()
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
      aria-label={`View ${product.name} - $${parseFloat(product.price).toFixed(2)}`}
    >
      {/* Image - rounded corners, no card border */}
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

        {/* Out of stock overlay */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">Sold Out</span>
          </div>
        )}
      </div>

      {/* Content - Nike style: color swatches, tag, title, category, price */}
      <div className="flex flex-col pt-3 space-y-1">
        {/* Color swatches row */}
        {colors.length > 0 && (
          <div className="flex items-center gap-1.5">
            {colors.slice(0, 4).map((color) => (
              <span
                key={color.name}
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
            {colors.length > 4 && (
              <span className="text-xs text-muted-foreground">+{colors.length - 4}</span>
            )}
          </div>
        )}

        {/* Tag label - Nike style text badges */}
        <div className="flex flex-wrap gap-1 min-h-[20px]">
          {product.featured && (
            <button
              onClick={(e) => handleBadgeClick(e, () => onTagClick('featured'))}
              className={`text-xs font-medium transition-colors ${
                selectedTags.includes('featured')
                  ? 'text-primary underline'
                  : 'text-primary hover:underline'
              }`}
            >
              Featured
            </button>
          )}
          {product.best_selling && (
            <button
              onClick={(e) => handleBadgeClick(e, () => onTagClick('best_seller'))}
              className={`text-xs font-medium transition-colors ${
                selectedTags.includes('best_seller')
                  ? 'text-secondary underline'
                  : 'text-secondary hover:underline'
              }`}
            >
              Best Seller
            </button>
          )}
          {hasDiscount && (
            <button
              onClick={(e) => handleBadgeClick(e, () => onTagClick('on_sale'))}
              className={`text-xs font-medium transition-colors ${
                selectedTags.includes('on_sale')
                  ? 'text-accent underline'
                  : 'text-accent hover:underline'
              }`}
            >
              Sale
            </button>
          )}
          {!product.is_pod && product.stock_quantity > 0 && product.stock_quantity <= 5 && (
            <span className="text-xs text-accent font-medium">Almost Gone!</span>
          )}
        </div>

        {/* Product name */}
        <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Category and Fulfillment */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => handleBadgeClick(e, () => onCategoryClick(product.category))}
            className={`text-xs text-muted-foreground hover:text-foreground transition-colors text-left ${
              selectedCategories.includes(product.category) ? 'underline text-foreground' : ''
            }`}
          >
            {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
          </button>
          <span className="text-muted-foreground">·</span>
          {product.is_pod ? (
            <span className="text-xs text-violet-500 font-medium">Made to Order</span>
          ) : (
            <span className="text-xs text-emerald-500 font-medium">Coach Delivery</span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-sm font-medium">
            ${parseFloat(product.price).toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              ${parseFloat(product.compare_at_price!).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>("featured")
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${API_BASE}/api/payments/products/`)

        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.statusText}`)
        }

        const data = await response.json()
        setProducts(data.results || [])
        setFilteredProducts(data.results || [])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load products'
        setError(errorMessage)
        setProducts([])
        setFilteredProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    let filtered = [...products]

    // Filter by tags (Featured, Best Seller, Sale)
    if (selectedTags.length > 0) {
      filtered = filtered.filter(product => {
        const hasDiscount = product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price)
        return selectedTags.some(tag => {
          if (tag === 'featured') return product.featured
          if (tag === 'best_seller') return product.best_selling
          if (tag === 'on_sale') return hasDiscount
          return false
        })
      })
    }

    // Filter by categories (multiple selection)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product => selectedCategories.includes(product.category))
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort products
    switch (sortBy) {
      case "featured":
        filtered.sort((a, b) => {
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          return 0
        })
        break
      case "newest":
        // Assuming higher ID = newer for now
        filtered.sort((a, b) => b.id - a.id)
        break
      case "price_high":
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
        break
      case "price_low":
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
        break
    }

    setFilteredProducts(filtered)
  }, [searchQuery, selectedCategories, selectedTags, sortBy, products])

  // Calculate category counts
  const getCategoryCounts = () => {
    const counts: Record<string, number> = {}
    products.forEach(product => {
      counts[product.category] = (counts[product.category] || 0) + 1
    })
    return counts
  }

  // Calculate tag counts
  const getTagCounts = () => {
    let featured = 0
    let bestSeller = 0
    let onSale = 0
    products.forEach(product => {
      if (product.featured) featured++
      if (product.best_selling) bestSeller++
      if (product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price)) onSale++
    })
    return { featured, best_seller: bestSeller, on_sale: onSale }
  }

  const categoryCounts = getCategoryCounts()
  const tagCounts = getTagCounts()

  const categories: FilterCategory[] = [
    { value: "jersey", label: "Jerseys", count: categoryCounts["jersey"] || 0 },
    { value: "apparel", label: "Apparel", count: categoryCounts["apparel"] || 0 },
    { value: "accessories", label: "Accessories", count: categoryCounts["accessories"] || 0 },
    { value: "equipment", label: "Equipment", count: categoryCounts["equipment"] || 0 },
  ]

  const tags: FilterTag[] = [
    { value: "featured", label: "Featured", count: tagCounts.featured },
    { value: "best_seller", label: "Best Seller", count: tagCounts.best_seller },
    { value: "on_sale", label: "Sale", count: tagCounts.on_sale },
  ]

  // Available colors for filtering
  const filterColors: FilterColor[] = [
    { name: "Black", hex: "#1a1a1a" },
    { name: "Blue", hex: "#2563eb" },
    { name: "Brown", hex: "#92400e" },
    { name: "Green", hex: "#16a34a" },
    { name: "Grey", hex: "#6b7280" },
    { name: "Navy", hex: "#1e3a5f" },
    { name: "Orange", hex: "#ea580c" },
    { name: "Pink", hex: "#ec4899" },
    { name: "Purple", hex: "#9333ea" },
    { name: "Red", hex: "#dc2626" },
    { name: "White", hex: "#ffffff" },
    { name: "Yellow", hex: "#eab308" },
  ]

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const toggleColor = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color)
        ? prev.filter(c => c !== color)
        : [...prev, color]
    )
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedTags([])
    setSelectedColors([])
    setSortBy("featured")
    setSearchQuery("")
  }

  return (
    <LayoutShell>
      <PageHeader
        title="The Locker Room"
        subtitle="Gear up with official NJ Stars merchandise."
      />

      <section className="py-8">
        <div className="container mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Shop" },
            ]}
          />

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sticky Sidebar Filters */}
            <FilterSidebar
              title="Filters"
              searchPlaceholder="Search products..."
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              categories={categories}
              selectedCategories={selectedCategories}
              onCategoryToggle={toggleCategory}
              tags={tags}
              selectedTags={selectedTags}
              onTagToggle={toggleTag}
              colors={filterColors}
              selectedColors={selectedColors}
              onColorToggle={toggleColor}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onClearFilters={clearFilters}
              totalCount={products.length}
              filteredCount={filteredProducts.length}
              getCategoryColor={getCategoryColor}
            />

            {/* Products Grid */}
            <main className="flex-1">
              {error && (
                <div className="mb-8">
                  <ErrorMessage error={error} />
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : !error && filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-lg text-muted-foreground mb-4">
                    {searchQuery || selectedCategories.length > 0 || selectedTags.length > 0
                      ? "No products match your filters."
                      : "No products available at the moment. Check back soon!"}
                  </p>
                  {(searchQuery || selectedCategories.length > 0 || selectedTags.length > 0) && (
                    <>
                      <Button variant="outline" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                      <p className="text-sm text-muted-foreground mt-4">
                        or check out our{" "}
                        <button
                          onClick={() => {
                            clearFilters()
                            toggleTag("featured")
                          }}
                          className="text-secondary underline hover:text-secondary/80"
                        >
                          featured items
                        </button>
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={() => setQuickViewProduct(product)}
                      onTagClick={toggleTag}
                      onCategoryClick={toggleCategory}
                      selectedTags={selectedTags}
                      selectedCategories={selectedCategories}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          open={!!quickViewProduct}
          onOpenChange={(open) => !open && setQuickViewProduct(null)}
        />
      )}
    </LayoutShell>
  )
}
