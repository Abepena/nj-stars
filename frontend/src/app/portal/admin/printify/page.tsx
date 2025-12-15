"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { LayoutShell } from "@/components/layout-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { Loader2, RefreshCw, CheckCircle, Package, Eye, EyeOff } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

/**
 * Extract Printify product ID from either:
 * - Raw ID: "693b573a9164dbdf170252cd"
 * - Full URL: "https://printify.com/app/editor/12345/693b573a9164dbdf170252cd"
 * - Editor URL: "https://printify.com/app/products/12345/693b573a9164dbdf170252cd"
 */
function extractProductId(input: string): string {
  const trimmed = input.trim()

  // Check if it's a Printify URL
  if (trimmed.includes('printify.com')) {
    // URL patterns:
    // /app/editor/{shop_id}/{product_id}
    // /app/products/{shop_id}/{product_id}
    // /app/products/{product_id}
    const urlPatterns = [
      /printify\.com\/app\/editor\/\d+\/([a-f0-9]+)/i,
      /printify\.com\/app\/products\/\d+\/([a-f0-9]+)/i,
      /printify\.com\/app\/products\/([a-f0-9]+)/i,
    ]

    for (const pattern of urlPatterns) {
      const match = trimmed.match(pattern)
      if (match) {
        return match[1]
      }
    }

    // If URL but no match, try to get the last path segment that looks like an ID
    const segments = trimmed.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1]
    if (/^[a-f0-9]{20,}$/i.test(lastSegment)) {
      return lastSegment
    }
  }

  // Assume it's already a raw product ID
  return trimmed
}

interface PrintifyProduct {
  id: string
  title: string
  is_locked: boolean
  visible: boolean
  created_at: string
  images: { src: string }[]
}

export default function PrintifyAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const toast = useToast()
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [products, setProducts] = useState<PrintifyProduct[]>([])
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null)
  const [syncingProductId, setSyncingProductId] = useState<string | null>(null)
  const [manualProductId, setManualProductId] = useState("")
  const [isManualLoading, setIsManualLoading] = useState(false)

  // Check if user is superuser
  const isSuperuser = (session?.user as { is_superuser?: boolean })?.is_superuser

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/portal/login")
      return
    }
    if (!isSuperuser) {
      router.push("/portal/dashboard")
      return
    }
    // Auto-load products on mount
    fetchProducts()
  }, [session, status, isSuperuser, router])

  const fetchProducts = async () => {
    setIsLoadingProducts(true)
    try {
      const res = await fetch(`${API_BASE}/api/payments/admin/printify/products/`, {
        credentials: "include",
      })
      const data = await res.json()
      if (res.ok) {
        setProducts(data.products || [])
      } else {
        toast.error(data.error || "Failed to fetch products")
      }
    } catch {
      toast.error("Failed to connect to API")
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handlePublish = async (productId: string) => {
    setLoadingProductId(productId)
    try {
      const res = await fetch(`${API_BASE}/api/payments/admin/printify/publish/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id: productId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Product published successfully!")
        // Update local state
        setProducts(prev =>
          prev.map(p => (p.id === productId ? { ...p, visible: true } : p))
        )
      } else {
        toast.error(data.error || "Failed to publish product")
      }
    } catch {
      toast.error("Failed to connect to API")
    } finally {
      setLoadingProductId(null)
    }
  }

  const handleUnpublish = async (productId: string) => {
    setLoadingProductId(productId)
    try {
      const res = await fetch(`${API_BASE}/api/payments/admin/printify/unpublish/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id: productId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Product unpublished successfully!")
        // Update local state
        setProducts(prev =>
          prev.map(p => (p.id === productId ? { ...p, visible: false } : p))
        )
      } else {
        toast.error(data.error || "Failed to unpublish product")
      }
    } catch {
      toast.error("Failed to connect to API")
    } finally {
      setLoadingProductId(null)
    }
  }

  const handleSync = async (productId: string) => {
    setSyncingProductId(productId)
    try {
      const res = await fetch(`${API_BASE}/api/payments/admin/printify/sync/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id: productId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Product "${data.product?.name}" synced to shop!`)
      } else {
        toast.error(data.error || "Failed to sync product")
      }
    } catch {
      toast.error("Failed to connect to API")
    } finally {
      setSyncingProductId(null)
    }
  }

  const handleManualAction = async (action: "publish" | "unpublish" | "sync") => {
    const rawInput = manualProductId.trim()
    if (!rawInput) {
      toast.error("Please enter a product ID or Printify URL")
      return
    }

    const productId = extractProductId(rawInput)
    if (!productId || !/^[a-f0-9]+$/i.test(productId)) {
      toast.error("Could not extract valid product ID. Enter a Printify URL or product ID.")
      return
    }

    setIsManualLoading(true)
    try {
      const endpoint = action === "sync"
        ? "sync"
        : action === "publish"
          ? "publish"
          : "unpublish"

      const res = await fetch(`${API_BASE}/api/payments/admin/printify/${endpoint}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id: productId }),
      })
      const data = await res.json()
      if (res.ok) {
        const message = action === "sync"
          ? `Product synced: ${data.product?.name}`
          : `Product ${action}ed successfully!`
        toast.success(message)
        setManualProductId("")
        fetchProducts() // Refresh list
      } else {
        toast.error(data.error || `Failed to ${action} product`)
      }
    } catch {
      toast.error("Failed to connect to API")
    } finally {
      setIsManualLoading(false)
    }
  }

  if (status === "loading" || !isSuperuser) {
    return (
      <LayoutShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </LayoutShell>
    )
  }

  return (
    <LayoutShell>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Printify Products</h1>
            <p className="text-muted-foreground">Manage product publishing and sync to shop</p>
          </div>
          <Button variant="outline" onClick={fetchProducts} disabled={isLoadingProducts}>
            {isLoadingProducts ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>

        {/* Manual Product ID Input */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Manual Product Action</CardTitle>
            <CardDescription>
              Paste a Printify product URL or ID to publish, unpublish, or sync
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Paste Printify URL or product ID..."
                value={manualProductId}
                onChange={(e) => setManualProductId(e.target.value)}
                className="flex-1 font-mono text-sm"
                disabled={isManualLoading}
              />
              <Button
                onClick={() => handleManualAction("publish")}
                disabled={isManualLoading || !manualProductId.trim()}
                size="sm"
              >
                {isManualLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                <span className="ml-2">Publish</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleManualAction("unpublish")}
                disabled={isManualLoading || !manualProductId.trim()}
                size="sm"
              >
                <EyeOff className="h-4 w-4" />
                <span className="ml-2">Unpublish</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleManualAction("sync")}
                disabled={isManualLoading || !manualProductId.trim()}
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="ml-2">Sync</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              All Products ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProducts && products.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No products found in Printify</p>
              </div>
            ) : (
              <div className="space-y-2">
                {products.map((product) => {
                  const isLoading = loadingProductId === product.id
                  const isSyncing = syncingProductId === product.id

                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden relative">
                        {product.images?.[0]?.src ? (
                          <Image
                            src={product.images[0].src}
                            alt={product.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.title}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {product.id}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        {product.visible ? (
                          <span className="flex items-center gap-1.5 text-xs bg-green-500/10 text-green-500 px-2.5 py-1 rounded-full">
                            <CheckCircle className="h-3 w-3" />
                            Published
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                            <EyeOff className="h-3 w-3" />
                            Draft
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {product.visible ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnpublish(product.id)}
                            disabled={isLoading}
                            className="min-w-[100px]"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <EyeOff className="h-4 w-4 mr-1.5" />
                                Unpublish
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handlePublish(product.id)}
                            disabled={isLoading}
                            className="min-w-[100px]"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-1.5" />
                                Publish
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSync(product.id)}
                          disabled={isSyncing}
                          title="Sync to shop database"
                        >
                          {isSyncing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  )
}
