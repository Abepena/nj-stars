"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
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
import { shouldSkipImageOptimization } from "@/lib/utils"
import { getColorHex } from "@/lib/color-utils"

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

interface ProductImage {
  id: number
  url: string
  alt_text: string
  is_primary: boolean
  sort_order: number
  printify_variant_ids: number[]
}

type FulfillmentType = 'pod' | 'local'

interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: string
  compare_at_price: string | null
  fulfillment_type?: FulfillmentType
  is_pod?: boolean
  is_local?: boolean
  shipping_estimate?: string
  fulfillment_display?: string
  image_url: string
  primary_image_url: string | null
  images: ProductImage[]
  variants: ProductVariant[]
  available_sizes: string[]
  available_colors: ColorOption[]
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


// Comprehensive size order for Printify variants (smallest to largest)
const SIZE_ORDER: Record<string, number> = {
  // Youth sizes
  'YXS': 1, 'YS': 2, 'YM': 3, 'YL': 4, 'YXL': 5,
  // Adult sizes
  'XS': 10, 'S': 11, 'M': 12, 'L': 13, 'XL': 14,
  '2XL': 15, 'XXL': 15,
  '3XL': 16, 'XXXL': 16,
  '4XL': 17, 'XXXXL': 17,
  '5XL': 18,
  '6XL': 19,
  '7XL': 20,
  '8XL': 21,
  '9XL': 22,
  '10XL': 23,
  // Special sizes
  'ONE SIZE': 50,
}

const SIZE_ALIASES: Record<string, string> = {
  SM: 'S',
  SMALL: 'S',
  SML: 'S',
  MD: 'M',
  MED: 'M',
  MEDIUM: 'M',
  LG: 'L',
  LARGE: 'L',
  XXL: '2XL',
  XXXL: '3XL',
  XXXXL: '4XL',
  XXXXXL: '5XL',
  '2X': '2XL',
  '3X': '3XL',
  '4X': '4XL',
  '5X': '5XL',
}

function normalizeSize(size: string): string {
  const key = size.toUpperCase().trim()
  return SIZE_ALIASES[key] || key
}

function getSizeOrder(size: string): number {
  const normalized = normalizeSize(size)
  return SIZE_ORDER[normalized] ?? 100
}

function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const orderA = getSizeOrder(a)
    const orderB = getSizeOrder(b)
    return orderA - orderB
  })
}

export function ProductQuickView({ product, open, onOpenChange }: ProductQuickViewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [selectedColor, setSelectedColor] = useState<string>("")
  const { addToBag } = useBag()

  // Use actual product variants from API, sort sizes S -> 3XL
  const sizes = sortSizes(product.available_sizes || [])
  const rawColors = product.available_colors || []

  // Find the color associated with the primary image
  const getPrimaryImageColor = (): string | null => {
    if (!product.images?.length || !product.variants?.length) {
      return null
    }
    // Find the primary image (or first image as fallback)
    const primaryImage = product.images.find(img => img.is_primary) || product.images[0]
    if (!primaryImage?.printify_variant_ids?.length) {
      return null
    }
    // Find a variant that matches this image's variant IDs
    const matchingVariant = product.variants.find(v =>
      v.printify_variant_id && primaryImage.printify_variant_ids.includes(v.printify_variant_id)
    )
    return matchingVariant?.color || null
  }

  // Reorder colors so primary image's color is first (leftmost in UI)
  const primaryColor = getPrimaryImageColor()
  const colors = primaryColor
    ? [
        ...rawColors.filter(c => c.name === primaryColor),
        ...rawColors.filter(c => c.name !== primaryColor)
      ]
    : rawColors

  // Check if variants are required and selected
  const needsSize = sizes.length > 0
  const needsColor = colors.length > 0
  const variantsSelected = (!needsSize || selectedSize) && (!needsColor || selectedColor)

  // POD products are always available even with stock_quantity = 0
  const isAvailable = product.is_pod || product.stock_quantity > 0

  // Reset selections when modal opens
  // Auto-select first color (primary image's color, now leftmost)
  // Auto-select size if there's only one option
  useEffect(() => {
    if (open) {
      // Get colors fresh to avoid stale closure
      const freshColors = product.available_colors || []
      const freshSizes = product.available_sizes || []
      const freshPrimaryColor = (() => {
        if (!product.images?.length || !product.variants?.length) return null
        const primaryImage = product.images.find(img => img.is_primary) || product.images[0]
        if (!primaryImage?.printify_variant_ids?.length) return null
        const matchingVariant = product.variants.find(v =>
          v.printify_variant_id && primaryImage.printify_variant_ids.includes(v.printify_variant_id)
        )
        return matchingVariant?.color || null
      })()

      // Reorder so primary color is first
      const orderedColors = freshPrimaryColor
        ? [...freshColors.filter(c => c.name === freshPrimaryColor), ...freshColors.filter(c => c.name !== freshPrimaryColor)]
        : freshColors

      setSelectedColor(orderedColors.length > 0 ? orderedColors[0].name : "")
      // Auto-select size if only one option, otherwise user must select
      setSelectedSize(freshSizes.length === 1 ? freshSizes[0] : "")
      setQuantity(1)
      setCurrentImageIndex(0)
    }
  }, [open, product.id, product.images, product.variants, product.available_colors, product.available_sizes])

  // Reset image index when color changes
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [selectedColor])

  // Build image gallery filtered by selected color
  const productImages: { url: string; alt: string }[] = (() => {
    if (product.images && product.images.length > 0) {
      // Get variant IDs for selected color
      const selectedVariantIds = selectedColor && product.variants
        ? product.variants
            .filter(v => v.color === selectedColor)
            .map(v => v.printify_variant_id)
            .filter((id): id is number => id !== null)
        : []

      // Filter images by selected color's variant IDs
      let filteredImages = product.images
      if (selectedVariantIds.length > 0) {
        const colorImages = product.images.filter(img =>
          img.printify_variant_ids?.some(id => selectedVariantIds.includes(id))
        )
        // Use filtered images if any match, otherwise show all
        if (colorImages.length > 0) {
          filteredImages = colorImages
        }
      }

      return filteredImages.map((img) => ({
        url: img.url,
        alt: img.alt_text || product.name,
      }))
    }
    if (product.primary_image_url || product.image_url) {
      return [{ url: product.primary_image_url || product.image_url, alt: product.name }]
    }
    return []
  })()

  const handleAddToBag = async () => {
    setIsAdding(true)
    try {
      await addToBag(product.id, quantity, selectedSize || undefined, selectedColor || undefined)
      setJustAdded(true)
      setTimeout(() => {
        onOpenChange(false)
        setJustAdded(false)
        setQuantity(1)
      }, 800)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-3xl lg:max-w-4xl max-h-[90vh] md:max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>Quick view of {product.name}</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 max-h-[90vh] md:max-h-[85vh] overflow-y-auto">
          {/* Image & Title/Price (desktop: LHS) */}
          <div className="p-4 md:p-6 flex flex-col">
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              {productImages[currentImageIndex] ? (
                <>
                  <Image
                    src={productImages[currentImageIndex].url}
                    alt={productImages[currentImageIndex].alt}
                    fill
                    className="object-contain"
                    unoptimized={shouldSkipImageOptimization(productImages[currentImageIndex].url)}
                  />
                  {productImages.length > 1 && (
                    <>
                      <button
                        onClick={previousImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background p-2 rounded-full shadow-md transition-all"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background p-2 rounded-full shadow-md transition-all"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      {/* Dots - primary color for active */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {productImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentImageIndex ? 'bg-primary' : 'bg-white/50'
                            }`}
                            aria-label={`View image ${index + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="h-full w-full flex items-center justify-center p-8">
                  <Image
                    src="/brand/logos/logo square thick muted.svg"
                    alt={product.name}
                    width={120}
                    height={120}
                    className="opacity-30"
                  />
                </div>
              )}
            </div>

            {/* Title & Price - below image on desktop */}
            <div className="hidden md:block mt-4">
              <h2 className="text-xl font-bold">{product.name}</h2>
              <p className="text-2xl font-bold text-primary mt-1">
                ${parseFloat(product.price).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Details (RHS on desktop) */}
          <div className="p-6 pt-0 md:pt-6 flex flex-col">
            {/* Title & Price - mobile only (shows at top of RHS) */}
            <div className="md:hidden mb-6">
              <h2 className="text-xl font-bold mb-1">{product.name}</h2>
              <p className="text-2xl font-bold text-primary">
                ${parseFloat(product.price).toFixed(2)}
              </p>
            </div>

            {/* Variants */}
            <div className="space-y-5 flex-1">
              {/* Color Selector */}
              {isAvailable && needsColor && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          selectedColor === color.name
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background border-transparent"
                            : "border-border hover:border-muted-foreground"
                        }`}
                        style={{ backgroundColor: getColorHex(color.name, color.hex) }}
                        title={color.name}
                        aria-label={`Select ${color.name}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {isAvailable && needsSize && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Size
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[2.5rem] px-3 py-1.5 border rounded text-sm font-medium transition-colors ${
                          selectedSize === size
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input hover:bg-muted"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              {isAvailable && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Quantity
                  </label>
                  <div className="inline-flex items-center border rounded">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors text-lg"
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <span className="w-12 h-10 flex items-center justify-center border-x text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.is_pod ? 10 : product.stock_quantity, quantity + 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors text-lg"
                      disabled={quantity >= (product.is_pod ? 10 : product.stock_quantity)}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-3">
              {isAvailable ? (
                <Button
                  className="w-full h-12 text-base font-semibold"
                  onClick={handleAddToBag}
                  disabled={isAdding || !variantsSelected}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Adding...
                    </>
                  ) : justAdded ? (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Added!
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="mr-2 h-5 w-5" />
                      Add to Cart
                    </>
                  )}
                </Button>
              ) : (
                <Button disabled className="w-full h-12" size="lg">
                  Out of Stock
                </Button>
              )}

              <Link
                href={`/shop/${product.slug}`}
                className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                onClick={() => onOpenChange(false)}
              >
                View Full Details
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
