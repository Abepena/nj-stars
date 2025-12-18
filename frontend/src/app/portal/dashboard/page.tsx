"use client"

/**
 * Dashboard Router with Role-Based Tabbed Views
 *
 * Role Hierarchy: Admin > Staff > Parent > Player
 * (Coach is now synonymous with Staff)
 *
 * Access Rules:
 * - Admin/Superuser: Can see ALL views (Admin, Staff, Parent, Player)
 * - Staff/Coach: Staff by default + Parent (if toggled and adult) + Player (if toggled)
 * - Parent: Parent by default + Player (if toggled)
 * - Player: Player by default + Parent (if toggled and adult)
 *
 * Special Cases:
 * - Parents/Staff can opt-in to Player view via settings
 * - Staff/Players can opt-in to Parent view if 18+ via settings
 * - Players under 18 cannot access parent features
 */

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2, Shield, Briefcase, UserCircle, Gamepad2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

// Import dashboards
import AdminDashboard from "@/components/dashboard/admin-dashboard"
import StaffExamplePage from "../examples/staff/page"
import ParentExamplePage from "../examples/parent/page"
import PlayerExamplePage from "../examples/player/page"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Type for the extended session user
interface ExtendedUser {
  id?: string
  email?: string | null
  name?: string | null
  image?: string | null
  is_superuser?: boolean
  is_staff?: boolean
  role?: string
}

// Profile data from backend
interface ProfileData {
  player_profile_enabled: boolean
  show_parent_dashboard: boolean
  is_adult: boolean | null
}

// Tab types (coach merged into staff)
type TabId = "admin" | "staff" | "parent" | "player"

// Tab configuration
interface TabConfig {
  id: TabId
  label: string
  icon: typeof Shield
  description: string
}

const TAB_CONFIG: TabConfig[] = [
  { id: "admin", label: "Admin", icon: Shield, description: "Full system control" },
  { id: "staff", label: "Staff", icon: Briefcase, description: "Operations management" },
  { id: "parent", label: "Parent", icon: UserCircle, description: "Family dashboard" },
  { id: "player", label: "Player", icon: Gamepad2, description: "My profile & schedule" },
]

// Get available tabs based on user role and profile settings
function getAvailableTabs(user: ExtendedUser, profile: ProfileData | null): TabConfig[] {
  const tabs: TabConfig[] = []
  const isAdult = profile?.is_adult === true

  // Admin sees everything
  if (user.is_superuser) {
    return TAB_CONFIG
  }

  // Staff or Coach role: Staff tab + optional Parent/Player
  if (user.is_staff || user.role === "coach" || user.role === "staff") {
    tabs.push(TAB_CONFIG.find((t) => t.id === "staff")!)

    // Add Parent tab if toggled AND adult
    if (profile?.show_parent_dashboard && isAdult) {
      tabs.push(TAB_CONFIG.find((t) => t.id === "parent")!)
    }

    // Add Player tab if toggled
    if (profile?.player_profile_enabled) {
      tabs.push(TAB_CONFIG.find((t) => t.id === "player")!)
    }

    return tabs
  }

  // Parent role: Parent tab + optional Player
  if (user.role === "parent") {
    tabs.push(TAB_CONFIG.find((t) => t.id === "parent")!)

    // Add Player tab if toggled
    if (profile?.player_profile_enabled) {
      tabs.push(TAB_CONFIG.find((t) => t.id === "player")!)
    }

    return tabs
  }

  // Player role (default): Player tab + optional Parent (if adult)
  tabs.push(TAB_CONFIG.find((t) => t.id === "player")!)

  // Add Parent tab if toggled AND adult
  if (profile?.show_parent_dashboard && isAdult) {
    tabs.push(TAB_CONFIG.find((t) => t.id === "parent")!)
  }

  return tabs
}

// Get default tab for user
function getDefaultTab(user: ExtendedUser): TabId {
  if (user.is_superuser) return "admin"
  if (user.is_staff || user.role === "coach" || user.role === "staff") return "staff"
  if (user.role === "parent") return "parent"
  return "player"
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Get user from session
  const user = session?.user as ExtendedUser | undefined

  // Fetch profile data for tab settings
  useEffect(() => {
    async function fetchProfile() {
      if (!session) return

      try {
        setProfileLoading(true)
        const apiToken = (session as any)?.apiToken
        const response = await fetch(`${API_BASE}/api/portal/profile/`, {
          headers: {
            Authorization: apiToken ? `Token ${apiToken}` : "",
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setProfile({
            player_profile_enabled: data.player_profile_enabled ?? false,
            show_parent_dashboard: data.show_parent_dashboard ?? false,
            is_adult: data.is_adult ?? null,
          })
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [session])

  // Initialize active tab based on user role and profile
  useEffect(() => {
    if (user && !activeTab && !profileLoading) {
      // Try to restore from localStorage, otherwise use default
      const savedTab = localStorage.getItem("dashboard_active_tab") as TabId | null
      const availableTabs = getAvailableTabs(user, profile)
      const tabIds = availableTabs.map((t) => t.id)

      if (savedTab && tabIds.includes(savedTab)) {
        setActiveTab(savedTab)
      } else {
        setActiveTab(getDefaultTab(user))
      }
    }
  }, [user, activeTab, profile, profileLoading])

  // Save tab preference
  const handleTabChange = (value: string) => {
    setActiveTab(value as TabId)
    localStorage.setItem("dashboard_active_tab", value)
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/portal/login")
    }
  }, [status, router])

  // Show loading state
  if (status === "loading" || profileLoading || !activeTab) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Not authenticated
  if (!session || !user) {
    return null
  }

  const availableTabs = getAvailableTabs(user, profile)

  // If user only has one tab, render that dashboard directly without tabs
  if (availableTabs.length === 1) {
    return renderDashboard(availableTabs[0].id)
  }

  return (
    <div className="space-y-0">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Tab Navigation - Pill Style */}
        <TabsList className="h-auto p-1 bg-muted/50 rounded-lg gap-1 flex-wrap justify-start w-fit">
          {availableTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={`
                  flex items-center gap-2 px-4 py-2 transition-all rounded-md
                  data-[state=active]:bg-success/40 data-[state=active]:text-foreground data-[state=active]:shadow-sm
                  data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground
                  hover:text-foreground
                `}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
                {tab.id === "admin" && (
                  <Badge variant="outline" className="ml-1 text-xs px-1.5 py-0 h-5 bg-success/30 border-success/50 text-foreground">
                    Full Access
                  </Badge>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Tab Content - Connected to tabs */}
        {availableTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-0 pt-6">
            <div className="px-1">
              {renderDashboard(tab.id)}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

// Render the appropriate dashboard component
function renderDashboard(tabId: TabId) {
  switch (tabId) {
    case "admin":
      return <AdminDashboard />
    case "staff":
      return <StaffExamplePage />
    case "parent":
      return <ParentExamplePage />
    case "player":
      return <PlayerExamplePage />
    default:
      return <ParentExamplePage />
  }
}
