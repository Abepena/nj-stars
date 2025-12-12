"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { LayoutShell } from "@/components/layout-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload, RefreshCw, CheckCircle, AlertCircle, Package } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

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
  const [productId, setProductId] = useState("")
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [products, setProducts] = useState<PrintifyProduct[]>([])
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

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
    }
  }, [session, status, isSuperuser, router])

  const fetchProducts = async () => {
    setIsLoadingProducts(true)
    setMessage(null)
    try {
      const res = await fetch(`${API_BASE}/api/payments/admin/printify/products/`, {
        credentials: "include",
      })
      const data = await res.json()
      if (res.ok) {
        setProducts(data.products || [])
      } else {
        setMessage({ type: "error", text: data.error || "Failed to fetch products" })
      }
    } catch {
      setMessage({ type: "error", text: "Failed to connect to API" })
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handlePublish = async (id?: string) => {
    const targetId = id || productId.trim()
    if (!targetId) {
      setMessage({ type: "error", text: "Please enter a product ID" })
      return
    }

    setIsPublishing(true)
    setMessage(null)
    try {
      const res = await fetch(`${API_BASE}/api/payments/admin/printify/publish/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id: targetId }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: "success", text: data.message || "Product published successfully!" })
        setProductId("")
        // Refresh product list
        fetchProducts()
      } else {
        setMessage({ type: "error", text: data.error || "Failed to publish product" })
      }
    } catch {
      setMessage({ type: "error", text: "Failed to connect to API" })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleSync = async (id?: string) => {
    const targetId = id || productId.trim()
    if (!targetId) {
      setMessage({ type: "error", text: "Please enter a product ID" })
      return
    }

    setIsSyncing(true)
    setMessage(null)
    try {
      const res = await fetch(`${API_BASE}/api/payments/admin/printify/sync/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id: targetId }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({
          type: "success",
          text: `Product "${data.product?.name}" synced! (${data.created ? "Created" : "Updated"})`,
        })
        setProductId("")
      } else {
        setMessage({ type: "error", text: data.error || "Failed to sync product" })
      }
    } catch {
      setMessage({ type: "error", text: "Failed to connect to API" })
    } finally {
      setIsSyncing(false)
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
        <h1 className="text-3xl font-bold mb-2">Printify Admin</h1>
        <p className="text-muted-foreground mb-8">Manage Printify products and sync to shop</p>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                : "bg-red-500/10 text-red-500 border border-red-500/20"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Publish/Sync Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Publish & Sync Product
            </CardTitle>
            <CardDescription>
              Enter a Printify product ID to publish it to the shop or sync it to the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter Printify Product ID (e.g., 693b573a9164dbdf170252cd)"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="flex-1 font-mono text-sm"
              />
              <Button onClick={() => handlePublish()} disabled={isPublishing || !productId.trim()}>
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Publish
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleSync()}
                disabled={isSyncing || !productId.trim()}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products List Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Printify Products
                </CardTitle>
                <CardDescription>All products in your Printify shop</CardDescription>
              </div>
              <Button variant="outline" onClick={fetchProducts} disabled={isLoadingProducts}>
                {isLoadingProducts ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Click refresh to load Printify products</p>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
                      {product.images?.[0]?.src ? (
                        <img
                          src={product.images[0].src}
                          alt={product.title}
                          className="w-full h-full object-cover"
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
                      <p className="text-xs text-muted-foreground font-mono">{product.id}</p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {product.visible ? (
                        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
                          Published
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">
                          Draft
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {!product.visible && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePublish(product.id)}
                          disabled={isPublishing}
                        >
                          Publish
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSync(product.id)}
                        disabled={isSyncing}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  )
}
