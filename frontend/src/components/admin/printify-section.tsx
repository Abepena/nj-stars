"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface PrintifyProduct {
  id: string
  title: string
  is_published?: boolean
  visible?: boolean
  synced?: boolean
  images?: { src: string }[]
  variants?: { price: number }[]
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
  const [syncingProducts, setSyncingProducts] = useState<Set<string>>(new Set())
  const [syncSummary, setSyncSummary] = useState<{ message?: string; summary?: Record<string, any> } | null>(null)
  const [showAllProducts, setShowAllProducts] = useState(false)

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
    if (!session) return

    setSyncing(true)
    setError(null)
    setSyncSummary(null)

    try {
      const response = await fetch(`${API_BASE}/api/payments/admin/printify/sync/`, {
        method: "POST",
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Sync result:", data)
          setSyncSummary({
            message: data.message || "Sync complete",
            summary: data.summary || data.sync_stats || {},
          })
          setShowAllProducts(true)
        // Refresh products list after successful sync
        await fetchProducts()
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || "Failed to sync products")
      }
    } catch (err) {
      console.error("Failed to sync Printify products:", err)
      setError("Sync failed - check connection")
    } finally {
      setSyncing(false)
    }
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
          message: data.message || "Product synced",
          summary: data.summary || data.sync_stats || {},
        })
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
          <li>Go to your <a href="https://printify.com/app/account/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Printify Account Settings</a></li>
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
        <Button
          variant="outline"
          size="sm"
          onClick={syncProducts}
          disabled={syncing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync from Printify"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open("https://printify.com/app/store", "_blank")}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open Printify Dashboard
        </Button>
      </div>

      {syncSummary && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted border">
          <div className="space-y-1">
            <p className="font-medium text-sm">{syncSummary.message}</p>
            {Object.keys(syncSummary.summary || {}).length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {Object.entries(syncSummary.summary).map(([key, value]) => (
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
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {(showAllProducts ? products : products.slice(0, 10)).map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              {product.images?.[0]?.src ? (
                <img
                  src={product.images[0].src}
                  alt={product.title}
                  className="h-12 w-12 object-cover rounded"
                />
              ) : (
                <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
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
              <div className="flex items-center gap-2">
                {syncing && (
                  <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
                )}
                <Badge variant={product.visible ? "default" : "secondary"}>
                  {product.visible ? "Published" : "Draft"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSyncSingle(product.id)}
                  disabled={syncing || syncingProducts.has(product.id)}
                >
                  {syncingProducts.has(product.id) ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    "Sync to local"
                  )}
                </Button>
              </div>
            </div>
          ))}
          {products.length > 10 && (
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" onClick={() => setShowAllProducts(!showAllProducts)}>
                {showAllProducts ? "Show less" : `View all ${products.length} products`}
              </Button>
            </div>
          )}
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
    </div>
  )

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Shirt className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Printify Store</CardTitle>
                  <CardDescription>
                    {connectionStatus?.connected
                      ? `Connected to ${connectionStatus.shop_name}`
                      : "Manage print-on-demand products"
                    }
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {connectionStatus?.connected && products.length > 0 && (
                  <Badge variant="secondary">
                    {publishedCount} published
                  </Badge>
                )}
                {connectionStatus?.connected ? (
                  <Badge variant="outline" className="text-success border-success">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : connectionStatus !== null && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Not connected
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
