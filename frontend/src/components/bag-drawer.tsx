'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useBag, BagItem } from '@/lib/bag'
import { shouldSkipImageOptimization } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react'
import { ReturnPolicyModal } from '@/components/return-policy-modal'

interface BagDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Get the best image URL for a bag item based on selected color variant.
 * Falls back to primary_image_url or image_url if no variant match found.
 */
function getItemImageUrl(item: BagItem): string | null {
  const { product, selected_color } = item

  // If color is selected, try to find a variant-specific image
  if (selected_color && product.images?.length > 0 && product.variants?.length > 0) {
    // Find variant IDs for the selected color
    const colorVariantIds = product.variants
      .filter(v => v.color === selected_color)
      .map(v => v.printify_variant_id)
      .filter((id): id is number => id !== null)

    if (colorVariantIds.length > 0) {
      // Find an image that matches any of the variant IDs
      const variantImage = product.images.find(img =>
        img.printify_variant_ids?.some(id => colorVariantIds.includes(id))
      )
      if (variantImage?.url) {
        return variantImage.url
      }
    }
  }

  // Fallback: primary_image_url > first image > legacy image_url
  return product.primary_image_url || product.images?.[0]?.url || product.image_url || null
}

export function BagDrawer({ open, onOpenChange }: BagDrawerProps) {
  const {
    bag,
    isLoading,
    updateQuantity,
    removeItem,
    checkout,
    selectedItems,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    getSelectedSubtotal,
    getSelectedCount,
  } = useBag()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set())

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 0) return

    setUpdatingItems(prev => new Set(prev).add(itemId))
    try {
      if (newQuantity === 0) {
        await removeItem(itemId)
      } else {
        await updateQuantity(itemId, newQuantity)
      }
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const handleRemove = async (itemId: number) => {
    setUpdatingItems(prev => new Set(prev).add(itemId))
    try {
      await removeItem(itemId)
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    try {
      const { url } = await checkout()
      window.location.href = url
    } catch (error) {
      console.error('Checkout failed:', error)
      setCheckoutLoading(false)
    }
  }

  const itemCount = bag?.item_count || 0
  const selectedCount = getSelectedCount()
  const selectedSubtotal = getSelectedSubtotal()
  const allAvailableSelected = bag?.items.filter(item => item.is_available).every(item => selectedItems.has(item.id)) ?? false
  const hasSelectedItems = selectedItems.size > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg !bg-black/60 backdrop-blur-2xl border-l border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <SheetHeader className="space-y-2.5 pr-6">
          <SheetTitle className="flex items-center gap-2 text-white">
            <ShoppingBag className="h-5 w-5" />
            Your Bag
            {itemCount > 0 && (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <Separator className="my-4 bg-white/20" />

        {/* Select All / Deselect All */}
        {bag && bag.items.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={allAvailableSelected ? deselectAllItems : selectAllItems}
              className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  allAvailableSelected
                    ? 'bg-primary border-primary'
                    : 'border-white/30 hover:border-white/50'
                }`}
              >
                {allAvailableSelected && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              {allAvailableSelected ? 'Deselect all' : 'Select all'}
            </button>
            {hasSelectedItems && (
              <span className="text-sm text-white/60">
                {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !bag || bag.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag className="h-16 w-16 text-white/30" />
            <div>
              <p className="text-lg font-medium text-white">Your bag is empty</p>
              <p className="text-sm text-white/60">
                Add some items to get started
              </p>
            </div>
            <SheetClose asChild>
              <Button asChild className="border-2 border-white/30 bg-white/10 hover:bg-white/20 text-white">
                <Link href="/shop">Continue Shopping</Link>
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {bag.items.map(item => {
                  const isUpdating = updatingItems.has(item.id)
                  const isSelected = selectedItems.has(item.id)
                  const price = parseFloat(item.product.price)
                  const comparePrice = item.product.compare_at_price
                    ? parseFloat(item.product.compare_at_price)
                    : null

                  return (
                    <div
                      key={item.id}
                      className={`flex gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-all ${
                        isUpdating ? 'opacity-50' : ''
                      } ${!item.is_available ? 'border-destructive/50 bg-destructive/10' : ''} ${
                        isSelected ? 'border-primary/50 bg-primary/10' : ''
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <button
                        onClick={() => item.is_available && toggleItemSelection(item.id)}
                        disabled={!item.is_available}
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors self-center ${
                          isSelected
                            ? 'bg-primary border-primary'
                            : item.is_available
                            ? 'border-white/30 hover:border-white/50'
                            : 'border-white/20 cursor-not-allowed'
                        }`}
                        aria-label={isSelected ? 'Deselect item' : 'Select item'}
                      >
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </button>

                      {/* Product Image */}
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                        {(() => {
                          const imageUrl = getItemImageUrl(item)
                          return imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={item.product.name}
                              fill
                              className="object-contain"
                              unoptimized={shouldSkipImageOptimization(imageUrl)}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                          )
                        })()}
                      </div>

                      {/* Product Details */}
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="line-clamp-1 font-medium text-white">
                              {item.product.name}
                            </h4>
                            <p className="text-xs text-white/60 capitalize">
                              {item.product.category}
                              {(item.selected_size || item.selected_color) && ' • '}
                              {item.selected_color && item.selected_color}
                              {item.selected_color && item.selected_size && ' / '}
                              {item.selected_size && `Size ${item.selected_size}`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/50 hover:text-destructive hover:bg-white/10"
                            onClick={() => handleRemove(item.id)}
                            disabled={isUpdating}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {!item.is_available && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            Out of stock
                          </div>
                        )}

                        <div className="mt-auto flex items-center justify-between pt-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center border border-white/30 rounded bg-white/10">
                            <button
                              className="w-8 h-8 flex items-center justify-center hover:bg-white/20 transition-colors text-white disabled:opacity-50"
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity - 1)
                              }
                              disabled={isUpdating}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-white border-x border-white/30">
                              {item.quantity}
                            </span>
                            <button
                              className="w-8 h-8 flex items-center justify-center hover:bg-white/20 transition-colors text-white disabled:opacity-50"
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity + 1)
                              }
                              disabled={isUpdating || !item.is_available}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="font-semibold text-white">
                              ${parseFloat(item.total_price).toFixed(2)}
                            </p>
                            {comparePrice && comparePrice > price && (
                              <p className="text-xs text-white/50 line-through">
                                ${(comparePrice * item.quantity).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <div className="space-y-4 pt-4">
              <Separator className="bg-white/20" />

              {/* Selected Items Subtotal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">
                    Selected ({selectedCount} item{selectedCount !== 1 ? 's' : ''})
                  </span>
                  <span className="font-medium text-white">${selectedSubtotal}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Shipping</span>
                  <span className="text-white/60">
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <Separator className="bg-white/20" />

              <div className="flex items-center justify-between text-lg font-semibold text-white">
                <span>Total</span>
                <span>${selectedSubtotal}</span>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  className="w-full h-12 text-base font-semibold bg-primary/30 hover:bg-primary/50 text-white border-2 border-primary backdrop-blur-sm disabled:opacity-50"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={checkoutLoading || !hasSelectedItems || bag.items.filter(item => selectedItems.has(item.id)).some(item => !item.is_available)}
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : !hasSelectedItems ? (
                    'Select items to checkout'
                  ) : (
                    `Checkout (${selectedCount} item${selectedCount !== 1 ? 's' : ''})`
                  )}
                </Button>
                <SheetClose asChild>
                  <Button className="w-full h-12 border-2 border-white/30 bg-white/10 hover:bg-white/20 text-white" size="lg">
                    Continue Shopping
                  </Button>
                </SheetClose>
                <div className="text-center pt-3">
                  <ReturnPolicyModal className="text-sm text-white/70 hover:text-white underline underline-offset-4 transition-colors" />
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
