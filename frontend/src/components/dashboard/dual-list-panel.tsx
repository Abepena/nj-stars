"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon, GripVertical, Circle, CheckCircle2 } from "lucide-react"

// ==================== Types ====================

export interface DualListItem {
  id: string | number
  title: string
  subtitle?: string
  metadata?: string
  icon?: LucideIcon
}

export interface DualListPanelProps {
  // Panel configuration
  title: string
  description?: string
  icon?: LucideIcon
  
  // Left section (unchecked/pending)
  leftLabel: string
  leftItems: DualListItem[]
  leftEmptyMessage?: string
  
  // Right section (checked/active)
  rightLabel: string
  rightItems: DualListItem[]
  rightEmptyMessage?: string
  
  // Callbacks
  onToggleItem?: (item: DualListItem, checked: boolean) => void
  
  // Styling
  className?: string
  variant?: "default" | "compact"
}

// ==================== List Item Component ====================

interface ListItemProps {
  item: DualListItem
  isChecked: boolean
  onToggle: () => void
  onDragStart?: () => void
  onDragEnd?: () => void
  isDragging?: boolean
  variant?: "default" | "compact"
}

function ListItem({
  item,
  isChecked,
  onToggle,
  onDragStart,
  onDragEnd,
  isDragging,
  variant = "default",
}: ListItemProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border transition-all lg:cursor-grab lg:active:cursor-grabbing",
        isDragging && "opacity-50 scale-95",
        !isDragging && "hover:bg-muted/50",
        variant === "compact" && "p-2"
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Drag Handle */}
        <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0 hidden lg:block" />
        
        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className={cn(
            "font-medium truncate",
            variant === "compact" ? "text-xs" : "text-sm"
          )}>
            {item.title}
          </p>
          {item.subtitle && (
            <p className={cn(
              "text-muted-foreground truncate",
              variant === "compact" ? "text-[10px]" : "text-xs"
            )}>
              {item.subtitle}
            </p>
          )}
        </div>
        
        {/* Metadata */}
        {item.metadata && (
          <span className="text-xs text-muted-foreground whitespace-nowrap mr-2">
            {item.metadata}
          </span>
        )}
      </div>
      
      {/* Toggle Button - Radio Style */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={cn(
          "rounded-full flex items-center justify-center shrink-0 transition-all",
          variant === "compact" ? "h-7 w-7" : "h-9 w-9",
          isChecked 
            ? "bg-success text-background" 
            : "bg-muted hover:bg-success/20 text-muted-foreground hover:text-foreground border border-border hover:border-success/50"
        )}
        aria-label={isChecked ? "Checked in" : "Not checked in"}
      >
        {isChecked ? (
          <CheckCircle2 className={variant === "compact" ? "h-5 w-5" : "h-6 w-6"} />
        ) : (
          <Circle className={variant === "compact" ? "h-5 w-5" : "h-6 w-6"} />
        )}
      </button>
    </div>
  )
}

// ==================== Section Component ====================

interface SectionProps {
  label: string
  count: number
  items: DualListItem[]
  emptyMessage: string
  isCheckedSection: boolean
  onToggleItem: (item: DualListItem) => void
  draggingItem: DualListItem | null
  setDraggingItem: (item: DualListItem | null) => void
  onDropItem?: (item: DualListItem) => void
  variant?: "default" | "compact"
}

function Section({
  label,
  count,
  items,
  emptyMessage,
  isCheckedSection,
  onToggleItem,
  draggingItem,
  setDraggingItem,
  onDropItem,
  variant = "default",
}: SectionProps) {
  const [isDropTarget, setIsDropTarget] = useState(false)
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (draggingItem) {
      setIsDropTarget(true)
    }
  }, [draggingItem])
  
  const handleDragLeave = useCallback(() => {
    setIsDropTarget(false)
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDropTarget(false)
    if (draggingItem && onDropItem) {
      onDropItem(draggingItem)
    }
  }, [draggingItem, onDropItem])
  
  return (
    <div
      className={cn(
        "flex-1 min-w-0 transition-all rounded-lg p-3",
        isDropTarget && "bg-success/10 ring-1 ring-success/30"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
        <span className={cn(
          "text-xs font-medium px-2 py-0.5 rounded-full",
          isCheckedSection 
            ? "bg-success/20 text-success" 
            : "bg-muted text-muted-foreground"
        )}>
          {count}
        </span>
      </div>
      
      {/* Items */}
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <ListItem
              key={item.id}
              item={item}
              isChecked={isCheckedSection}
              onToggle={() => onToggleItem(item)}
              onDragStart={() => setDraggingItem(item)}
              onDragEnd={() => setDraggingItem(null)}
              isDragging={draggingItem?.id === item.id}
              variant={variant}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  )
}

// ==================== Main Component ====================

export function DualListPanel({
  title,
  description,
  icon: Icon,
  leftLabel,
  leftItems,
  leftEmptyMessage = "No items",
  rightLabel,
  rightItems,
  rightEmptyMessage = "No items",
  onToggleItem,
  className,
  variant = "default",
}: DualListPanelProps) {
  const [draggingItem, setDraggingItem] = useState<DualListItem | null>(null)
  const [dragSourceChecked, setDragSourceChecked] = useState<boolean | null>(null)
  
  const handleDragStart = useCallback((item: DualListItem, isChecked: boolean) => {
    setDraggingItem(item)
    setDragSourceChecked(isChecked)
  }, [])
  
  const handleDragEnd = useCallback(() => {
    setDraggingItem(null)
    setDragSourceChecked(null)
  }, [])
  
  const handleDropOnLeft = useCallback((item: DualListItem) => {
    if (dragSourceChecked === true && onToggleItem) {
      onToggleItem(item, false) // Uncheck
    }
    handleDragEnd()
  }, [dragSourceChecked, onToggleItem, handleDragEnd])
  
  const handleDropOnRight = useCallback((item: DualListItem) => {
    if (dragSourceChecked === false && onToggleItem) {
      onToggleItem(item, true) // Check
    }
    handleDragEnd()
  }, [dragSourceChecked, onToggleItem, handleDragEnd])
  
  const handleToggleLeft = (item: DualListItem) => {
    onToggleItem?.(item, true) // Check in
  }
  
  const handleToggleRight = (item: DualListItem) => {
    onToggleItem?.(item, false) // Check out
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className={cn(
          "flex items-center gap-2",
          variant === "compact" ? "text-base" : "text-lg"
        )}>
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
          {title}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Section (Unchecked/Pending) */}
          <Section
            label={leftLabel}
            count={leftItems.length}
            items={leftItems}
            emptyMessage={leftEmptyMessage}
            isCheckedSection={false}
            onToggleItem={handleToggleLeft}
            draggingItem={dragSourceChecked === true ? draggingItem : null}
            setDraggingItem={(item) => item ? handleDragStart(item, false) : handleDragEnd()}
            onDropItem={handleDropOnLeft}
            variant={variant}
          />
          
          {/* Divider */}
          <div className="hidden lg:flex items-center">
            <div className="w-px h-full bg-border min-h-[100px]" />
          </div>
          <div className="lg:hidden border-t border-border" />
          
          {/* Right Section (Checked/Active) */}
          <Section
            label={rightLabel}
            count={rightItems.length}
            items={rightItems}
            emptyMessage={rightEmptyMessage}
            isCheckedSection={true}
            onToggleItem={handleToggleRight}
            draggingItem={dragSourceChecked === false ? draggingItem : null}
            setDraggingItem={(item) => item ? handleDragStart(item, true) : handleDragEnd()}
            onDropItem={handleDropOnRight}
            variant={variant}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default DualListPanel
