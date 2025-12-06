"use client"

import { useState } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckoutButton } from "@/components/checkout-button"

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

interface ProductQuickViewProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Helper function for category colors
function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    jersey: "bg-accent/15 text-accent border border-accent/30",
    apparel: "bg-secondary/15 text-secondary border border-secondary/30",
    accessories: "bg-tertiary/15 text-tertiary border border-tertiary/30",
    equipment: "bg-info/15 text-info border border-info/30",
  }
  return colors[category] || "bg-muted text-muted-foreground border border-border"
}

export function ProductQuickView({ product, open, onOpenChange }: ProductQuickViewProps) {
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

  const hasDiscount = product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price)

  // Handle ESC key
  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Quick view of {product.name} - ${product.price}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Carousel */}
          <div className="relative w-full aspect-square">
            {productImages[currentImageIndex] ? (
              <>
                <Image
                  src={productImages[currentImageIndex]}
                  alt={product.name}
                  fill
                  className="object-cover rounded-lg"
                />
                {/* Carousel Controls */}
                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={previousImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full transition-opacity"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full transition-opacity"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5" />
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
              <div className="h-full w-full bg-muted flex items-center justify-center p-8 relative rounded-lg">
                <Image
                  src="/brand/logos/logo square thick muted.svg"
                  alt={product.name}
                  fill
                  className="opacity-30 object-contain p-8"
                />
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="text-2xl font-bold flex-1">{product.name}</h2>
                <span className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${getCategoryColor(product.category)}`}>
                  {product.category}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-foreground">
                  ${parseFloat(product.price).toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-muted-foreground line-through">
                    ${parseFloat(product.compare_at_price!).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <svg
                  className="w-5 h-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <span className={product.stock_quantity > 0 ? "text-success" : "text-destructive"}>
                  {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
                </span>
              </div>
            </div>

            {product.stock_quantity < 10 && product.stock_quantity > 0 && (
              <div className="bg-warning/10 border border-warning/30 rounded-md p-3 text-sm text-warning">
                ⚠️ Only {product.stock_quantity} left in stock!
              </div>
            )}

            <div className="flex flex-col gap-2 mt-auto pt-4">
              {product.stock_quantity > 0 ? (
                <CheckoutButton
                  productId={product.id}
                  productName={product.name}
                  price={parseFloat(product.price)}
                />
              ) : (
                <Button disabled className="w-full text-accent">
                  Out of Stock
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.location.href = `/shop/${product.slug}`
                }}
              >
                View Full Details
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
