"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckoutButton } from "@/components/checkout-button"
import { PageHeader } from "@/components/page-header"
import { LayoutShell } from "@/components/layout-shell"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
}

// Product Card with Image Carousel
function ProductCard({ product }: { product: Product }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Generate multiple placeholder images for carousel
  const productImages = [
    product.image_url,
    `${product.image_url}&seed=1`,
    `${product.image_url}&seed=2`,
  ]

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length)
  }

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length)
  }

  return (
    <Card className="overflow-hidden flex flex-col h-[540px] group">
      {/* Image Carousel - 80% of card */}
      <div className="relative h-[432px] w-full">
        {productImages[currentImageIndex] ? (
          <>
            <Image
              src={productImages[currentImageIndex]}
              alt={product.name}
              fill
              className="object-cover"
            />
            {/* Carousel Controls */}
            {productImages.length > 1 && (
              <>
                <button
                  onClick={previousImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {/* Image Indicators */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {productImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-background' : 'bg-background/50'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No Image</span>
          </div>
        )}
      </div>

      {/* Content - 20% of card */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-base line-clamp-1 flex-1">{product.name}</CardTitle>
          <span className="ml-2 px-2 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary whitespace-nowrap">
            {product.category.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <p className="text-xl font-bold">
            ${parseFloat(product.price).toFixed(2)}
          </p>
          {product.stock_quantity < 10 && product.stock_quantity > 0 && (
            <p className="text-xs text-orange-600">
              {product.stock_quantity} left
            </p>
          )}
        </div>

        <div className="mt-2">
          {product.stock_quantity > 0 ? (
            <CheckoutButton
              productId={product.id}
              productName={product.name}
              price={parseFloat(product.price)}
            />
          ) : (
            <Button disabled className="w-full text-primary">
              Out of Stock
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('http://localhost:8000/api/payments/products/')
        const data = await response.json()
        setProducts(data.results)
        setFilteredProducts(data.results)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    let filtered = products

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }, [searchQuery, selectedCategory, products])

  const categories = [
    { value: "all", label: "All Products" },
    { value: "jersey", label: "Jerseys" },
    { value: "apparel", label: "Apparel" },
    { value: "accessories", label: "Accessories" },
    { value: "equipment", label: "Equipment" },
  ]

  return (
    <LayoutShell>
      <PageHeader
        title="Merch Store"
        subtitle="Show your NJ Stars pride with official team merchandise."
      />

      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto mb-8 space-y-4">
            <Input
              type="text"
              placeholder="Search products by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  className={selectedCategory === category.value
                    ? "bg-gradient-to-br from-foreground/40 to-accent text-background font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-transform"
                    : "border-border text-primary hover:bg-gradient-to-br hover:from-foreground/40 hover:to-accent hover:shadow-lg hover:scale-105 transition-all"
                  }
                  size="sm"
                >
                  {category.label}
                </Button>
              ))}
            </div>

            {searchQuery || selectedCategory !== "all" ? (
              <p className="text-sm text-muted-foreground">
                Showing {filteredProducts.length} of {products.length} products
              </p>
            ) : null}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse h-[540px]">
                  <div className="h-[432px] bg-muted"></div>
                  <div className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mt-2"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">
                {searchQuery || selectedCategory !== "all"
                  ? "No products match your search criteria."
                  : "No products available at the moment. Check back soon!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </LayoutShell>
  )
}
