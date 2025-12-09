'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const CART_SESSION_KEY = 'nj-stars-cart-session'

// ==================== Types ====================

export interface CartProduct {
  id: number
  name: string
  slug: string
  description: string
  price: string
  compare_at_price: string | null
  category: string
  image_url: string
  is_active: boolean
  featured: boolean
  best_selling: boolean
  on_sale: boolean
  stock_quantity: number
  in_stock: boolean
}

export interface CartItem {
  id: number
  product: CartProduct
  quantity: number
  total_price: string
  is_available: boolean
  added_at: string
}

export interface Cart {
  id: number
  items: CartItem[]
  item_count: number
  subtotal: string
  session_key?: string
  created_at: string
  updated_at: string
}

interface CartContextType {
  cart: Cart | null
  isLoading: boolean
  error: string | null
  addToCart: (productId: number, quantity?: number) => Promise<void>
  updateQuantity: (itemId: number, quantity: number) => Promise<void>
  removeItem: (itemId: number) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
  checkout: () => Promise<{ url: string; session_id: string }>
}

// ==================== Context ====================

const CartContext = createContext<CartContextType | null>(null)

// ==================== Helper Functions ====================

function getSessionKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CART_SESSION_KEY)
}

function setSessionKey(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_SESSION_KEY, key)
}

// ==================== Provider ====================

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getHeaders = useCallback((): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    const sessionKey = getSessionKey()
    if (sessionKey) {
      (headers as Record<string, string>)['X-Cart-Session'] = sessionKey
    }
    return headers
  }, [])

  const fetchCart = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/payments/cart/`, {
        headers: getHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch cart')
      }

      const data: Cart = await response.json()

      // Store session key for guest users
      if (data.session_key) {
        setSessionKey(data.session_key)
      }

      setCart(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cart')
    } finally {
      setIsLoading(false)
    }
  }, [getHeaders])

  const addToCart = useCallback(async (productId: number, quantity = 1) => {
    try {
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/payments/cart/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ product_id: productId, quantity }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.product_id?.[0] || errorData.quantity?.[0] || errorData.error || 'Failed to add to cart')
      }

      const data: Cart = await response.json()

      if (data.session_key) {
        setSessionKey(data.session_key)
      }

      setCart(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add to cart'
      setError(message)
      throw err
    }
  }, [getHeaders])

  const updateQuantity = useCallback(async (itemId: number, quantity: number) => {
    try {
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/payments/cart/items/${itemId}/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ quantity }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update quantity')
      }

      const data: Cart = await response.json()
      setCart(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update quantity'
      setError(message)
      throw err
    }
  }, [getHeaders])

  const removeItem = useCallback(async (itemId: number) => {
    try {
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/payments/cart/items/${itemId}/`, {
        method: 'DELETE',
        headers: getHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to remove item')
      }

      const data: Cart = await response.json()
      setCart(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove item'
      setError(message)
      throw err
    }
  }, [getHeaders])

  const clearCart = useCallback(async () => {
    try {
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/payments/cart/`, {
        method: 'DELETE',
        headers: getHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to clear cart')
      }

      // Reset cart state
      setCart(prev => prev ? { ...prev, items: [], item_count: 0, subtotal: '0.00' } : null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear cart'
      setError(message)
      throw err
    }
  }, [getHeaders])

  const checkout = useCallback(async (): Promise<{ url: string; session_id: string }> => {
    const successUrl = `${window.location.origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${window.location.origin}/shop/cancel`

    const response = await fetch(`${API_BASE_URL}/api/payments/checkout/cart/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create checkout session')
    }

    return response.json()
  }, [getHeaders])

  // Fetch cart on mount
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const value: CartContextType = {
    cart,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: fetchCart,
    checkout,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// ==================== Hook ====================

export function useCart(): CartContextType {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
