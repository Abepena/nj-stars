'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const BAG_SESSION_KEY = 'nj-stars-bag-session'
const CHECKOUT_ITEMS_KEY = 'nj-stars-checkout-items'

// ==================== Types ====================

export interface BagProduct {
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

export interface BagItem {
  id: number
  product: BagProduct
  quantity: number
  selected_size?: string | null
  selected_color?: string | null
  total_price: string
  is_available: boolean
  added_at: string
}

export interface Bag {
  id: number
  items: BagItem[]
  item_count: number
  subtotal: string
  session_key?: string
  created_at: string
  updated_at: string
}

interface BagContextType {
  bag: Bag | null
  isLoading: boolean
  error: string | null
  selectedItems: Set<number>
  toggleItemSelection: (itemId: number) => void
  selectAllItems: () => void
  deselectAllItems: () => void
  getSelectedSubtotal: () => string
  getSelectedCount: () => number
  addToBag: (productId: number, quantity?: number, selectedSize?: string, selectedColor?: string) => Promise<void>
  updateQuantity: (itemId: number, quantity: number) => Promise<void>
  removeItem: (itemId: number) => Promise<void>
  removeItems: (itemIds: number[]) => Promise<void>
  clearBag: () => Promise<void>
  refreshBag: () => Promise<void>
  checkout: (itemIds?: number[]) => Promise<{ url: string; session_id: string }>
}

// ==================== Context ====================

const BagContext = createContext<BagContextType | null>(null)

// ==================== Helper Functions ====================

function getSessionKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(BAG_SESSION_KEY)
}

function setSessionKey(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(BAG_SESSION_KEY, key)
}

// Helper to get and clear pending checkout items (for success page fallback)
export function getPendingCheckoutItems(): number[] {
  if (typeof window === 'undefined') return []
  const items = localStorage.getItem(CHECKOUT_ITEMS_KEY)
  return items ? JSON.parse(items) : []
}

export function clearPendingCheckoutItems(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CHECKOUT_ITEMS_KEY)
}

// ==================== Provider ====================

export function BagProvider({ children }: { children: React.ReactNode }) {
  const [bag, setBag] = useState<Bag | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

  const getHeaders = useCallback((): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    const sessionKey = getSessionKey()
    if (sessionKey) {
      (headers as Record<string, string>)['X-Bag-Session'] = sessionKey
    }
    return headers
  }, [])

  const fetchBag = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/payments/bag/`, {
        headers: getHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch bag')
      }

      const data: Bag = await response.json()

      // Store session key for guest users
      if (data.session_key) {
        setSessionKey(data.session_key)
      }

      setBag(data)
      // Auto-select all available items when bag is loaded
      if (data.items.length > 0) {
        setSelectedItems(new Set(data.items.filter(item => item.is_available).map(item => item.id)))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bag')
    } finally {
      setIsLoading(false)
    }
  }, [getHeaders])

  // Selection helpers
  const toggleItemSelection = useCallback((itemId: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }, [])

  const selectAllItems = useCallback(() => {
    if (!bag) return
    setSelectedItems(new Set(bag.items.filter(item => item.is_available).map(item => item.id)))
  }, [bag])

  const deselectAllItems = useCallback(() => {
    setSelectedItems(new Set())
  }, [])

  const getSelectedSubtotal = useCallback((): string => {
    if (!bag) return '0.00'
    const total = bag.items
      .filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + parseFloat(item.total_price), 0)
    return total.toFixed(2)
  }, [bag, selectedItems])

  const getSelectedCount = useCallback((): number => {
    if (!bag) return 0
    return bag.items
      .filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + item.quantity, 0)
  }, [bag, selectedItems])

  const addToBag = useCallback(async (productId: number, quantity = 1, selectedSize?: string, selectedColor?: string) => {
    try {
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/payments/bag/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          product_id: productId,
          quantity,
          selected_size: selectedSize || null,
          selected_color: selectedColor || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.product_id?.[0] || errorData.quantity?.[0] || errorData.error || 'Failed to add to bag')
      }

      const data: Bag = await response.json()

      if (data.session_key) {
        setSessionKey(data.session_key)
      }

      setBag(data)
      // Auto-select newly added item
      const newItem = data.items.find(item => item.product.id === productId)
      if (newItem) {
        setSelectedItems(prev => new Set(prev).add(newItem.id))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add to bag'
      setError(message)
      throw err
    }
  }, [getHeaders])

  const updateQuantity = useCallback(async (itemId: number, quantity: number) => {
    try {
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/payments/bag/items/${itemId}/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ quantity }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update quantity')
      }

      const data: Bag = await response.json()
      setBag(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update quantity'
      setError(message)
      throw err
    }
  }, [getHeaders])

  const removeItem = useCallback(async (itemId: number) => {
    try {
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/payments/bag/items/${itemId}/`, {
        method: 'DELETE',
        headers: getHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to remove item')
      }

      const data: Bag = await response.json()
      setBag(data)
      // Remove from selection
      setSelectedItems(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove item'
      setError(message)
      throw err
    }
  }, [getHeaders])

  const removeItems = useCallback(async (itemIds: number[]) => {
    // Remove multiple items sequentially
    // This is used after successful checkout to remove only purchased items
    try {
      setError(null)
      for (const itemId of itemIds) {
        const response = await fetch(`${API_BASE_URL}/api/payments/bag/items/${itemId}/`, {
          method: 'DELETE',
          headers: getHeaders(),
        })
        // Continue even if item is already removed (404 is ok)
        if (!response.ok && response.status !== 404) {
          console.warn(`Failed to remove item ${itemId}`)
        }
      }
      // Refresh bag to get updated state
      const response = await fetch(`${API_BASE_URL}/api/payments/bag/`, {
        headers: getHeaders(),
      })
      if (response.ok) {
        const data: Bag = await response.json()
        setBag(data)
        // Update selected items - remove the deleted ones
        setSelectedItems(prev => {
          const next = new Set(prev)
          itemIds.forEach(id => next.delete(id))
          return next
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove items'
      setError(message)
      throw err
    }
  }, [getHeaders])

  const clearBag = useCallback(async () => {
    try {
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/payments/bag/`, {
        method: 'DELETE',
        headers: getHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to clear bag')
      }

      // Reset bag state
      setBag(prev => prev ? { ...prev, items: [], item_count: 0, subtotal: '0.00' } : null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear bag'
      setError(message)
      throw err
    }
  }, [getHeaders])

  const checkout = useCallback(async (itemIds?: number[]): Promise<{ url: string; session_id: string }> => {
    const successUrl = `${window.location.origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${window.location.origin}/shop/cancel`

    // Use provided itemIds, or fall back to selected items
    const checkoutItemIds = itemIds || Array.from(selectedItems)

    const response = await fetch(`${API_BASE_URL}/api/payments/checkout/bag/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        success_url: successUrl,
        cancel_url: cancelUrl,
        item_ids: checkoutItemIds.length > 0 ? checkoutItemIds : undefined,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create checkout session')
    }

    const data = await response.json()

    // Store the checkout item IDs in localStorage before redirecting to Stripe
    // This is a fallback in case Stripe's session retrieval fails
    if (typeof window !== 'undefined') {
      localStorage.setItem(CHECKOUT_ITEMS_KEY, JSON.stringify(checkoutItemIds))
    }

    return data
  }, [getHeaders, selectedItems])

  // Fetch bag on mount
  useEffect(() => {
    fetchBag()
  }, [fetchBag])

  const value: BagContextType = {
    bag,
    isLoading,
    error,
    selectedItems,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    getSelectedSubtotal,
    getSelectedCount,
    addToBag,
    updateQuantity,
    removeItem,
    removeItems,
    clearBag,
    refreshBag: fetchBag,
    checkout,
  }

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>
}

// ==================== Hook ====================

export function useBag(): BagContextType {
  const context = useContext(BagContext)
  if (!context) {
    throw new Error('useBag must be used within a BagProvider')
  }
  return context
}
