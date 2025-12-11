"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  Shield,
  Edit2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ==================== Types ====================

interface ChildDetail {
  id: number
  first_name: string
  last_name: string
  date_of_birth: string
  age: number
  email: string
  phone: string
  jersey_number: string
  position: string
  team_name: string
  primary_photo_url: string | null
  medical_notes: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relationship: string
  is_active: boolean
  can_have_own_account: boolean
  dues_balance: string
  upcoming_events_count: number
  is_checked_in: boolean
}

interface UpcomingEvent {
  id: number
  event_title: string
  event_date: string
  location: string
  status: string
}

interface DuesTransaction {
  id: number
  transaction_type: string
  amount: string
  description: string
  balance_after: string
  created_at: string
}

// ==================== Main Component ====================

export default function ChildDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const childId = params?.id as string

  const [child, setChild] = useState<ChildDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editData, setEditData] = useState<Partial<ChildDetail>>({})

  useEffect(() => {
    async function fetchChild() {
      if (!session || !childId) return

      try {
        setLoading(true)
        setError(null)

        const accessToken = (session as any)?.accessToken
        const response = await fetch(`${API_BASE}/api/portal/players/${childId}/`, {
          headers: {
            "Authorization": `Bearer ${accessToken || ""}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setChild(data)
          setEditData(data)
        } else if (response.status === 404) {
          setError("Child not found")
        } else {
          setError("Failed to load child data")
        }
      } catch (err) {
        console.error("Failed to fetch child:", err)
        setError("Unable to connect to server")
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchChild()
    }
  }, [session, childId])

  const handleEdit = () => {
    setEditData(child || {})
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditData(child || {})
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!child) return

    setIsSaving(true)
    try {
      const accessToken = (session as any)?.accessToken
      const response = await fetch(`${API_BASE}/api/portal/players/${childId}/`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${accessToken || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      })

      if (response.ok) {
        const updated = await response.json()
        setChild(updated)
        setIsEditing(false)
      } else {
        setError("Failed to save changes")
      }
    } catch (err) {
      console.error("Failed to save:", err)
      setError("Unable to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return <ChildDetailSkeleton />
  }

  if (error || !child) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {error || "Child not found"}
        </h2>
        <p className="text-muted-foreground mb-4">
          We couldn't load this child's profile
        </p>
        <Link href="/portal/children">
          <Button>Back to Children</Button>
        </Link>
      </div>
    )
  }

  const balance = parseFloat(child.dues_balance)

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/portal/children"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Children
      </Link>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden mx-auto sm:mx-0">
          {child.primary_photo_url ? (
            <img
              src={child.primary_photo_url}
              alt={child.first_name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span className="text-3xl font-bold text-primary">
              {child.first_name[0]}{child.last_name[0]}
            </span>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {child.first_name} {child.last_name}
            </h1>
            {child.is_checked_in && (
              <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 mx-auto sm:mx-0 w-fit">
                <CheckCircle className="h-3 w-3 mr-1" />
                Currently Checked In
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {child.team_name && `${child.team_name} • `}
            Age {child.age}
            {child.jersey_number && ` • #${child.jersey_number}`}
            {child.position && ` • ${child.position}`}
          </p>

          {/* Quick Stats */}
          <div className="flex items-center justify-center sm:justify-start gap-6 mt-4">
            <div className="text-center">
              <div className="text-xl font-bold">{child.upcoming_events_count}</div>
              <div className="text-xs text-muted-foreground">Upcoming Events</div>
            </div>
            <div className="h-8 border-r" />
            <div className="text-center">
              <div className={`text-xl font-bold ${balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                ${Math.abs(balance).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                {balance > 0 ? 'Balance Due' : 'Credit'}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Button */}
        {!isEditing && (
          <Button variant="outline" onClick={handleEdit} className="gap-2 w-full sm:w-auto">
            <Edit2 className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="dues" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Dues</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          {isEditing ? (
            <EditProfileForm
              data={editData}
              onChange={handleFieldChange}
              onSave={handleSave}
              onCancel={handleCancel}
              isSaving={isSaving}
            />
          ) : (
            <ProfileView child={child} />
          )}
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <ScheduleView childId={child.id} session={session} />
        </TabsContent>

        {/* Dues Tab */}
        <TabsContent value="dues">
          <DuesView childId={child.id} balance={child.dues_balance} session={session} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ==================== Profile View ====================

function ProfileView({ child }: { child: ChildDetail }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Full Name" value={`${child.first_name} ${child.last_name}`} />
          <InfoRow label="Date of Birth" value={new Date(child.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
          <InfoRow label="Age" value={`${child.age} years old`} />
          {child.email && <InfoRow label="Email" value={child.email} />}
          {child.phone && <InfoRow label="Phone" value={child.phone} />}
          {child.can_have_own_account && (
            <div className="pt-2">
              <Badge variant="outline" className="text-xs">
                Eligible for own account (13+)
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Team Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Team" value={child.team_name || "Not assigned"} />
          <InfoRow label="Jersey Number" value={child.jersey_number || "Not set"} />
          <InfoRow label="Position" value={child.position || "Not set"} />
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Name" value={child.emergency_contact_name} />
          <InfoRow label="Phone" value={child.emergency_contact_phone} />
          <InfoRow label="Relationship" value={child.emergency_contact_relationship} />
        </CardContent>
      </Card>

      {/* Medical Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Medical Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {child.medical_notes ? (
            <p className="text-sm whitespace-pre-wrap">{child.medical_notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No medical notes on file</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}

// ==================== Edit Profile Form ====================

function EditProfileForm({
  data,
  onChange,
  onSave,
  onCancel,
  isSaving
}: {
  data: Partial<ChildDetail>
  onChange: (field: string, value: string) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <Button variant="outline" onClick={onCancel} disabled={isSaving} className="gap-2">
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button onClick={onSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={data.first_name || ""}
                  onChange={(e) => onChange("first_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={data.last_name || ""}
                  onChange={(e) => onChange("last_name", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={data.email || ""}
                onChange={(e) => onChange("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={data.phone || ""}
                onChange={(e) => onChange("phone", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Team Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team_name">Team Name</Label>
              <Input
                id="team_name"
                value={data.team_name || ""}
                onChange={(e) => onChange("team_name", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jersey_number">Jersey Number</Label>
                <Input
                  id="jersey_number"
                  value={data.jersey_number || ""}
                  onChange={(e) => onChange("jersey_number", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select
                  value={data.position || ""}
                  onValueChange={(value) => onChange("position", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PG">Point Guard</SelectItem>
                    <SelectItem value="SG">Shooting Guard</SelectItem>
                    <SelectItem value="SF">Small Forward</SelectItem>
                    <SelectItem value="PF">Power Forward</SelectItem>
                    <SelectItem value="C">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Contact Name</Label>
              <Input
                id="emergency_contact_name"
                value={data.emergency_contact_name || ""}
                onChange={(e) => onChange("emergency_contact_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
              <Input
                id="emergency_contact_phone"
                value={data.emergency_contact_phone || ""}
                onChange={(e) => onChange("emergency_contact_phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_relationship">Relationship</Label>
              <Select
                value={data.emergency_contact_relationship || ""}
                onValueChange={(value) => onChange("emergency_contact_relationship", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Parent/Guardian">Parent/Guardian</SelectItem>
                  <SelectItem value="Grandparent">Grandparent</SelectItem>
                  <SelectItem value="Aunt/Uncle">Aunt/Uncle</SelectItem>
                  <SelectItem value="Sibling">Sibling</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Medical Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Medical Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={data.medical_notes || ""}
              onChange={(e) => onChange("medical_notes", e.target.value)}
              placeholder="Allergies, medications, conditions, etc."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ==================== Schedule View ====================

function ScheduleView({ childId, session }: { childId: number; session: any }) {
  const [events, setEvents] = useState<UpcomingEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const accessToken = session?.accessToken
        const response = await fetch(`${API_BASE}/api/portal/players/${childId}/schedule/`, {
          headers: {
            "Authorization": `Bearer ${accessToken || ""}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setEvents(data.results || data)
        }
      } catch (err) {
        console.error("Failed to fetch schedule:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSchedule()
  }, [childId, session])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upcoming Events</CardTitle>
        <CardDescription>
          Events this child is registered for
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No upcoming events</p>
            <Link href="/events" className="text-primary text-sm hover:underline">
              Browse events
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{event.event_title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.event_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                    {event.location && (
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    )}
                  </div>
                </div>
                <Badge variant="outline">{event.status || 'Registered'}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== Dues View ====================

function DuesView({ childId, balance, session }: { childId: number; balance: string; session: any }) {
  const [transactions, setTransactions] = useState<DuesTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const balanceNum = parseFloat(balance)

  useEffect(() => {
    async function fetchDues() {
      try {
        const accessToken = session?.accessToken
        const response = await fetch(`${API_BASE}/api/portal/players/${childId}/dues/`, {
          headers: {
            "Authorization": `Bearer ${accessToken || ""}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setTransactions(data.transactions || data.results || [])
        }
      } catch (err) {
        console.error("Failed to fetch dues:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchDues()
  }, [childId, session])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <Card className={balanceNum > 0 ? "border-amber-500/50" : "border-green-500/50"}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className={`text-3xl font-bold ${balanceNum > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                ${Math.abs(balanceNum).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {balanceNum > 0 ? 'Amount due' : balanceNum < 0 ? 'Credit on account' : 'Paid in full'}
              </p>
            </div>
            {balanceNum > 0 && (
              <Link href="/portal/billing">
                <Button>Make Payment</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction History</CardTitle>
          <CardDescription>
            Charges, payments, and credits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      tx.transaction_type === 'payment' || tx.transaction_type === 'credit'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      tx.transaction_type === 'payment' || tx.transaction_type === 'credit'
                        ? 'text-green-600'
                        : 'text-amber-600'
                    }`}>
                      {tx.transaction_type === 'payment' || tx.transaction_type === 'credit' ? '-' : '+'}
                      ${parseFloat(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Bal: ${parseFloat(tx.balance_after).toFixed(2)}
                    </p>
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

// ==================== Loading Skeleton ====================

function ChildDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />

      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
        <Skeleton className="h-24 w-24 rounded-full mx-auto sm:mx-0" />
        <div className="flex-1 text-center sm:text-left">
          <Skeleton className="h-8 w-48 mb-2 mx-auto sm:mx-0" />
          <Skeleton className="h-4 w-64 mx-auto sm:mx-0" />
          <div className="flex items-center justify-center sm:justify-start gap-6 mt-4">
            <div>
              <Skeleton className="h-6 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="h-8 border-r" />
            <div>
              <Skeleton className="h-6 w-16 mx-auto mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <Skeleton className="h-10 w-64 mb-4" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
