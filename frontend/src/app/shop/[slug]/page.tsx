"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, ShoppingBag, Loader2, Check, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LayoutShell } from "@/components/layout-shell"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ProductDetailSkeleton } from "@/components/skeletons/product-detail-skeleton"
import { useBag } from "@/lib/bag"
import { getCategoryBadgeColor } from "@/lib/category-colors"

interface ProductImage {
  id: number
  url: string
  alt_text: string
  is_primary: boolean
  sort_order: number
}

interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: string
  compare_at_price: string | null
  image_url: string
  primary_image_url: string | null
  images: ProductImage[]
  stock_quantity: number
  category: string
  in_stock: boolean
  featured: boolean
  best_selling?: boolean
  on_sale?: boolean
}

// Variant configuration - mockup data for now
// TODO: This will be fetched from Printify API or local inventory
interface VariantConfig {
  sizes: string[]
  colors: { name: string; hex: string; image?: string }[]
}

const VARIANT_CONFIGS: Record<string, VariantConfig> = {
  jersey: {
    sizes: ["YS", "YM", "YL", "S", "M", "L", "XL", "2XL"],
    colors: [
      { name: "Black", hex: "#1a1a1a" },
      { name: "White", hex: "#ffffff" },
    ],
  },
  apparel: {
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    colors: [
      { name: "Black", hex: "#1a1a1a" },
      { name: "Navy", hex: "#1e3a5f" },
      { name: "Gray", hex: "#6b7280" },
    ],
  },
  accessories: {
    sizes: ["One Size"],
    colors: [
      { name: "Black", hex: "#1a1a1a" },
      { name: "Red", hex: "#dc2626" },
    ],
  },
  equipment: {
    sizes: ["Standard"],
    colors: [],
  },
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"


export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  // Variant selection state
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  const { addToBag } = useBag()

  // Get variant config based on product category
  const variantConfig = product ? VARIANT_CONFIGS[product.category] || VARIANT_CONFIGS.equipment : null

  // Check if variants are required and selected
  const needsSize = variantConfig && variantConfig.sizes.length > 1
  const needsColor = variantConfig && variantConfig.colors.length > 0
  const variantsSelected = (!needsSize || selectedSize) && (!needsColor || selectedColor)

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${API_URL}/api/payments/products/${slug}/`)

        if (!response.ok) {
          if (response.status === 404) {
            setError("Product not found")
          } else {
            throw new Error(`Failed to fetch product: ${response.statusText}`)
          }
          return
        }

        const data = await response.json()
        setProduct(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load product"
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchProduct()
    }
  }, [slug])

  // Build image gallery from uploaded images, falling back to legacy image_url
  const productImages: { url: string; alt: string }[] = (() => {
    if (product?.images && product.images.length > 0) {
      // Use uploaded images from the carousel
      return product.images.map((img) => ({
        url: img.url,
        alt: img.alt_text || product.name,
      }))
    }
    // Fall back to legacy single image
    if (product?.image_url) {
      return [{ url: product.image_url, alt: product.name }]
    }
    return []
  })()

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length)
  }

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length)
  }

  const handleAddToBag = async () => {
    if (!product) return
    setIsAdding(true)
    try {
      await addToBag(product.id, quantity)
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 2000)
    } catch (error) {
      console.error("Failed to add to bag:", error)
    } finally {
      setIsAdding(false)
    }
  }

  if (loading) {
    return (
      <LayoutShell>
        <ProductDetailSkeleton />
      </LayoutShell>
    )
  }

  if (error || !product) {
    return (
      <LayoutShell>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">
            {error === "Product not found" ? "Product Not Found" : "Error Loading Product"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {error === "Product not found"
              ? "The product you're looking for doesn't exist or has been removed."
              : error}
          </p>
          <Button asChild>
            <Link href="/shop">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Shop
            </Link>
          </Button>
        </div>
      </LayoutShell>
    )
  }

  const hasDiscount =
    product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price)
  const discountPercent = hasDiscount
    ? Math.round(
        ((parseFloat(product.compare_at_price!) - parseFloat(product.price)) /
          parseFloat(product.compare_at_price!)) *
          100
      )
    : 0

  return (
    <LayoutShell>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            { label: product.name },
          ]}
        />

        {/* Back Link */}
        <Link
          href="/shop"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to all products
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              {productImages[currentImageIndex] ? (
                <>
                  <Image
                    src={productImages[currentImageIndex].url}
                    alt={productImages[currentImageIndex].alt}
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* Navigation Arrows */}
                  {productImages.length > 1 && (
                    <>
                      <button
                        onClick={previousImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background p-2 rounded-full shadow-lg transition-all"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background p-2 rounded-full shadow-lg transition-all"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Sale Badge */}
                  {hasDiscount && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-accent text-accent-foreground text-sm px-3 py-1">
                        {discountPercent}% OFF
                      </Badge>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full w-full flex items-center justify-center p-8">
                  <Image
                    src="/brand/logos/logo square thick muted.svg"
                    alt={product.name}
                    width={200}
                    height={200}
                    className="opacity-30"
                  />
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {productImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {productImages.map((img, index) => (
                  <button
                    key={img.url}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all ${
                      index === currentImageIndex
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground/50"
                    }`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <Image src={img.url} alt={img.alt} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {/* Category & Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span
                className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider ${getCategoryBadgeColor(
                  product.category
                )}`}
              >
                {product.category}
              </span>
              {product.featured && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/15 text-primary border border-primary/30">
                  Featured
                </span>
              )}
              {product.best_selling && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-secondary/15 text-secondary border border-secondary/30">
                  Best Seller
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">{product.name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold">${parseFloat(product.price).toFixed(2)}</span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    ${parseFloat(product.compare_at_price!).toFixed(2)}
                  </span>
                  <span className="text-sm text-accent font-semibold">Save ${(parseFloat(product.compare_at_price!) - parseFloat(product.price)).toFixed(2)}</span>
                </>
              )}
            </div>

            <Separator className="mb-6" />

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Variant Selection - Size */}
            {variantConfig && variantConfig.sizes.length > 1 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider">Size</h2>
                  {!selectedSize && (
                    <span className="text-xs text-muted-foreground">Select a size</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {variantConfig.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[3rem] px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 border ${
                        selectedSize === size
                          ? "border-primary bg-background text-foreground"
                          : "border-border bg-background text-foreground hover:border-muted-foreground"
                      }`}
                      aria-pressed={selectedSize === size}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {/* Size Guide Link */}
                <button className="mt-2 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
                  Size Guide
                </button>
              </div>
            )}

            {/* Variant Selection - Color */}
            {variantConfig && variantConfig.colors.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider">
                    Color{selectedColor && `: ${selectedColor}`}
                  </h2>
                  {!selectedColor && (
                    <span className="text-xs text-muted-foreground">Select a color</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {variantConfig.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`relative w-10 h-10 rounded-full transition-all duration-200 ${
                        selectedColor === color.name
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      aria-label={color.name}
                      aria-pressed={selectedColor === color.name}
                      title={color.name}
                    >
                      {/* Border for all swatches - visible on both light and dark */}
                      <span className="absolute inset-0 rounded-full border border-border" />
                      {/* Checkmark for selected */}
                      {selectedColor === color.name && (
                        <Check
                          className={`absolute inset-0 m-auto w-5 h-5 ${
                            color.hex === "#ffffff" || color.hex === "#6b7280"
                              ? "text-gray-800"
                              : "text-white"
                          }`}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Separator className="mb-6" />

            {/* Stock Status with Marketing Language */}
            <div className="mb-6">
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

            {/* Urgency Banner - no exact stock counts shown */}
            {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-accent font-semibold flex items-center gap-2">
                  <span className="animate-pulse">🔥</span>
                  Selling fast! Only a few left - grab yours now!
                </p>
              </div>
            )}
            {product.stock_quantity > 5 && product.stock_quantity <= 15 && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-warning font-medium flex items-center gap-2">
                  <span>⚡</span>
                  Limited edition drop - don&apos;t miss out!
                </p>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            {product.stock_quantity > 0 ? (
              <div className="space-y-4">
                {/* Variant selection reminder */}
                {!variantsSelected && (needsSize || needsColor) && (
                  <p className="text-sm text-muted-foreground">
                    Please select {needsSize && !selectedSize ? "a size" : ""}
                    {needsSize && !selectedSize && needsColor && !selectedColor ? " and " : ""}
                    {needsColor && !selectedColor ? "a color" : ""} to continue
                  </p>
                )}

                {/* Quantity Selector */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-muted transition-colors text-lg"
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="px-6 min-h-[44px] flex items-center justify-center border-x min-w-[4rem] text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(10, quantity + 1))}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-muted transition-colors text-lg"
                      disabled={quantity >= 10}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Add to Bag Button - hidden on mobile (covered by sticky footer) */}
                <Button
                  className="w-full hidden lg:flex"
                  size="lg"
                  onClick={handleAddToBag}
                  disabled={isAdding || !variantsSelected}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Adding to Bag...
                    </>
                  ) : justAdded ? (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Added to Bag!
                    </>
                  ) : !variantsSelected ? (
                    <>
                      <ShoppingBag className="mr-2 h-5 w-5" />
                      Select Options
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="mr-2 h-5 w-5" />
                      Add to Bag — ${(parseFloat(product.price) * quantity).toFixed(2)}
                    </>
                  )}
                </Button>

                {/* Selected variant summary - hidden on mobile */}
                {variantsSelected && (selectedSize || selectedColor) && (
                  <p className="text-xs text-muted-foreground text-center hidden lg:block">
                    {selectedColor && `${selectedColor}`}
                    {selectedColor && selectedSize && " / "}
                    {selectedSize && `Size ${selectedSize}`}
                  </p>
                )}
              </div>
            ) : (
              <Button disabled className="w-full" size="lg">
                Out of Stock
              </Button>
            )}

            {/* Additional Info */}
            <Separator className="my-6" />

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                <span>Free shipping on orders over $75</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Official NJ Stars merchandise</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Easy returns within 30 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Add to Cart - like Nike's Add to Bag */}
      {product.stock_quantity > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50">
          <div className="flex items-center gap-3">
            {/* Price display */}
            <div className="flex flex-col">
              <span className="text-lg font-bold">${parseFloat(product.price).toFixed(2)}</span>
              {selectedSize && (
                <span className="text-xs text-muted-foreground">
                  {selectedColor && `${selectedColor} / `}Size {selectedSize}
                </span>
              )}
            </div>

            {/* Add to Bag button */}
            <Button
              className="flex-1 h-12 text-base font-semibold"
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
              ) : !variantsSelected ? (
                "Select Options"
              ) : (
                "Add to Bag"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Spacer for mobile sticky footer */}
      <div className="lg:hidden h-24" />
    </LayoutShell>
  )
}
