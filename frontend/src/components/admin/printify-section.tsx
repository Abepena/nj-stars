"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Shirt,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Package,
  AlertCircle
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface PrintifyProduct {
  id: string
  title: string
  is_published: boolean
  images?: { src: string }[]
  variants?: { price: number }[]
}

export function PrintifyAdminSection() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [products, setProducts] = useState<PrintifyProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const fetchProducts = async () => {
    if (!session) return
    
    setLoading(true)
    setError(null)
    
    try {
      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/payments/printify/products/`, {
        headers: {
          "Authorization": `Token ${apiToken || ""}`,
          "Content-Type": "application/json",
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setProducts(data.results || data || [])
      } else {
        setError("Failed to load products")
      }
    } catch (err) {
      console.error("Failed to fetch Printify products:", err)
      setError("Unable to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const syncProducts = async () => {
    if (!session) return
    
    setSyncing(true)
    
    try {
      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/payments/printify/sync/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${apiToken || ""}`,
          "Content-Type": "application/json",
        },
      })
      
      if (response.ok) {
        await fetchProducts()
      } else {
        setError("Failed to sync products")
      }
    } catch (err) {
      console.error("Failed to sync Printify products:", err)
      setError("Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    if (isOpen && products.length === 0 && !loading) {
      fetchProducts()
    }
  }, [isOpen])

  const publishedCount = products.filter(p => p.is_published).length

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
                    Manage print-on-demand products
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {products.length > 0 && (
                  <Badge variant="secondary">
                    {publishedCount} published
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
          <CardContent className="pt-0 space-y-4">
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

            {/* Error state */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Loading state */}
            {loading && (
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

            {/* Products list */}
            {!loading && products.length > 0 && (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {products.slice(0, 10).map((product) => (
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
                      <p className="text-sm text-muted-foreground">
                        {product.variants?.[0]?.price 
                          ? `$${(product.variants[0].price / 100).toFixed(2)}`
                          : "Price not set"}
                      </p>
                    </div>
                    <Badge variant={product.is_published ? "default" : "secondary"}>
                      {product.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                ))}
                {products.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    And {products.length - 10} more products...
                  </p>
                )}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && products.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No products synced yet</p>
                <p className="text-sm">Click "Sync from Printify" to import products</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
