"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { LayoutShell } from "@/components/layout-shell"
import { ErrorMessage } from "@/components/error-message"
import { ProductCardSkeleton } from "@/components/skeletons/product-card-skeleton"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ProductQuickView } from "@/components/product-quick-view"
import { FilterSidebar, type FilterCategory } from "@/components/filter-sidebar"

interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: string
  compare_at_price: string | null
  image_url: string
  stock_quantity: number
  category: string
  in_stock: boolean
  featured: boolean
  best_selling?: boolean
  on_sale?: boolean
}

// Helper function for category colors
function getCategoryColor(category: string, isActive: boolean = false) {
  const colors: Record<string, { active: string; inactive: string }> = {
    jersey: {
      active: "bg-accent/15 text-accent border border-accent/30",
      inactive: "bg-accent/5 text-accent/70 border border-accent/20 hover:bg-accent/10"
    },
    apparel: {
      active: "bg-secondary/15 text-secondary border border-secondary/30",
      inactive: "bg-secondary/5 text-secondary/70 border border-secondary/20 hover:bg-secondary/10"
    },
    accessories: {
      active: "bg-tertiary/15 text-tertiary border border-tertiary/30",
      inactive: "bg-tertiary/5 text-tertiary/70 border border-tertiary/20 hover:bg-tertiary/10"
    },
    equipment: {
      active: "bg-info/15 text-info border border-info/30",
      inactive: "bg-info/5 text-info/70 border border-info/20 hover:bg-info/10"
    },
  }
  const colorSet = colors[category] || { active: "bg-muted text-muted-foreground border border-border", inactive: "bg-muted/30 text-muted-foreground/50 border border-border/30" }
  return isActive ? colorSet.active : colorSet.inactive
}

// Product Card - entire card is clickable to open QuickView
function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const hasDiscount = product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price)

  return (
    <Card
      className="overflow-hidden flex flex-col h-auto cursor-pointer group transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
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
      {/* Image */}
      <div className="relative w-full aspect-square overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center p-8 relative">
            <Image
              src="/brand/logos/logo square thick muted.svg"
              alt={product.name}
              fill
              className="opacity-30 object-contain p-8"
            />
          </div>
        )}

        {/* Tags overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          {product.featured && (
            <Badge className="bg-primary text-primary-foreground text-xs">Featured</Badge>
          )}
          {product.best_selling && (
            <Badge className="bg-secondary text-secondary-foreground text-xs">Best Seller</Badge>
          )}
          {hasDiscount && (
            <Badge className="bg-accent text-accent-foreground text-xs">Sale</Badge>
          )}
        </div>

        {/* Out of stock overlay */}
        {product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-lg font-semibold text-muted-foreground">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <CardTitle className="text-base line-clamp-2 flex-1 group-hover:text-primary transition-colors">
            {product.name}
          </CardTitle>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold">
              ${parseFloat(product.price).toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                ${parseFloat(product.compare_at_price!).toFixed(2)}
              </span>
            )}
          </div>
          <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${getCategoryColor(product.category, true)}`}>
            {product.category}
          </span>
        </div>

        {/* Low stock warning */}
        {product.stock_quantity > 0 && product.stock_quantity < 10 && (
          <p className="text-xs text-warning mt-2">
            Only {product.stock_quantity} left!
          </p>
        )}
      </div>
    </Card>
  )
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('http://localhost:8000/api/payments/products/')

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
    let filtered = products

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

    setFilteredProducts(filtered)
  }, [searchQuery, selectedCategories, products])

  // Calculate category counts
  const getCategoryCounts = () => {
    const counts: Record<string, number> = {}
    products.forEach(product => {
      counts[product.category] = (counts[product.category] || 0) + 1
    })
    return counts
  }

  const categoryCounts = getCategoryCounts()

  const categories: FilterCategory[] = [
    { value: "jersey", label: "Jerseys", count: categoryCounts["jersey"] || 0 },
    { value: "apparel", label: "Apparel", count: categoryCounts["apparel"] || 0 },
    { value: "accessories", label: "Accessories", count: categoryCounts["accessories"] || 0 },
    { value: "equipment", label: "Equipment", count: categoryCounts["equipment"] || 0 },
  ]

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setSearchQuery("")
  }

  return (
    <LayoutShell>
      <PageHeader
        title="Merch Store"
        subtitle="Show your NJ Stars pride with official team merchandise."
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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : !error && filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-xl text-muted-foreground">
                    {searchQuery || selectedCategories.length > 0
                      ? "No products match your search criteria."
                      : "No products available at the moment. Check back soon!"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={() => setQuickViewProduct(product)}
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
