"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Link2,
  Loader2,
  CheckCircle,
  Copy,
  QrCode,
  Package,
  Calendar,
  DollarSign,
  Sparkles,
  Search,
  X,
} from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

type PaymentType = "product" | "event" | "custom"

interface Product {
  id: number
  name: string
  slug: string
  price: string
  primary_image_url: string | null
}

interface Event {
  id: string
  title: string
  slug: string
  price: string | null
  start_datetime: string
}

interface GeneratedLink {
  url: string
  qr_code_url?: string
  expires_at?: string
}

interface PaymentLinkGeneratorProps {
  /**
   * Custom trigger button. If not provided, uses default green button.
   */
  trigger?: React.ReactNode
  /**
   * Callback when a link is successfully generated
   */
  onLinkGenerated?: (link: GeneratedLink) => void
}

export function PaymentLinkGenerator({
  trigger,
  onLinkGenerated,
}: PaymentLinkGeneratorProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data
  const [products, setProducts] = useState<Product[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loadingData, setLoadingData] = useState(false)

  // Form state
  const [paymentType, setPaymentType] = useState<PaymentType>("product")
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [selectedEventId, setSelectedEventId] = useState<string>("")

  // Search state
  const [productSearch, setProductSearch] = useState("")
  const [eventSearch, setEventSearch] = useState("")
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [showEventDropdown, setShowEventDropdown] = useState(false)
  const productSearchRef = useRef<HTMLDivElement>(null)
  const eventSearchRef = useRef<HTMLDivElement>(null)

  // Custom payment fields
  const [customTitle, setCustomTitle] = useState("")
  const [customDescription, setCustomDescription] = useState("")
  const [customAmount, setCustomAmount] = useState("")

  // Generated link
  const [generatedLink, setGeneratedLink] = useState<GeneratedLink | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch products and events when dialog opens
  useEffect(() => {
    if (open && session) {
      fetchData()
    }
  }, [open, session])

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productSearchRef.current && !productSearchRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false)
      }
      if (eventSearchRef.current && !eventSearchRef.current.contains(event.target as Node)) {
        setShowEventDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Filter products: exclude free items and match search
  const filteredProducts = products
    .filter((p) => parseFloat(p.price) > 0) // Exclude free items
    .filter((p) =>
      productSearch === "" ||
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    )

  // Filter events: exclude free items and match search
  const filteredEvents = events
    .filter((e) => e.price && parseFloat(e.price) > 0) // Exclude free items
    .filter((e) =>
      eventSearch === "" ||
      e.title.toLowerCase().includes(eventSearch.toLowerCase())
    )

  const fetchData = async () => {
    setLoadingData(true)
    try {
      const apiToken = (session as any)?.apiToken
      const headers = {
        Authorization: apiToken ? `Token ${apiToken}` : "",
      }

      const [productsRes, eventsRes] = await Promise.all([
        fetch(`${API_BASE}/api/payments/products/?is_active=true`, { headers }),
        fetch(`${API_BASE}/api/events/?is_public=true&requires_payment=true`, { headers }),
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.results || [])
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.results || [])
      }
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setLoadingData(false)
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const apiToken = (session as any)?.apiToken

      let body: Record<string, any> = {}

      if (paymentType === "product" && selectedProductId) {
        body = {
          type: "product",
          product_id: selectedProductId,
        }
      } else if (paymentType === "event" && selectedEventId) {
        body = {
          type: "event",
          event_id: selectedEventId,
        }
      } else if (paymentType === "custom") {
        if (!customTitle || !customAmount) {
          setError("Please fill in the title and amount")
          setLoading(false)
          return
        }
        body = {
          type: "custom",
          title: customTitle,
          description: customDescription,
          amount: parseFloat(customAmount),
        }
      } else {
        setError("Please select an item")
        setLoading(false)
        return
      }

      const response = await fetch(`${API_BASE}/api/payments/generate-link/`, {
        method: "POST",
        headers: {
          Authorization: apiToken ? `Token ${apiToken}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.detail || "Failed to generate link")
      }

      const result = await response.json()
      setGeneratedLink(result)
      setSuccess(true)

      if (onLinkGenerated) {
        onLinkGenerated(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate link")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (generatedLink?.url) {
      await navigator.clipboard.writeText(generatedLink.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleReset = () => {
    setSuccess(false)
    setGeneratedLink(null)
    setPaymentType("product")
    setSelectedProductId("")
    setSelectedEventId("")
    setProductSearch("")
    setEventSearch("")
    setCustomTitle("")
    setCustomDescription("")
    setCustomAmount("")
  }

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id.toString())
    setProductSearch(product.name)
    setShowProductDropdown(false)
  }

  const handleSelectEvent = (event: Event) => {
    setSelectedEventId(event.id)
    setEventSearch(event.title)
    setShowEventDropdown(false)
  }

  const clearProductSelection = () => {
    setSelectedProductId("")
    setProductSearch("")
  }

  const clearEventSelection = () => {
    setSelectedEventId("")
    setEventSearch("")
  }

  const selectedProduct = products.find((p) => p.id.toString() === selectedProductId)
  const selectedEvent = events.find((e) => e.id === selectedEventId)

  const getPreviewAmount = () => {
    if (paymentType === "product" && selectedProduct) {
      return parseFloat(selectedProduct.price)
    }
    if (paymentType === "event" && selectedEvent?.price) {
      return parseFloat(selectedEvent.price)
    }
    if (paymentType === "custom" && customAmount) {
      return parseFloat(customAmount)
    }
    return 0
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-secondary/80 hover:bg-secondary text-white">
            <Link2 className="h-4 w-4 mr-2" />
            Generate Payment Link
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-secondary" />
            Generate Payment Link
          </DialogTitle>
          <DialogDescription>
            Create a shareable payment link for products, events, or custom payments.
          </DialogDescription>
        </DialogHeader>

        {success && generatedLink ? (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center">
              <CheckCircle className="h-12 w-12 text-secondary mb-3" />
              <p className="text-lg font-medium">Payment Link Generated!</p>
              <p className="text-sm text-muted-foreground">Scan the QR code or share the link below</p>
            </div>

            {/* QR Code Display - Generated client-side */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <QRCodeSVG
                  value={generatedLink.url}
                  size={200}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            </div>

            {/* Link Display */}
            <div className="bg-muted/50 rounded-lg p-4">
              <Label className="text-xs text-muted-foreground mb-2 block">
                Payment Link
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={generatedLink.url}
                  readOnly
                  className="font-mono text-sm bg-background"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-secondary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-secondary mt-2 text-center">Link copied to clipboard!</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleReset}>
                Generate Another
              </Button>
              <Button className="flex-1" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Payment Type Tabs */}
            <Tabs value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="product" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product
                </TabsTrigger>
                <TabsTrigger value="event" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Event
                </TabsTrigger>
                <TabsTrigger value="custom" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Custom
                </TabsTrigger>
              </TabsList>

              {/* Product Selection */}
              <TabsContent value="product" className="space-y-4">
                <div className="space-y-2">
                  <Label>Search Products</Label>
                  {loadingData ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading products...
                    </div>
                  ) : (
                    <div ref={productSearchRef} className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search products..."
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value)
                            setSelectedProductId("")
                            setShowProductDropdown(true)
                          }}
                          onFocus={() => setShowProductDropdown(true)}
                          className="pl-9 pr-9"
                        />
                        {productSearch && (
                          <button
                            type="button"
                            onClick={clearProductSelection}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {showProductDropdown && filteredProducts.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredProducts.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleSelectProduct(product)}
                              className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-accent/50 transition-colors ${
                                selectedProductId === product.id.toString() ? "bg-accent" : ""
                              }`}
                            >
                              <span className="truncate">{product.name}</span>
                              <Badge variant="secondary" className="ml-2 shrink-0">
                                ${parseFloat(product.price).toFixed(2)}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      )}
                      {showProductDropdown && productSearch && filteredProducts.length === 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
                          No products found matching "{productSearch}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedProduct && (
                  <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                      {selectedProduct.primary_image_url && (
                        <img
                          src={selectedProduct.primary_image_url}
                          alt={selectedProduct.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{selectedProduct.name}</p>
                        <p className="text-2xl font-bold text-secondary">
                          ${parseFloat(selectedProduct.price).toFixed(2)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Event Selection */}
              <TabsContent value="event" className="space-y-4">
                <div className="space-y-2">
                  <Label>Search Events</Label>
                  {loadingData ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading events...
                    </div>
                  ) : (
                    <div ref={eventSearchRef} className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search events..."
                          value={eventSearch}
                          onChange={(e) => {
                            setEventSearch(e.target.value)
                            setSelectedEventId("")
                            setShowEventDropdown(true)
                          }}
                          onFocus={() => setShowEventDropdown(true)}
                          className="pl-9 pr-9"
                        />
                        {eventSearch && (
                          <button
                            type="button"
                            onClick={clearEventSelection}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {showEventDropdown && filteredEvents.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredEvents.map((event) => (
                            <button
                              key={event.id}
                              type="button"
                              onClick={() => handleSelectEvent(event)}
                              className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-accent/50 transition-colors ${
                                selectedEventId === event.id ? "bg-accent" : ""
                              }`}
                            >
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="truncate">{event.title}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(event.start_datetime).toLocaleDateString()}
                                </span>
                              </div>
                              <Badge variant="secondary" className="ml-2 shrink-0">
                                ${parseFloat(event.price!).toFixed(2)}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      )}
                      {showEventDropdown && eventSearch && filteredEvents.length === 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
                          No paid events found matching "{eventSearch}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedEvent && (
                  <Card>
                    <CardContent className="p-4">
                      <p className="font-medium">{selectedEvent.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedEvent.start_datetime).toLocaleDateString()}
                      </p>
                      {selectedEvent.price && (
                        <p className="text-2xl font-bold text-secondary mt-2">
                          ${parseFloat(selectedEvent.price).toFixed(2)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Custom Payment */}
              <TabsContent value="custom" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-title">Payment Title *</Label>
                  <Input
                    id="custom-title"
                    placeholder="e.g., Private Lesson - 1 Hour"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-description">Description (optional)</Label>
                  <Textarea
                    id="custom-description"
                    placeholder="Add details about this payment..."
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-amount">Amount *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="custom-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Preview Amount */}
            {getPreviewAmount() > 0 && (
              <div className="bg-accent/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Payment Amount</p>
                <p className="text-3xl font-bold text-secondary">
                  ${getPreviewAmount().toFixed(2)}
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="text-red-600 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Generate Button */}
            <Button
              className="w-full bg-secondary hover:bg-secondary/90"
              onClick={handleGenerate}
              disabled={loading || getPreviewAmount() <= 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate Payment Link
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
