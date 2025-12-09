"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, ShoppingCart, Loader2, Check, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LayoutShell } from "@/components/layout-shell"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ProductDetailSkeleton } from "@/components/skeletons/product-detail-skeleton"
import { useCart } from "@/lib/cart"

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

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

  const { addToCart } = useCart()

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

  // Generate placeholder images for gallery
  const productImages = product?.image_url
    ? [
        product.image_url,
        `${product.image_url}&seed=1`,
        `${product.image_url}&seed=2`,
        `${product.image_url}&seed=3`,
      ]
    : []

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length)
  }

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length)
  }

  const handleAddToCart = async () => {
    if (!product) return
    setIsAdding(true)
    try {
      await addToCart(product.id, quantity)
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 2000)
    } catch (error) {
      console.error("Failed to add to cart:", error)
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
                    src={productImages[currentImageIndex]}
                    alt={product.name}
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
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all ${
                      index === currentImageIndex
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground/50"
                    }`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <Image src={img} alt={`${product.name} ${index + 1}`} fill className="object-cover" />
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
                className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider ${getCategoryColor(
                  product.category
                )}`}
              >
                {product.category}
              </span>
              {product.featured && (
                <Badge variant="secondary" className="text-xs">
                  Featured
                </Badge>
              )}
              {product.best_selling && (
                <Badge variant="secondary" className="text-xs">
                  Best Seller
                </Badge>
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

            {/* Stock Status */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    product.stock_quantity > 10
                      ? "bg-success"
                      : product.stock_quantity > 0
                      ? "bg-warning"
                      : "bg-destructive"
                  }`}
                />
                <span
                  className={
                    product.stock_quantity > 0 ? "text-foreground" : "text-destructive font-semibold"
                  }
                >
                  {product.stock_quantity > 10
                    ? "In Stock"
                    : product.stock_quantity > 0
                    ? `Only ${product.stock_quantity} left!`
                    : "Out of Stock"}
                </span>
              </div>
            </div>

            {/* Low Stock Warning */}
            {product.stock_quantity > 0 && product.stock_quantity <= 10 && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-warning font-medium">
                  Hurry! Only {product.stock_quantity} left in stock.
                </p>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            {product.stock_quantity > 0 ? (
              <div className="space-y-4">
                {/* Quantity Selector */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 hover:bg-muted transition-colors text-lg"
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <span className="px-6 py-2 border-x min-w-[4rem] text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      className="px-4 py-2 hover:bg-muted transition-colors text-lg"
                      disabled={quantity >= product.stock_quantity}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Adding to Cart...
                    </>
                  ) : justAdded ? (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Add to Cart — ${(parseFloat(product.price) * quantity).toFixed(2)}
                    </>
                  )}
                </Button>
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
    </LayoutShell>
  )
}
