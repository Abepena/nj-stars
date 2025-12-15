"use client"

import { useState } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown, MapPin, Clock, Calendar, DollarSign } from "lucide-react"

interface Event {
  id: number
  title: string
  slug: string
  description: string
  event_type: string
  start_datetime: string
  end_datetime: string
  location: string
  latitude?: number
  longitude?: number
  max_participants?: number
  price: string
  requires_payment: boolean
  spots_remaining: number | null
  is_full: boolean
  is_registration_open: boolean
  image_url?: string
}

interface EventCardHorizontalProps {
  event: Event
  onRegisterClick: () => void
  isRegistered?: boolean
  isHighlighted?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  typeConfig: {
    label: string
    className: string
    bgClassName: string
    calendarText?: string
  }
}

export function EventCardHorizontal({
  event,
  onRegisterClick,
  isRegistered,
  isHighlighted,
  onMouseEnter,
  onMouseLeave,
  typeConfig,
}: EventCardHorizontalProps) {
  const [expanded, setExpanded] = useState(false)

  const formattedDate = format(new Date(event.start_datetime), "EEE, MMM d")
  const startTime = format(new Date(event.start_datetime), "h:mm a")
  const endTime = format(new Date(event.end_datetime), "h:mm a")

  return (
    <article
      id={`event-card-${event.id}`}
      className={cn(
        "bg-card rounded-lg border border-border overflow-hidden transition-all duration-200",
        isHighlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        "hover:border-border/80"
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Main Row - Always Visible */}
      <div
        className="flex gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Thumbnail Image */}
        <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted relative">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Image
                src="/brand/logos/logo square thick muted.svg"
                alt={event.title}
                width={40}
                height={40}
                className="opacity-30"
              />
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          {/* Left Side - Main Info */}
          <div className="flex-1 min-w-0">
            {/* Type Badge */}
            <span className={cn(
              "inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1",
              typeConfig.bgClassName,
              typeConfig.calendarText || "text-white"
            )}>
              {typeConfig.label}
            </span>

            {/* Title */}
            <h3 className="font-semibold text-sm sm:text-base truncate pr-2">
              {event.title}
            </h3>

            {/* Date & Time */}
            <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {startTime}
              </span>
            </div>

            {/* Location */}
            {event.location && (
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-1 truncate">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </p>
            )}
          </div>

          {/* Right Side - Price & Status */}
          <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
            <p className={cn(
              "text-sm sm:text-base font-semibold",
              event.requires_payment ? "text-foreground" : "text-success"
            )}>
              {event.requires_payment ? `$${event.price}` : 'FREE'}
            </p>

            {isRegistered ? (
              <span className="flex items-center gap-1 text-xs font-medium text-success">
                <Check className="w-3.5 h-3.5" />
                Registered
              </span>
            ) : event.spots_remaining !== null && event.spots_remaining <= 10 ? (
              <span className="text-xs text-accent font-medium">
                {event.spots_remaining} spots left
              </span>
            ) : null}
          </div>

          {/* Expand Chevron */}
          <div className="hidden sm:flex items-center">
            <ChevronDown
              className={cn(
                "w-5 h-5 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-3 sm:px-4 pb-4 pt-0 border-t border-border">
          <div className="pt-4 space-y-4">
            {/* Full Description */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">About This Event</h4>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {event.description}
              </p>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(event.start_datetime), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{startTime} - {endTime}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{event.location}</span>
              </div>
              {event.max_participants && (
                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                  <DollarSign className="w-4 h-4" />
                  <span>
                    {event.requires_payment ? `$${event.price}` : 'Free'} ·
                    {event.spots_remaining !== null
                      ? ` ${event.spots_remaining} of ${event.max_participants} spots available`
                      : ` ${event.max_participants} spots total`
                    }
                  </span>
                </div>
              )}
            </div>

            {/* Register Button */}
            <div className="flex items-center gap-3 pt-2">
              {isRegistered ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-lg text-success">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">You're registered for this event</span>
                </div>
              ) : event.is_registration_open ? (
                <Button
                  size="lg"
                  className="flex-1 sm:flex-none min-w-[200px]"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRegisterClick()
                  }}
                >
                  Register Now
                  {event.requires_payment && (
                    <span className="ml-2 opacity-80">· ${event.price}</span>
                  )}
                </Button>
              ) : event.is_full ? (
                <Button variant="secondary" size="lg" disabled className="flex-1 sm:flex-none">
                  Event Full
                </Button>
              ) : (
                <Button variant="secondary" size="lg" disabled className="flex-1 sm:flex-none">
                  Registration Closed
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Expand Indicator */}
      <div
        className="sm:hidden flex items-center justify-center py-2 border-t border-border cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronDown
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
        <span className="text-xs text-muted-foreground ml-1">
          {expanded ? "Show less" : "Show more"}
        </span>
      </div>
    </article>
  )
}
