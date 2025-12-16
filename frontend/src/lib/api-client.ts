/**
 * API Client - Centralized API communication layer
 *
 * This abstraction layer provides:
 * - Type-safe API calls
 * - Consistent error handling
 * - Authentication token management
 * - Easy to replicate in mobile apps (React Native, Flutter, Swift, Kotlin)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Error Types
export interface APIError {
  message: string
  status: number
  errors?: Record<string, string[]>
}

// Types
export interface User {
  id: number
  email: string
  full_name?: string
  role: string
  provider: string
}

export interface BlogPost {
  id: string
  type: 'blog' | 'instagram'
  title: string
  content?: string
  excerpt?: string
  image_url?: string
  author?: string
  published_date: string
  permalink?: string
}

export interface ProductImage {
  id: number
  url: string
  alt_text: string
  is_primary: boolean
  sort_order: number
  printify_variant_ids: number[]
}

export interface ProductVariant {
  id: number
  printify_variant_id: number | null
  title: string
  size: string
  color: string
  color_hex: string
  price: number | null
  effective_price: number
  is_enabled: boolean
  is_available: boolean
  sort_order: number
}

export interface AvailableColor {
  name: string
  hex: string
}

export type FulfillmentType = 'pod' | 'local'

export interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: number
  compare_at_price?: number | null
  // Fulfillment
  fulfillment_type: FulfillmentType
  is_pod: boolean
  is_local: boolean
  shipping_estimate: string
  fulfillment_display: string
  // Images
  image_url?: string
  primary_image_url?: string | null
  images: ProductImage[]
  // Variants
  variants: ProductVariant[]
  available_sizes: string[]
  available_colors: AvailableColor[]
  // Stock & Status
  stock_quantity: number
  category: string
  in_stock: boolean
  featured: boolean
  best_selling: boolean
  on_sale: boolean
}

export interface Event {
  id: number
  title: string
  description: string
  event_type: string
  start_time: string
  end_time?: string
  location?: string
  max_participants?: number
}

export interface Coach {
  id: number
  name: string
  display_name: string
  slug: string
  role: string
  title: string
  bio: string
  photo_url: string
  instagram_handle: string
  instagram_url: string | null
  specialties: string
  specialties_list: string[]
  is_active: boolean
  order: number
}

export interface OrderItem {
  id: number
  product_name: string
  product_price: number
  quantity: number
  total_price: number
  product_image?: string | null
  fulfillment_type: FulfillmentType
  fulfillment_display: string
  printify_line_item_id?: string
}

export interface Order {
  id: number
  order_number: string
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'canceled' | 'refunded'
  status_display: string
  subtotal: number
  shipping: number
  tax: number
  total: number
  // Shipping address
  shipping_name: string
  shipping_email: string
  shipping_address_line1: string
  shipping_address_line2?: string
  shipping_city: string
  shipping_state: string
  shipping_zip: string
  shipping_country: string
  // Tracking info
  tracking_number?: string
  tracking_url?: string
  has_tracking: boolean
  // Printify info
  printify_order_id?: string
  has_pod_items: boolean
  has_local_items: boolean
  // Items and metadata
  items: OrderItem[]
  notes?: string
  created_at: string
  updated_at: string
}

// Portal Types
export interface PlayerSummary {
  id: number
  first_name: string
  last_name: string
  age: number
  team_name: string | null
  primary_photo_url: string | null
  is_active: boolean
}

export interface UpcomingEvent {
  player_name: string
  event_title: string
  event_date: string
  registration_id: number
}

export interface ActiveCheckIn {
  player_name: string
  event_title: string
  checked_in_at: string
}

export interface RecentOrder {
  id: number
  total: string
  status: string
  created_at: string
}

export interface ParentDashboard {
  profile: {
    id: number
    email: string
    full_name: string
    role: string
    auto_pay_enabled: boolean
    profile_completeness: number
  }
  children: PlayerSummary[]
  total_balance: string
  upcoming_events: UpcomingEvent[]
  recent_orders: RecentOrder[]
  promo_credit_total: string
  active_check_ins: ActiveCheckIn[]
}

export interface AdminStats {
  total_players: number
  todays_events: number
  pending_payments: number
  check_ins_today: number
}

export interface PendingCheckIn {
  id: number
  participant_name: string
  event_title: string
  event_date: string
}

export interface RecentRegistration {
  id: number
  participant_first_name: string
  participant_last_name: string
  event_title: string
  registered_at: string
}

export interface StaffDashboard extends ParentDashboard {
  admin_stats: AdminStats
  pending_check_ins: PendingCheckIn[]
  recent_registrations: RecentRegistration[]
}

export interface UserProfile {
  id: number
  user: {
    id: number
    email: string
    full_name: string
  }
  role: string
  phone: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string
  zip_code: string | null
  waiver_signed_at: string | null
  waiver_version: string | null
  auto_pay_enabled: boolean
  notification_email: boolean
  notification_sms: boolean
  profile_completeness: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name?: string
}

export interface AuthTokens {
  access_token: string
  token_type: string
}

// API Client Class
class APIClient {
  private baseURL: string
  private accessToken: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.accessToken = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token)
    }
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    if (!this.accessToken && typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token')
    }
    return this.accessToken
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.accessToken = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
    }
  }

  /**
   * Make authenticated request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Add auth token if available
    const token = this.getToken()
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    const config: RequestInit = {
      ...options,
      headers,
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      let errorMessage = 'An error occurred'
      let fieldErrors: Record<string, string[]> | undefined

      try {
        const errorData = await response.json()

        // Handle Django REST Framework error format
        if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (Array.isArray(errorData)) {
          errorMessage = errorData.join(', ')
        } else if (typeof errorData === 'object') {
          // Field-level errors from DRF
          fieldErrors = errorData
          errorMessage = 'Please check the form for errors'
        }
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }

      const apiError: APIError = {
        message: errorMessage,
        status: response.status,
        errors: fieldErrors,
      }

      throw apiError
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  // ==================== Authentication ====================

  /**
   * Register new user account
   */
  async register(data: RegisterData): Promise<User> {
    return this.request<User>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const tokens = await this.request<AuthTokens>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    // Store token for subsequent requests
    this.setToken(tokens.access_token)

    return tokens
  }

  /**
   * Logout (clear token)
   */
  logout() {
    this.clearToken()
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/v1/auth/me')
  }

  /**
   * Verify token is still valid
   */
  async verifyToken(): Promise<boolean> {
    try {
      await this.request('/api/v1/auth/verify')
      return true
    } catch {
      return false
    }
  }

  // ==================== Blog & News ====================

  /**
   * Get blog posts
   */
  async getBlogPosts(skip = 0, limit = 10): Promise<BlogPost[]> {
    return this.request<BlogPost[]>(`/api/v1/blog/posts?skip=${skip}&limit=${limit}`)
  }

  /**
   * Get unified news feed (blog + Instagram)
   */
  async getNewsFeed(skip = 0, limit = 20): Promise<BlogPost[]> {
    return this.request<BlogPost[]>(`/api/v1/blog/feed?skip=${skip}&limit=${limit}`)
  }

  // ==================== Products ====================

  /**
   * Get all products
   */
  async getProducts(skip = 0, limit = 50, category?: string): Promise<Product[]> {
    let url = `/api/v1/products?skip=${skip}&limit=${limit}`
    if (category) {
      url += `&category=${encodeURIComponent(category)}`
    }
    return this.request<Product[]>(url)
  }

  /**
   * Get single product
   */
  async getProduct(id: number): Promise<Product> {
    return this.request<Product>(`/api/v1/products/${id}`)
  }

  // ==================== Events ====================

  /**
   * Get events
   */
  async getEvents(
    skip = 0,
    limit = 50,
    eventType?: string,
    upcomingOnly = true
  ): Promise<Event[]> {
    let url = `/api/v1/events?skip=${skip}&limit=${limit}&upcoming_only=${upcomingOnly}`
    if (eventType) {
      url += `&event_type=${encodeURIComponent(eventType)}`
    }
    return this.request<Event[]>(url)
  }

  /**
   * Get single event
   */
  async getEvent(id: number): Promise<Event> {
    return this.request<Event>(`/api/v1/events/${id}`)
  }

  // ==================== Coaches ====================

  /**
   * Get all active coaches
   */
  async getCoaches(): Promise<{ results: Coach[] }> {
    return this.request<{ results: Coach[] }>('/api/coaches/')
  }

  /**
   * Get single coach by slug
   */
  async getCoach(slug: string): Promise<Coach> {
    return this.request<Coach>(`/api/coaches/${slug}/`)
  }

  // ==================== Stripe ====================

  /**
   * Create Stripe checkout session
   */
  async createCheckoutSession(data: {
    product_id: number
    quantity: number
    success_url: string
    cancel_url: string
  }): Promise<{ session_id: string; url: string }> {
    return this.request('/api/v1/stripe/checkout/create-session', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ==================== Portal ====================

  /**
   * Get parent dashboard data
   */
  async getDashboard(): Promise<ParentDashboard> {
    return this.request<ParentDashboard>('/api/portal/dashboard/')
  }

  /**
   * Get staff dashboard data (includes admin stats)
   */
  async getStaffDashboard(): Promise<StaffDashboard> {
    return this.request<StaffDashboard>('/api/portal/dashboard/staff/')
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/api/portal/profile/')
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    return this.request<UserProfile>('/api/portal/profile/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  /**
   * Get user's children/players
   */
  async getPlayers(): Promise<{ results: PlayerSummary[] }> {
    return this.request<{ results: PlayerSummary[] }>('/api/portal/players/')
  }

  /**
   * Get user's orders
   */
  async getOrders(): Promise<Order[]> {
    return this.request<Order[]>('/api/payments/orders/')
  }
}

// Export singleton instance
export const apiClient = new APIClient(API_BASE_URL)

// Export class for mobile apps to instantiate
export default APIClient
