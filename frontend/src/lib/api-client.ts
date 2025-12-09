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

export interface Product {
  id: number
  name: string
  description: string
  price: number
  image_url?: string
  stock_quantity: number
  category: string
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
}

// Export singleton instance
export const apiClient = new APIClient(API_BASE_URL)

// Export class for mobile apps to instantiate
export default APIClient
