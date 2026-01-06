"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Shirt,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Package,
  AlertCircle,
  Link2,
  Link2Off,
  CheckCircle2,
  Key,
  Store,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface PrintifyProduct {
  id: string
  title: string
  is_published?: boolean
  is_locked?: boolean
  visible?: boolean
  synced?: boolean
  images?: { src: string }[]
  price?: number  // Price in cents from Printify
}

interface PrintifyShop {
  id: number
  title: string
  sales_channel: string
}

interface ConnectionStatus {
  connected: boolean
  source: string | null
  shop_id: string | null
  shop_name: string | null
  connected_at: string | null
}

export function PrintifyAdminSection({ defaultOpen = false }: { defaultOpen?: boolean } = {}) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(defaultOpen)

  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)

  // Setup flow state
  const [setupStep, setSetupStep] = useState<'token' | 'shop' | null>(null)
  const [apiToken, setApiToken] = useState("")
  const [shops, setShops] = useState<PrintifyShop[]>([])
  const [selectedShopId, setSelectedShopId] = useState<string>("")
  const [fetchingShops, setFetchingShops] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)

  // Products state (for connected state)
  const [products, setProducts] = useState<PrintifyProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; currentProduct: string } | null>(null)
  const syncCancelledRef = useRef(false)
  const [massUnpublishing, setMassUnpublishing] = useState(false)
  const [unpublishProgress, setUnpublishProgress] = useState<{ current: number; total: number; currentProduct: string } | null>(null)
  const unpublishCancelledRef = useRef(false)
  const [syncingProducts, setSyncingProducts] = useState<Set<string>>(new Set())
  const [publishingProducts, setPublishingProducts] = useState<Set<string>>(new Set())
  const [unlockingProducts, setUnlockingProducts] = useState<Set<string>>(new Set())
  const [removingProducts, setRemovingProducts] = useState<Set<string>>(new Set())
  const [syncSummary, setSyncSummary] = useState<{ message?: string; summary?: Record<string, any> } | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<PrintifyProduct | null>(null)

  const getAuthHeaders = () => {
    const apiToken = (session as any)?.apiToken
    return {
      "Authorization": `Token ${apiToken || ""}`,
      "Content-Type": "application/json",
    }
  }

  const checkConnectionStatus = async () => {
    if (!session) return

    setCheckingStatus(true)
    try {
      const response = await fetch(`${API_BASE}/api/payments/admin/printify/status/`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data)

        // If connected, fetch products
        if (data.connected) {
          await fetchProducts()
        }
      }
    } catch (err) {
      console.error("Failed to check Printify status:", err)
    } finally {
      setCheckingStatus(false)
    }
  }

  const fetchProducts = async () => {
    if (!session) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/payments/admin/printify/products/`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || "Failed to load products from Printify")
      }
    } catch (err) {
      console.error("Failed to fetch Printify products:", err)
      setError("Printify API timeout - try again in a moment")
    } finally {
      setLoading(false)
    }
  }

  const syncProducts = async () => {
    if (!session || products.length === 0) return

    setSyncing(true)
    setError(null)
    setSyncSummary(null)
    syncCancelledRef.current = false

    const syncStats = { synced: 0, failed: 0, skipped: 0 }

    try {
      for (let i = 0; i < products.length; i++) {
        // Check if cancelled
        if (syncCancelledRef.current) {
          syncStats.skipped = products.length - i
          break
        }

        const product = products[i]
        setSyncProgress({
          current: i + 1,
          total: products.length,
          currentProduct: product.title,
        })

        try {
          const response = await fetch(`${API_BASE}/api/payments/admin/printify/sync/`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ product_id: product.id }),
          })

          if (response.ok) {
            syncStats.synced++
          } else {
            syncStats.failed++
          }
        } catch {
          syncStats.failed++
        }
      }

      const wasCancelled = syncCancelledRef.current
      setSyncSummary({
        message: wasCancelled
          ? `Sync cancelled (${syncStats.synced} synced)`
          : `Sync complete`,
        summary: syncStats,
      })
      // Refresh products list after sync
      await fetchProducts()
    } catch (err) {
      setError("Sync failed - check connection")
    } finally {
      setSyncing(false)
      setSyncProgress(null)
      syncCancelledRef.current = false
    }
  }

  const cancelSync = () => {
    syncCancelledRef.current = true
  }

  const massUnpublishProducts = async () => {
    // Filter to visible AND not locked products
    const publishedProducts = products.filter(p => p.visible && !p.is_locked)
    const lockedCount = products.filter(p => p.visible && p.is_locked).length

    if (!session || publishedProducts.length === 0) {
      if (lockedCount > 0) {
        setSyncSummary({
          message: `No products to unpublish`,
          summary: { locked_skipped: lockedCount },
        })
      }
      return
    }

    setMassUnpublishing(true)
    setError(null)
    setSyncSummary(null)
    unpublishCancelledRef.current = false

    const stats = { unpublished: 0, failed: 0, skipped: 0, locked_skipped: lockedCount }

    try {
      for (let i = 0; i < publishedProducts.length; i++) {
        if (unpublishCancelledRef.current) {
          stats.skipped = publishedProducts.length - i
          break
        }

        const product = publishedProducts[i]
        setUnpublishProgress({
          current: i + 1,
          total: publishedProducts.length,
          currentProduct: product.title,
        })

        try {
          const response = await fetch(`${API_BASE}/api/payments/admin/printify/unpublish/`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ product_id: product.id }),
          })

          if (response.ok) {
            stats.unpublished++
            // Update local state
            setProducts((prev) =>
              prev.map((p) => p.id === product.id ? { ...p, visible: false } : p)
            )
          } else {
            stats.failed++
          }
        } catch {
          stats.failed++
        }
      }

      const wasCancelled = unpublishCancelledRef.current
      setSyncSummary({
        message: wasCancelled
          ? `Deactivation cancelled (${stats.unpublished} deactivated)`
          : `Deactivation complete`,
        summary: { deactivated: stats.unpublished, failed: stats.failed, skipped: stats.skipped, locked_skipped: stats.locked_skipped },
      })
    } catch (err) {
      setError("Deactivation failed - check connection")
    } finally {
      setMassUnpublishing(false)
      setUnpublishProgress(null)
      unpublishCancelledRef.current = false
    }
  }

  const cancelUnpublish = () => {
    unpublishCancelledRef.current = true
  }

  const handleSyncSingle = async (productId: string) => {
    if (!session) return

    setError(null)
    setSyncSummary(null)
    setSyncingProducts((prev) => new Set(prev).add(productId))

    try {
      const response = await fetch(`${API_BASE}/api/payments/admin/printify/sync/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId }),
      })

      if (response.ok) {
        const data = await response.json()
        setSyncSummary({
          message: data.message || "Product added to shop",
          summary: data.summary || data.sync_stats || {},
        })
        // Update selected product if it's the one being synced
        setSelectedProduct(prev =>
          prev?.id === productId ? { ...prev, synced: true } : prev
        )
        await fetchProducts()
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || "Failed to sync product")
      }
    } catch (err) {
      console.error("Failed to sync Printify product:", err)
      setError("Sync failed - check connection")
    } finally {
      setSyncingProducts((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }
  }

  const handlePublishToggle = async (productId: string, isCurrentlyPublished: boolean) => {
    if (!session) return

    setError(null)
    setPublishingProducts((prev) => new Set(prev).add(productId))

    const endpoint = isCurrentlyPublished ? "unpublish" : "publish"

    try {
      const response = await fetch(`${API_BASE}/api/payments/admin/printify/${endpoint}/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId }),
      })

      if (response.ok) {
        // Update local state optimistically
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, visible: !isCurrentlyPublished } : p
          )
        )
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || `Failed to ${endpoint} product`)
      }
    } catch (err) {
      console.error(`Failed to ${endpoint} Printify product:`, err)
      setError(`${endpoint} failed - check connection`)
    } finally {
      setPublishingProducts((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }
  }

  const handleUnlockProduct = async (productId: string) => {
    if (!session) return

    setError(null)
    setUnlockingProducts((prev) => new Set(prev).add(productId))

    try {
      const response = await fetch(`${API_BASE}/api/payments/admin/printify/unlock/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId }),
      })

      if (response.ok) {
        // Update local state - product is now unlocked
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, is_locked: false } : p
          )
        )
        setSyncSummary({
          message: "Product unlocked successfully",
          summary: {},
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || "Failed to unlock product")
      }
    } catch (err) {
      console.error("Failed to unlock Printify product:", err)
      setError("Unlock failed - check connection")
    } finally {
      setUnlockingProducts((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }
  }

  const handleRemoveFromLocal = async (productId: string) => {
    if (!session) return

    setError(null)
    setRemovingProducts((prev) => new Set(prev).add(productId))

    try {
      const response = await fetch(`${API_BASE}/api/payments/admin/printify/delete-local/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId }),
      })

      if (response.ok) {
        // Update local state - product is no longer synced
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, synced: false, visible: false } : p
          )
        )
        // Also update selected product if it's the one being removed
        setSelectedProduct(prev =>
          prev?.id === productId ? { ...prev, synced: false, visible: false } : prev
        )
        setSyncSummary({
          message: "Product removed from local database",
          summary: {},
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || "Failed to remove product")
      }
    } catch (err) {
      console.error("Failed to remove product from local database:", err)
      setError("Remove failed - check connection")
    } finally {
      setRemovingProducts((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }
  }

  const fetchShops = async () => {
    if (!apiToken.trim()) {
      setSetupError("Please enter your API token")
      return
    }

    setFetchingShops(true)
    setSetupError(null)

    try {
      const response = await fetch(`${API_BASE}/api/payments/admin/printify/shops/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ api_key: apiToken.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setShops(data.shops || [])

        if (data.shops?.length === 0) {
          setSetupError("No shops found. Please create a shop in Printify first.")
        } else if (data.shops?.length === 1) {
          // Auto-select if only one shop
          setSelectedShopId(String(data.shops[0].id))
          setSetupStep('shop')
        } else {
          setSetupStep('shop')
        }
      } else {
        const data = await response.json()
        setSetupError(data.error || "Invalid API token")
      }
    } catch (err) {
      console.error("Failed to fetch shops:", err)
      setSetupError("Failed to verify token")
    } finally {
      setFetchingShops(false)
    }
  }

  const connectShop = async () => {
    if (!selectedShopId) {
      setSetupError("Please select a shop")
      return
    }

    setConnecting(true)
    setSetupError(null)

    try {
      const response = await fetch(`${API_BASE}/api/payments/admin/printify/connect/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          api_key: apiToken.trim(),
          shop_id: selectedShopId,
        }),
      })

      if (response.ok) {
        // Reset setup state
        setSetupStep(null)
        setApiToken("")
        setShops([])
        setSelectedShopId("")

        // Refresh connection status
        await checkConnectionStatus()
      } else {
        const data = await response.json()
        setSetupError(data.error || "Failed to connect")
      }
    } catch (err) {
      console.error("Failed to connect shop:", err)
      setSetupError("Connection failed")
    } finally {
      setConnecting(false)
    }
  }

  const disconnectShop = async () => {
    if (!confirm("Are you sure you want to disconnect Printify?")) return

    try {
      const response = await fetch(`${API_BASE}/api/payments/admin/printify/disconnect/`, {
        method: "POST",
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        setConnectionStatus(null)
        setProducts([])
        await checkConnectionStatus()
      }
    } catch (err) {
      console.error("Failed to disconnect:", err)
    }
  }

  useEffect(() => {
    if (isOpen && connectionStatus === null && !checkingStatus) {
      checkConnectionStatus()
    }
  }, [isOpen])

  const publishedCount = products.filter(p => p.visible).length
  const unpublishableCount = products.filter(p => p.visible && !p.is_locked).length
  const lockedPublishedCount = products.filter(p => p.visible && p.is_locked).length

  // Render setup flow
  const renderSetupFlow = () => (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h4 className="font-medium flex items-center gap-2">
          <Key className="h-4 w-4" />
          Connect Your Printify Store
        </h4>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>Go to your <a href="https://printify.com/app/account/api" target="_blank" rel="noopener noreferrer" className="text-foreground underline hover:text-muted-foreground">Printify Account Settings</a></li>
          <li>Navigate to <strong>Connections</strong> in the sidebar</li>
          <li>Click <strong>Generate new token</strong> under API access</li>
          <li>Copy the token and paste it below</li>
        </ol>
      </div>

      {/* Step 1: API Token */}
      <div className="space-y-3">
        <Label htmlFor="api-token">API Token</Label>
        <div className="flex gap-2">
          <Input
            id="api-token"
            type="password"
            placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOi..."
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            className="font-mono text-sm"
            disabled={setupStep === 'shop'}
          />
          {setupStep !== 'shop' && (
            <Button
              onClick={fetchShops}
              disabled={fetchingShops || !apiToken.trim()}
              variant="success"
            >
              {fetchingShops ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Verify <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Step 2: Shop Selection */}
      {setupStep === 'shop' && shops.length > 0 && (
        <div className="space-y-3">
          <Label htmlFor="shop-select">Select Shop</Label>
          <div className="flex gap-2">
            <Select value={selectedShopId} onValueChange={setSelectedShopId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choose a shop..." />
              </SelectTrigger>
              <SelectContent>
                {shops.map((shop) => (
                  <SelectItem key={shop.id} value={String(shop.id)}>
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      {shop.title}
                      <span className="text-muted-foreground text-xs">
                        ({shop.sales_channel})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={connectShop}
              disabled={connecting || !selectedShopId}
              variant="success"
            >
              {connecting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-1" />
                  Connect
                </>
              )}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSetupStep(null)
              setShops([])
              setSelectedShopId("")
            }}
          >
            ← Use different token
          </Button>
        </div>
      )}

      {/* Error display */}
      {setupError && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{setupError}</span>
        </div>
      )}
    </div>
  )

  // Render connected state
  const renderConnectedState = () => (
    <div className="space-y-4">
      {/* Connection info */}
      <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <div>
            <p className="font-medium">{connectionStatus?.shop_name}</p>
            <p className="text-sm text-muted-foreground">
              Shop ID: {connectionStatus?.shop_id}
              {connectionStatus?.source === 'environment' && (
                <span className="ml-2 text-xs">(via environment)</span>
              )}
            </p>
          </div>
        </div>
        {connectionStatus?.source === 'database' && (
          <Button variant="ghost" size="sm" onClick={disconnectShop}>
            <Link2Off className="h-4 w-4 mr-1" />
            Disconnect
          </Button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {syncing ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={cancelSync}
          >
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Cancel ({syncProgress?.current}/{syncProgress?.total})
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={syncProducts}
            disabled={products.length === 0 || massUnpublishing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All from Printify
          </Button>
        )}
        {massUnpublishing ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={cancelUnpublish}
          >
            <EyeOff className="h-4 w-4 mr-2 animate-pulse" />
            Cancel ({unpublishProgress?.current}/{unpublishProgress?.total})
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={massUnpublishProducts}
            disabled={unpublishableCount === 0 || syncing}
            title={lockedPublishedCount > 0 ? `${lockedPublishedCount} locked product(s) will be skipped` : undefined}
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Deactivate All ({unpublishableCount}{lockedPublishedCount > 0 ? ` +${lockedPublishedCount} locked` : ""})
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open("https://printify.com/app/store", "_blank")}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open Printify Dashboard
        </Button>
      </div>

      {/* Sync progress indicator */}
      {syncProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground truncate flex-1 mr-2">
              Syncing: {syncProgress.currentProduct}
            </span>
            <span className="text-muted-foreground whitespace-nowrap">
              {syncProgress.current} of {syncProgress.total}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-foreground h-2 rounded-full transition-all duration-300"
              style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Deactivate progress indicator */}
      {unpublishProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground truncate flex-1 mr-2">
              Deactivating: {unpublishProgress.currentProduct}
            </span>
            <span className="text-muted-foreground whitespace-nowrap">
              {unpublishProgress.current} of {unpublishProgress.total}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-destructive h-2 rounded-full transition-all duration-300"
              style={{ width: `${(unpublishProgress.current / unpublishProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {syncSummary && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted border">
          <div className="space-y-1">
            <p className="font-medium text-sm">{syncSummary.message}</p>
            {Object.keys(syncSummary.summary || {}).length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {Object.entries(syncSummary.summary || {}).map(([key, value]) => (
                  <Badge key={key} variant="outline">
                    {key.replace(/_/g, " ")}: {String(value)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSyncSummary(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-between gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null)
              fetchProducts()
            }}
            className="shrink-0"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading state - only show on initial load, not during sync */}
      {loading && !syncing && products.length === 0 && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products list - show during sync too */}
      {products.length > 0 && (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              {/* Product info row - clickable */}
              <div
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                onClick={() => setSelectedProduct(product)}
              >
                {product.images?.[0]?.src ? (
                  <img
                    src={product.images[0].src}
                    alt={product.title}
                    className="h-12 w-12 object-cover rounded flex-shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.title}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    {syncing ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      product.synced ? "Synced" : "Not synced"
                    )}
                  </p>
                </div>
                {/* Badges shown inline on mobile */}
                <div className="flex items-center gap-1 sm:hidden flex-shrink-0">
                  {product.is_locked && (
                    <Badge variant="outline" className="text-amber-500 border-amber-500">
                      <Lock className="h-3 w-3" />
                    </Badge>
                  )}
                  <Badge variant={product.visible ? "success" : "destructive"} className={product.visible ? "" : "bg-destructive/20 text-destructive hover:bg-destructive/30"}>
                    {product.visible ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              {/* Actions row - stacks below on mobile */}
              <div className="flex items-center gap-2 pl-15 sm:pl-0">
                {syncing && (
                  <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
                )}
                {/* Badges hidden on mobile, shown on desktop */}
                {product.is_locked && (
                  <Badge variant="outline" className="hidden sm:inline-flex text-amber-500 border-amber-500">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                )}
                <Badge variant={product.visible ? "success" : "destructive"} className={`hidden sm:inline-flex ${product.visible ? "" : "bg-destructive/20 text-destructive hover:bg-destructive/30"}`}>
                  {product.visible ? "Active" : "Inactive"}
                </Badge>
                {/* Unlock button - shown when product is locked */}
                {product.is_locked && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnlockProduct(product.id)}
                    disabled={syncing || unlockingProducts.has(product.id)}
                    title="Unlock product to allow editing/deactivating"
                    className="text-amber-500 hover:text-amber-600"
                  >
                    {unlockingProducts.has(product.id) ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Unlock className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Unlock</span>
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant={product.visible ? "outline" : "success"}
                  size="sm"
                  onClick={() => handlePublishToggle(product.id, !!product.visible)}
                  disabled={syncing || publishingProducts.has(product.id) || product.is_locked}
                  title={product.is_locked ? "Unlock product first" : product.visible ? "Hide from store" : "Show on store"}
                >
                  {publishingProducts.has(product.id) ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : product.visible ? (
                    <>
                      <EyeOff className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Deactivate</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Activate</span>
                    </>
                  )}
                </Button>
                {product.synced ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveFromLocal(product.id)}
                    disabled={syncing || removingProducts.has(product.id)}
                    title="Remove from local shop"
                    className="text-destructive hover:text-destructive"
                  >
                    {removingProducts.has(product.id) ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Remove</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncSingle(product.id)}
                    disabled={syncing || syncingProducts.has(product.id)}
                    title="Add to local shop"
                  >
                    {syncingProducts.has(product.id) ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Add to Shop</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && products.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No products found</p>
          <p className="text-sm">Create products in Printify, then sync them here</p>
        </div>
      )}

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8">{selectedProduct.title}</DialogTitle>
              </DialogHeader>

              {/* Large Product Image */}
              <div className="relative aspect-square w-full bg-muted rounded-lg overflow-hidden">
                {selectedProduct.images?.[0]?.src ? (
                  <img
                    src={selectedProduct.images[0].src}
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* Price & Status */}
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">
                  {selectedProduct.price
                    ? `$${(selectedProduct.price / 100).toFixed(2)}`
                    : "Price not set"
                  }
                </div>
                <div className="flex items-center gap-2">
                  {selectedProduct.is_locked && (
                    <Badge variant="outline" className="text-amber-500 border-amber-500">
                      <Lock className="h-3 w-3 mr-1" />
                      Locked
                    </Badge>
                  )}
                  <Badge
                    variant={selectedProduct.visible ? "success" : "destructive"}
                    className={selectedProduct.visible ? "" : "bg-destructive/20 text-destructive"}
                  >
                    {selectedProduct.visible ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">
                    {selectedProduct.synced ? "Synced" : "Not synced"}
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                {/* Unlock button if locked */}
                {selectedProduct.is_locked && (
                  <Button
                    variant="outline"
                    onClick={() => handleUnlockProduct(selectedProduct.id)}
                    disabled={unlockingProducts.has(selectedProduct.id)}
                    className="w-full text-amber-500 hover:text-amber-600 focus-visible:ring-muted-foreground"
                  >
                    {unlockingProducts.has(selectedProduct.id) ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Unlock className="h-4 w-4 mr-2" />
                    )}
                    Unlock Product
                  </Button>
                )}

                {/* Activate/Deactivate button */}
                <Button
                  variant={selectedProduct.visible ? "outline" : "success"}
                  onClick={() => {
                    handlePublishToggle(selectedProduct.id, !!selectedProduct.visible)
                    // Update the selected product state to reflect the change
                    setSelectedProduct(prev => prev ? { ...prev, visible: !prev.visible } : null)
                  }}
                  disabled={publishingProducts.has(selectedProduct.id) || selectedProduct.is_locked}
                  className="w-full focus-visible:ring-muted-foreground"
                >
                  {publishingProducts.has(selectedProduct.id) ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : selectedProduct.visible ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Deactivate from Store
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Activate on Store
                    </>
                  )}
                </Button>

                {/* Add to Shop / Remove from Shop button */}
                {selectedProduct.synced ? (
                  <Button
                    variant="outline"
                    onClick={() => handleRemoveFromLocal(selectedProduct.id)}
                    disabled={removingProducts.has(selectedProduct.id)}
                    className="w-full focus-visible:ring-muted-foreground text-destructive hover:text-destructive"
                  >
                    {removingProducts.has(selectedProduct.id) ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Remove from Shop
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleSyncSingle(selectedProduct.id)}
                    disabled={syncingProducts.has(selectedProduct.id)}
                    className="w-full focus-visible:ring-muted-foreground"
                  >
                    {syncingProducts.has(selectedProduct.id) ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add to Shop
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between gap-2">
              {/* Left: Icon + Title */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Shirt className="h-5 w-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-lg">Printify Store</CardTitle>
                  <CardDescription className="truncate">
                    {connectionStatus?.connected
                      ? `Connected to ${connectionStatus.shop_name}`
                      : "Manage print-on-demand products"
                    }
                  </CardDescription>
                </div>
              </div>
              {/* Right: Status badges + chevron */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Active count - hidden on mobile */}
                {connectionStatus?.connected && products.length > 0 && (
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    {publishedCount} active
                  </Badge>
                )}
                {/* Connection status */}
                {connectionStatus?.connected ? (
                  <Badge variant="outline" className="text-success border-success">
                    <CheckCircle2 className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline">Connected</span>
                  </Badge>
                ) : connectionStatus !== null && (
                  <Badge variant="outline" className="text-muted-foreground">
                    <span className="hidden sm:inline">Not connected</span>
                    <span className="sm:hidden">—</span>
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {checkingStatus ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : connectionStatus?.connected ? (
              renderConnectedState()
            ) : (
              renderSetupFlow()
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
