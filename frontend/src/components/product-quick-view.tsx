"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, ShoppingBag, Loader2, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useBag } from "@/lib/bag"
import { getCategoryBadgeColor } from "@/lib/category-colors"

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


export function ProductQuickView({ product, open, onOpenChange }: ProductQuickViewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const { addToBag } = useBag()

  // Generate multiple placeholder images for carousel
  const productImages = [
    product.image_url,
    `${product.image_url}&seed=1`,
    `${product.image_url}&seed=2`,
  ]

  const handleAddToBag = async () => {
    setIsAdding(true)
    try {
      await addToBag(product.id, quantity)
      setJustAdded(true)
      // Start fade out after showing success
      setTimeout(() => {
        setIsFadingOut(true)
        // Close modal after fade animation completes
        setTimeout(() => {
          onOpenChange(false)
          // Reset states after modal closes
          setJustAdded(false)
          setQuantity(1)
          setIsFadingOut(false)
        }, 300)
      }, 600)
    } catch (error) {
      console.error('Failed to add to bag:', error)
    } finally {
      setIsAdding(false)
    }
  }

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
      <DialogContent className={`max-w-3xl max-h-[90vh] overflow-y-auto transition-opacity duration-300 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
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
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                      {productImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label={`View image ${index + 1}`}
                        >
                          <span className={`w-3 h-3 rounded-full transition-colors ${
                            index === currentImageIndex ? 'bg-background' : 'bg-background/50'
                          }`} />
                        </button>
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
                <span className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${getCategoryBadgeColor(product.category)}`}>
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
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    product.stock_quantity > 15
                      ? "bg-success"
                      : product.stock_quantity > 5
                      ? "bg-warning"
                      : product.stock_quantity > 0
                      ? "bg-accent animate-pulse"
                      : "bg-destructive"
                  }`}
                />
                <span
                  className={
                    product.stock_quantity === 0
                      ? "text-destructive font-semibold"
                      : product.stock_quantity <= 5
                      ? "text-accent font-semibold"
                      : "text-foreground"
                  }
                >
                  {product.stock_quantity > 15
                    ? "In Stock"
                    : product.stock_quantity > 5
                    ? "⚡ Limited Drop"
                    : product.stock_quantity > 0
                    ? "🔥 Almost Gone!"
                    : "Out of Stock"}
                </span>
              </div>
            </div>

            {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
              <div className="bg-accent/10 border border-accent/30 rounded-md p-3 text-sm text-accent font-semibold">
                🔥 Selling fast! Only a few left - grab yours now!
              </div>
            )}
            {product.stock_quantity > 5 && product.stock_quantity <= 15 && (
              <div className="bg-warning/10 border border-warning/30 rounded-md p-3 text-sm text-warning font-medium">
                ⚡ Limited edition drop - don&apos;t miss out!
              </div>
            )}

            <div className="flex flex-col gap-3 mt-auto pt-4">
              {/* Quantity Selector */}
              {product.stock_quantity > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center border rounded-md">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-muted transition-colors text-lg"
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="px-4 min-h-[44px] flex items-center justify-center border-x min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-muted transition-colors text-lg"
                      disabled={quantity >= product.stock_quantity}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Add to Bag Button */}
              {product.stock_quantity > 0 ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAddToBag}
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : justAdded ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Added to Bag!
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Add to Bag
                    </>
                  )}
                </Button>
              ) : (
                <Button disabled className="w-full text-accent" size="lg">
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
