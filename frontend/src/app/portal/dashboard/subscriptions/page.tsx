"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  AlertCircle,
  Check,
  ChevronDown,
  CreditCard,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  HelpCircle,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface SubscriptionPlan {
  id: number
  name: string
  slug: string
  description: string
  price: string
  billing_period: string
  is_team_dues: boolean
  is_active: boolean
  stripe_price_id: string
  stripe_product_id: string
  features: string[]
  created_at: string
}

interface StripePriceInfo {
  price_id: string
  product_id: string
  product_name: string
  product_description: string
  amount: number
  currency: string
  billing_period: string
  interval: string | null
  interval_count: number | null
}

export default function SubscriptionsAdminPage() {
  const { data: session } = useSession()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isGuideOpen, setIsGuideOpen] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [stripePriceId, setStripePriceId] = useState("")
  const [priceInfo, setPriceInfo] = useState<StripePriceInfo | null>(null)
  const [fetchingPrice, setFetchingPrice] = useState(false)
  const [priceError, setPriceError] = useState<string | null>(null)
  
  const [customName, setCustomName] = useState("")
  const [customDescription, setCustomDescription] = useState("")
  const [features, setFeatures] = useState("")
  const [isTeamDues, setIsTeamDues] = useState(false)
  const [creating, setCreating] = useState(false)

  const accessToken = (session as any)?.accessToken

  useEffect(() => {
    fetchPlans()
  }, [session])

  // Auto-fetch when a valid price ID is pasted
  useEffect(() => {
    const looksValid = stripePriceId.startsWith("price_") && stripePriceId.length >= 20
    if (looksValid && !priceInfo && !fetchingPrice) {
      handleFetchPrice()
    }
  }, [stripePriceId])

  async function fetchPlans() {
    if (!session) return
    
    try {
      setLoading(true)
      const res = await fetch(API_BASE + "/api/payments/admin/subscriptions/", {
        headers: { Authorization: "Bearer " + accessToken },
      })
      
      if (!res.ok) throw new Error("Failed to fetch plans")
      
      const data = await res.json()
      setPlans(data.results || [])
    } catch (err) {
      setError("Unable to load subscription plans")
    } finally {
      setLoading(false)
    }
  }

  async function handleFetchPrice() {
    if (!stripePriceId.trim()) return
    
    setFetchingPrice(true)
    setPriceError(null)
    setPriceInfo(null)
    
    try {
      const res = await fetch(API_BASE + "/api/payments/admin/subscriptions/fetch-price/", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ price_id: stripePriceId.trim() }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setPriceError(data.error || "Failed to fetch price")
        return
      }
      
      setPriceInfo(data)
      setCustomName(data.product_name || "")
      setCustomDescription(data.product_description || "")
    } catch (err) {
      setPriceError("Network error fetching price")
    } finally {
      setFetchingPrice(false)
    }
  }

  async function handleCreatePlan() {
    if (!priceInfo) return
    
    setCreating(true)
    setError(null)
    
    try {
      const res = await fetch(API_BASE + "/api/payments/admin/subscriptions/create/", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stripe_price_id: priceInfo.price_id,
          name: customName || priceInfo.product_name,
          description: customDescription || priceInfo.product_description,
          features: features.split("\n").filter(f => f.trim()),
          is_team_dues: isTeamDues,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || "Failed to create plan")
        return
      }
      
      setStripePriceId("")
      setPriceInfo(null)
      setCustomName("")
      setCustomDescription("")
      setFeatures("")
      setIsTeamDues(false)
      setIsFormOpen(false)
      fetchPlans()
    } catch (err) {
      setError("Network error creating plan")
    } finally {
      setCreating(false)
    }
  }

  async function handleToggleActive(planId: number, isActive: boolean) {
    try {
      const res = await fetch(API_BASE + "/api/payments/admin/subscriptions/" + planId + "/", {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: isActive }),
      })
      
      if (res.ok) {
        setPlans(plans.map(p => p.id === planId ? { ...p, is_active: isActive } : p))
      }
    } catch (err) {
      console.error("Failed to toggle plan status")
    }
  }

  async function handleDeletePlan(planId: number) {
    if (!confirm("Are you sure you want to delete this plan?")) return
    
    try {
      const res = await fetch(API_BASE + "/api/payments/admin/subscriptions/" + planId + "/delete/", {
        method: "DELETE",
        headers: { Authorization: "Bearer " + accessToken },
      })
      
      if (res.ok) {
        setPlans(plans.filter(p => p.id !== planId))
      } else {
        const data = await res.json()
        alert(data.error || "Failed to delete plan")
      }
    } catch (err) {
      alert("Network error deleting plan")
    }
  }

  function formatBillingPeriod(period: string): string {
    const labels: Record<string, string> = {
      monthly: "Monthly",
      seasonal: "Per Season",
      annual: "Annual",
      one_time: "One-Time",
    }
    return labels[period] || period
  }

  function formatAmount(amount: number): string {
    return "$" + amount.toFixed(2)
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <p className="text-muted-foreground">Manage membership and dues payment options</p>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-2 p-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {error}
          </CardContent>
        </Card>
      )}

      <Collapsible open={isGuideOpen} onOpenChange={setIsGuideOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">How to Add Subscription Plans</CardTitle>
                </div>
                <ChevronDown className={"h-5 w-5 transition-transform " + (isGuideOpen ? "rotate-180" : "")} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">1</div>
                  <div>
                    <h4 className="font-medium">Create the Product & Price in Stripe</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Go to Stripe Dashboard → Products → Create Product. Add a name, description, and create a Price (recurring for subscriptions, one-time for dues).
                    </p>
                    <a href="https://dashboard.stripe.com/products/create" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2">
                      Open Stripe Products <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">2</div>
                  <div>
                    <h4 className="font-medium">Copy the Price ID</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      After creating the price, copy its ID (starts with <code className="bg-muted px-1 rounded">price_</code>). You will find this on the product page in Stripe.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">3</div>
                  <div>
                    <h4 className="font-medium">Add Plan Below</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Paste the Price ID in the form below. We will automatically fetch the pricing details from Stripe. Add any custom features and save.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  <CardTitle className="text-lg">Add New Plan</CardTitle>
                </div>
                <ChevronDown className={"h-5 w-5 transition-transform " + (isFormOpen ? "rotate-180" : "")} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6 pt-0">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="price-id">Stripe Price ID</Label>
                    <Input id="price-id" placeholder="price_1234567890..." value={stripePriceId} onChange={(e) => setStripePriceId(e.target.value)} className="mt-1.5" />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleFetchPrice} disabled={!stripePriceId.trim() || fetchingPrice}>
                      {fetchingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch Price"}
                    </Button>
                  </div>
                </div>

                {priceError && <p className="text-sm text-destructive">{priceError}</p>}

                {priceInfo && (
                  <Card className="border-green-500/50 bg-green-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Check className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Price found in Stripe</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="ml-2 font-medium">{formatAmount(priceInfo.amount)} {priceInfo.currency}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Billing:</span>
                          <span className="ml-2 font-medium">{formatBillingPeriod(priceInfo.billing_period)}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Product:</span>
                          <span className="ml-2">{priceInfo.product_name || "Unnamed"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {priceInfo && (
                <div className="space-y-4 border-t pt-6">
                  <h4 className="font-medium">Customize Plan Details</h4>
                  
                  <div>
                    <Label htmlFor="plan-name">Display Name</Label>
                    <Input id="plan-name" placeholder={priceInfo.product_name || "Plan name"} value={customName} onChange={(e) => setCustomName(e.target.value)} className="mt-1.5" />
                    <p className="text-xs text-muted-foreground mt-1">Leave blank to use the Stripe product name</p>
                  </div>

                  <div>
                    <Label htmlFor="plan-desc">Description</Label>
                    <Textarea id="plan-desc" placeholder={priceInfo.product_description || "Plan description"} value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} className="mt-1.5" rows={2} />
                  </div>

                  <div>
                    <Label htmlFor="features">Features (one per line)</Label>
                    <Textarea id="features" placeholder={"Full access to all practices\nTournament entry included\nTeam jersey"} value={features} onChange={(e) => setFeatures(e.target.value)} className="mt-1.5" rows={4} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="team-dues">Team Dues (One-Time Payment)</Label>
                      <p className="text-xs text-muted-foreground">Mark this if it is a one-time dues payment to secure team spot</p>
                    </div>
                    <Switch variant="dashboardSwitch" id="team-dues" checked={isTeamDues} onCheckedChange={setIsTeamDues} />
                  </div>

                  <Button onClick={handleCreatePlan} disabled={creating} className="w-full">
                    {creating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Plan...</>
                    ) : (
                      <><Plus className="mr-2 h-4 w-4" />Create Subscription Plan</>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Plans</CardTitle>
          <CardDescription>{plans.length} plan{plans.length !== 1 ? "s" : ""} configured</CardDescription>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No subscription plans yet. Add one above!</p>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className={"flex items-center justify-between p-4 border rounded-lg " + (!plan.is_active ? "opacity-60" : "")}>
                  <div className="flex items-center gap-4">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{plan.name}</h4>
                        {plan.is_team_dues && <Badge variant="outline" className="text-xs">Team Dues</Badge>}
                        {!plan.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{"$" + parseFloat(plan.price).toFixed(0)} / {formatBillingPeriod(plan.billing_period)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Active</span>
                      <Switch variant="dashboardSwitch" checked={plan.is_active} onCheckedChange={(checked) => handleToggleActive(plan.id, checked)} />
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeletePlan(plan.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
