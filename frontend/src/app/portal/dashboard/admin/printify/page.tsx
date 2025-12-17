"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { LayoutShell } from "@/components/layout-shell"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, RefreshCw, CheckCircle, Package, Eye, EyeOff, Download, Trash2, ExternalLink, Database, Lock, Unlock } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

/**
 * Extract Printify product ID from either:
 * - Raw ID: "693b573a9164dbdf170252cd"
 * - Full URL: "https://printify.com/app/editor/12345/693b573a9164dbdf170252cd"
 * - Editor URL: "https://printify.com/app/products/12345/693b573a9164dbdf170252cd"
 */
function extractProductId(input: string): string {
  const trimmed = input.trim()

  if (trimmed.includes('printify.com')) {
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

    const segments = trimmed.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1]
    if (/^[a-f0-9]{20,}$/i.test(lastSegment)) {
      return lastSegment
    }
  }

  return trimmed
}

interface PrintifyProduct {
  id: string
  title: string
  is_locked: boolean
  visible: boolean
  created_at: string
  images: { src: string }[]
  synced: boolean
  local_slug: string | null
  local_name: string | null
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<PrintifyProduct | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [unlockingProductId, setUnlockingProductId] = useState<string | null>(null)
  const [deletePrintifyDialogOpen, setDeletePrintifyDialogOpen] = useState(false)
  const [productToDeleteFromPrintify, setProductToDeleteFromPrintify] = useState<PrintifyProduct | null>(null)
  const [isDeletingFromPrintify, setIsDeletingFromPrintify] = useState(false)
  
  // Bulk selection state
  const [selectedUnsynced, setSelectedUnsynced] = useState<Set<string>>(new Set())
  const [selectedSynced, setSelectedSynced] = useState<Set<string>>(new Set())
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)

  const isSuperuser = (session?.user as { is_superuser?: boolean })?.is_superuser

  const getAuthHeaders = (): Record<string, string> => {
    const apiToken = (session as any)?.apiToken
    return {
      "Content-Type": "application/json",
      ...(apiToken && { Authorization: `Token ${apiToken}` }),
    }
  }

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
    fetchProducts()
  }, [session, status, isSuperuser, router])

  const fetchProducts = async () => {
    setIsLoadingProducts(true)
    try {
      const res = await fetch(`${API_BASE}/api/payments/admin/printify/products/`, {
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Product published successfully!")
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Product unpublished successfully!")
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

  const handleUnlock = async (productId: string) => {
    setUnlockingProductId(productId)
    try {
      const res = await fetch(`${API_BASE}/api/payments/admin/printify/unlock/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Product unlocked! You can now unpublish or edit it.")
        // Update the product in state to show it's no longer locked
        setProducts(prev =>
          prev.map(p => (p.id === productId ? { ...p, is_locked: false } : p))
        )
      } else {
        toast.error(data.error || "Failed to unlock product")
      }
    } catch {
      toast.error("Failed to connect to API")
    } finally {
      setUnlockingProductId(null)
    }
  }

  const handleDeleteFromPrintify = async () => {
    if (!productToDeleteFromPrintify) return
    setIsDeletingFromPrintify(true)
    try {
      const res = await fetch(`${API_BASE}/api/payments/admin/printify/delete-product/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productToDeleteFromPrintify.id }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Product deleted from Printify" + (data.local_deleted ? " and local shop" : ""))
        setProducts(prev => prev.filter(p => p.id !== productToDeleteFromPrintify.id))
        setDeletePrintifyDialogOpen(false)
        setProductToDeleteFromPrintify(null)
      } else {
        toast.error(data.error || "Failed to delete from Printify")
      }
    } catch {
      toast.error("Failed to connect to API")
    } finally {
      setIsDeletingFromPrintify(false)
    }
  }

  // Bulk selection helpers
  const toggleSelectUnsynced = (id: string) => {
    setSelectedUnsynced(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectSynced = (id: string) => {
    setSelectedSynced(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllUnsynced = () => {
    if (selectedUnsynced.size === unsyncedProducts.length) {
      setSelectedUnsynced(new Set())
    } else {
      setSelectedUnsynced(new Set(unsyncedProducts.map(p => p.id)))
    }
  }

  const selectAllSynced = () => {
    if (selectedSynced.size === syncedProducts.length) {
      setSelectedSynced(new Set())
    } else {
      setSelectedSynced(new Set(syncedProducts.map(p => p.id)))
    }
  }

  // Bulk actions
  const handleBulkSync = async () => {
    if (selectedUnsynced.size === 0) return
    setIsBulkProcessing(true)
    let successCount = 0
    let failCount = 0
    
    for (const productId of selectedUnsynced) {
      try {
        const res = await fetch(`${API_BASE}/api/payments/admin/printify/sync-and-unpublish/`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ product_id: productId }),
        })
        if (res.ok) {
          const data = await res.json()
          setProducts(prev =>
            prev.map(p => p.id === productId ? { ...p, synced: true, local_slug: data.product?.slug, local_name: data.product?.name } : p)
          )
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }
    
    setSelectedUnsynced(new Set())
    setIsBulkProcessing(false)
    toast.success(`Synced ${successCount} products${failCount > 0 ? `, ${failCount} failed` : ""}`)
  }

  const handleBulkDeleteLocal = async () => {
    if (selectedSynced.size === 0) return
    setIsBulkProcessing(true)
    let successCount = 0
    let failCount = 0
    
    for (const productId of selectedSynced) {
      try {
        const res = await fetch(`${API_BASE}/api/payments/admin/printify/delete-local/`, {
          method: "DELETE",
          headers: getAuthHeaders(),
          body: JSON.stringify({ product_id: productId }),
        })
        if (res.ok) {
          setProducts(prev =>
            prev.map(p => p.id === productId ? { ...p, synced: false, local_slug: null, local_name: null } : p)
          )
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }
    
    setSelectedSynced(new Set())
    setIsBulkProcessing(false)
    toast.success(`Removed ${successCount} from shop${failCount > 0 ? `, ${failCount} failed` : ""}`)
  }

  const handleBulkDeletePrintify = async (selectedIds: Set<string>) => {
    if (selectedIds.size === 0) return
    setIsBulkProcessing(true)
    let successCount = 0
    let failCount = 0
    
    for (const productId of selectedIds) {
      try {
        const res = await fetch(`${API_BASE}/api/payments/admin/printify/delete-product/`, {
          method: "DELETE",
          headers: getAuthHeaders(),
          body: JSON.stringify({ product_id: productId }),
        })
        if (res.ok) {
          setProducts(prev => prev.filter(p => p.id !== productId))
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }
    
    setSelectedUnsynced(new Set())
    setSelectedSynced(new Set())
    setIsBulkProcessing(false)
    toast.success(`Deleted ${successCount} from Printify${failCount > 0 ? `, ${failCount} failed` : ""}`)
  }

  const handleSync = async (productId: string) => {
    setSyncingProductId(productId)
    try {
      const res = await fetch(`${API_BASE}/api/payments/admin/printify/sync/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Product "${data.product?.name}" synced to shop!`)
        setProducts(prev =>
          prev.map(p => (p.id === productId ? {
            ...p,
            synced: true,
            local_slug: data.product?.slug,
            local_name: data.product?.name
          } : p))
        )
      } else {
        toast.error(data.error || "Failed to sync product")
      }
    } catch {
      toast.error("Failed to connect to API")
    } finally {
      setSyncingProductId(null)
    }
  }

  const handleSyncAndUnpublish = async (productId: string) => {
    setSyncingProductId(productId)
    try {
      const res = await fetch(`${API_BASE}/api/payments/admin/printify/sync-and-unpublish/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId }),
      })
      const data = await res.json()
      if (res.ok) {
        const unpublishNote = data.unpublished
          ? " and unpublished from Printify"
          : " (but couldn't unpublish from Printify)"
        toast.success(`Product "${data.product?.name}" synced to shop${unpublishNote}!`)
        setProducts(prev =>
          prev.map(p => (p.id === productId ? {
            ...p,
            synced: true,
            visible: !data.unpublished,
            local_slug: data.product?.slug,
            local_name: data.product?.name
          } : p))
        )
      } else {
        toast.error(data.error || "Failed to sync product")
      }
    } catch {
      toast.error("Failed to connect to API")
    } finally {
      setSyncingProductId(null)
    }
  }

  const handleDeleteLocal = async () => {
    if (!productToDelete) return

    setIsDeleting(true)
    try {
      const res = await fetch(`${API_BASE}/api/payments/admin/printify/delete-local/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productToDelete.id }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Product "${data.deleted_product?.name}" removed from local database`)
        setProducts(prev =>
          prev.map(p => (p.id === productToDelete.id ? {
            ...p,
            synced: false,
            local_slug: null,
            local_name: null
          } : p))
        )
      } else {
        toast.error(data.error || "Failed to delete product")
      }
    } catch {
      toast.error("Failed to connect to API")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setProductToDelete(null)
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId }),
      })
      const data = await res.json()
      if (res.ok) {
        const message = action === "sync"
          ? `Product synced: ${data.product?.name}`
          : `Product ${action}ed successfully!`
        toast.success(message)
        setManualProductId("")
        fetchProducts()
      } else {
        toast.error(data.error || `Failed to ${action} product`)
      }
    } catch {
      toast.error("Failed to connect to API")
    } finally {
      setIsManualLoading(false)
    }
  }

  // Separate products into synced and unsynced
  const unsyncedProducts = products.filter(p => !p.synced)
  const syncedProducts = products.filter(p => p.synced)

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
            <h1 className="text-2xl md:text-3xl font-bold">Printify Products</h1>
            <p className="text-muted-foreground text-sm md:text-base">Manage product publishing and sync</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchProducts} disabled={isLoadingProducts}>
            {isLoadingProducts ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Manual Product ID Input */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Manual Product Action</CardTitle>
            <CardDescription className="text-sm">
              Paste a Printify product URL or ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Printify URL or product ID..."
                value={manualProductId}
                onChange={(e) => setManualProductId(e.target.value)}
                className="flex-1 font-mono text-sm"
                disabled={isManualLoading}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleManualAction("publish")}
                  disabled={isManualLoading || !manualProductId.trim()}
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  {isManualLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  <span className="ml-2">Publish</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleManualAction("unpublish")}
                  disabled={isManualLoading || !manualProductId.trim()}
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <EyeOff className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Hide</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleManualAction("sync")}
                  disabled={isManualLoading || !manualProductId.trim()}
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Sync</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unsynced Products - Products in Printify but NOT in our database */}
        {unsyncedProducts.length > 0 && (
          <Card className="mb-8 border-amber-500/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-amber-500">
                  <Download className="h-5 w-5" />
                  Not in Shop Database ({unsyncedProducts.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all-unsynced"
                    checked={selectedUnsynced.size === unsyncedProducts.length && unsyncedProducts.length > 0}
                    onCheckedChange={selectAllUnsynced}
                  />
                  <label htmlFor="select-all-unsynced" className="text-xs text-muted-foreground cursor-pointer">
                    Select all
                  </label>
                </div>
              </div>
              <CardDescription className="text-sm">
                Products in Printify not yet synced. Click &quot;Sync&quot; to import.
              </CardDescription>
              {selectedUnsynced.size > 0 && (
                <div className="flex items-center gap-2 mt-3 p-2 bg-amber-500/10 rounded-lg">
                  <span className="text-sm font-medium text-amber-500">{selectedUnsynced.size} selected</span>
                  <div className="flex-1" />
                  <Button
                    size="sm"
                    onClick={handleBulkSync}
                    disabled={isBulkProcessing}
                    className="bg-amber-600 hover:bg-amber-700 h-7 text-xs"
                  >
                    {isBulkProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
                    Sync Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkDeletePrintify(selectedUnsynced)}
                    disabled={isBulkProcessing}
                    className="h-7 text-xs"
                  >
                    {isBulkProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                    Delete Selected
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unsyncedProducts.map((product) => {
                  const isSyncing = syncingProductId === product.id

                  return (
                    <div
                      key={product.id}
                      className={`p-3 rounded-lg border ${selectedUnsynced.has(product.id) ? 'border-amber-500 bg-amber-500/10' : 'border-amber-500/30 bg-amber-500/5'}`}
                    >
                      {/* Mobile: Stack layout */}
                      <div className="flex gap-3 items-start">
                        {/* Checkbox */}
                        <div className="flex-shrink-0 pt-1">
                          <Checkbox
                            checked={selectedUnsynced.has(product.id)}
                            onCheckedChange={() => toggleSelectUnsynced(product.id)}
                          />
                        </div>
                        {/* Thumbnail */}
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden relative">
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
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Info + Badge */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.title}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {product.id}
                          </p>
                          {/* Badge inline on mobile */}
                          <div className="mt-1.5">
                            {product.visible ? (
                              <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                                <Eye className="h-3 w-3" />
                                Visible
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                <EyeOff className="h-3 w-3" />
                                Draft
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex-shrink-0 flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleSyncAndUnpublish(product.id)}
                            disabled={isSyncing}
                            className="bg-amber-600 hover:bg-amber-700 h-8 px-2 md:px-3"
                          >
                            {isSyncing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Download className="h-4 w-4" />
                                <span className="ml-1.5 hidden sm:inline">Sync</span>
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setProductToDeleteFromPrintify(product)
                              setDeletePrintifyDialogOpen(true)
                            }}
                            title="Delete from Printify"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Synced Products List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                In Shop Database ({syncedProducts.length})
              </CardTitle>
              {syncedProducts.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all-synced"
                    checked={selectedSynced.size === syncedProducts.length && syncedProducts.length > 0}
                    onCheckedChange={selectAllSynced}
                  />
                  <label htmlFor="select-all-synced" className="text-xs text-muted-foreground cursor-pointer">
                    Select all
                  </label>
                </div>
              )}
            </div>
            <CardDescription className="text-sm">
              Products synced to your local database.
            </CardDescription>
            {selectedSynced.size > 0 && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-muted rounded-lg">
                <span className="text-sm font-medium">{selectedSynced.size} selected</span>
                <div className="flex-1" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDeleteLocal}
                  disabled={isBulkProcessing}
                  className="h-7 text-xs"
                >
                  {isBulkProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Database className="h-3 w-3 mr-1" />}
                  Remove from Shop
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkDeletePrintify(selectedSynced)}
                  disabled={isBulkProcessing}
                  className="h-7 text-xs"
                >
                  {isBulkProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                  Delete from Printify
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingProducts && products.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : syncedProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No synced products yet</p>
                <p className="text-sm mt-1">Sync products from the list above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {syncedProducts.map((product) => {
                  const isLoading = loadingProductId === product.id
                  const isSyncing = syncingProductId === product.id

                  return (
                    <div
                      key={product.id}
                      className={`p-3 rounded-lg border ${selectedSynced.has(product.id) ? 'border-primary bg-primary/5' : 'bg-card'}`}
                    >
                      {/* Row 1: Thumbnail + Info + Actions (desktop) */}
                      <div className="flex gap-3 items-start">
                        {/* Checkbox */}
                        <div className="flex-shrink-0 pt-1">
                          <Checkbox
                            checked={selectedSynced.has(product.id)}
                            onCheckedChange={() => toggleSelectSynced(product.id)}
                          />
                        </div>
                        {/* Thumbnail */}
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden relative">
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
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.title}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate hidden sm:block">
                            {product.id}
                          </p>
                          {product.local_slug && (
                            <a
                              href={`/shop/${product.local_slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                            >
                              View in shop <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-2">
                          {/* Status Badges */}
                          <span className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full">
                            <CheckCircle className="h-3 w-3" />
                            Synced
                          </span>
                          {product.visible ? (
                            <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full">
                              <Eye className="h-3 w-3" />
                              Available
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                              <EyeOff className="h-3 w-3" />
                              Draft
                            </span>
                          )}
                          {product.is_locked && (
                            <span className="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full" title="Product is locked in Printify">
                              <Lock className="h-3 w-3" />
                              Locked
                            </span>
                          )}
                          {product.is_locked && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnlock(product.id)}
                              disabled={unlockingProductId === product.id}
                              className="h-8 border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                              title="Unlock to allow unpublishing"
                            >
                              {unlockingProductId === product.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Unlock className="h-4 w-4 mr-1" />
                                  Unlock
                                </>
                              )}
                            </Button>
                          )}

                          {/* Action Buttons */}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSync(product.id)}
                            disabled={isSyncing}
                            title="Re-sync from Printify"
                            className="h-8 w-8 p-0"
                          >
                            {isSyncing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setProductToDelete(product)
                              setDeleteDialogOpen(true)
                            }}
                            title="Remove from local database"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-muted-foreground"
                          >
                            <Database className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setProductToDeleteFromPrintify(product)
                              setDeletePrintifyDialogOpen(true)
                            }}
                            title="Delete from Printify (permanent)"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Row 2: Mobile badges + actions */}
                      <div className="md:hidden mt-3 pt-3 border-t border-border">
                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">
                            <CheckCircle className="h-3 w-3" />
                            Synced
                          </span>
                          {product.visible ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                              <Eye className="h-3 w-3" />
                              Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                              <EyeOff className="h-3 w-3" />
                              Draft
                            </span>
                          )}
                          {product.is_locked && (
                            <span className="inline-flex items-center gap-1 text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">
                              <Lock className="h-3 w-3" />
                              Locked
                            </span>
                          )}
                          {product.is_locked && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnlock(product.id)}
                              disabled={unlockingProductId === product.id}
                              className="h-7 px-2 border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                            >
                              {unlockingProductId === product.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Unlock className="h-3 w-3 mr-1" />
                                  Unlock
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSync(product.id)}
                            disabled={isSyncing}
                            title="Re-sync"
                            className="h-9 w-9 p-0"
                          >
                            {isSyncing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setProductToDelete(product)
                              setDeleteDialogOpen(true)
                            }}
                            title="Delete"
                            className="h-9 w-9 p-0 text-destructive border-destructive/30 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Local Database?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>&quot;{productToDelete?.title}&quot;</strong> from your shop database.
              The product will still exist in Printify and can be synced again later.
              <br /><br />
              <span className="text-amber-500">Note: This does NOT delete the product from Printify.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={isDeleting} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLocal}
              disabled={isDeleting}
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete from Printify Confirmation Dialog */}
      <AlertDialog open={deletePrintifyDialogOpen} onOpenChange={setDeletePrintifyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete from Printify?</AlertDialogTitle>
            <AlertDialogDescription>
              This will <strong>permanently delete</strong> "{productToDeleteFromPrintify?.title}" from your Printify account.
              {productToDeleteFromPrintify?.synced && " It will also be removed from your local shop."}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingFromPrintify}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFromPrintify}
              disabled={isDeletingFromPrintify}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingFromPrintify ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LayoutShell>
  )
}
