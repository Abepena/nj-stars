"use client"

import { useState, useCallback, useMemo } from "react"
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { MapPin, Calendar, Clock, DollarSign } from "lucide-react"

interface Event {
  id: number
  title: string
  event_type: string
  start_datetime: string
  end_datetime: string
  location: string
  latitude?: number
  longitude?: number
  price: string
  requires_payment: boolean
}

interface EventMapProps {
  events: Event[]
  selectedEventId?: number | null
  onEventSelect?: (eventId: number) => void
  className?: string
}

// Event type colors for markers (hex values for Google Maps)
const EVENT_TYPE_COLORS: Record<string, { hex: string; label: string }> = {
  open_gym: { hex: "#3eb489", label: "Open Gym" },     // success/green
  tryout: { hex: "#5a8fd8", label: "Tryout" },        // info/blue
  game: { hex: "#d45d6e", label: "Game" },            // accent/red
  practice: { hex: "#d4a35a", label: "Practice" },    // warning/amber
  tournament: { hex: "#1ab4c7", label: "Tournament" }, // secondary/teal
  camp: { hex: "#d4a821", label: "Camp" },            // tertiary/amber
}

// Default center: Central New Jersey
const DEFAULT_CENTER = {
  lat: 40.4774,
  lng: -74.2591,
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
}

// Dark mode map styling
const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
]

// Create SVG marker icon with custom color
function createMarkerIcon(color: string, isSelected: boolean): google.maps.Symbol {
  const scale = isSelected ? 1.3 : 1
  return {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: color,
    fillOpacity: 1,
    strokeColor: isSelected ? "#ffffff" : "#000000",
    strokeWeight: isSelected ? 2 : 1,
    scale: scale,
    anchor: { x: 12, y: 22 } as google.maps.Point,
  }
}

export function EventMap({
  events,
  selectedEventId,
  onEventSelect,
  className,
}: EventMapProps) {
  const [activeInfoWindow, setActiveInfoWindow] = useState<number | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  // Filter events that have coordinates
  const mappableEvents = useMemo(
    () => events.filter((e) => e.latitude && e.longitude),
    [events]
  )

  // Calculate map bounds to fit all markers
  const bounds = useMemo(() => {
    if (mappableEvents.length === 0) return null
    if (typeof google === "undefined") return null

    const bounds = new google.maps.LatLngBounds()
    mappableEvents.forEach((event) => {
      if (event.latitude && event.longitude) {
        bounds.extend({ lat: Number(event.latitude), lng: Number(event.longitude) })
      }
    })
    return bounds
  }, [mappableEvents])

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      if (bounds && mappableEvents.length > 1) {
        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
      }
    },
    [bounds, mappableEvents.length]
  )

  const handleMarkerClick = (eventId: number) => {
    setActiveInfoWindow(eventId)
    onEventSelect?.(eventId)
  }

  if (loadError) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/50 rounded-lg", className)}>
        <div className="text-center p-6">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Failed to load map</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/50 rounded-lg animate-pulse", className)}>
        <div className="text-center p-6">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  if (mappableEvents.length === 0) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/50 rounded-lg", className)}>
        <div className="text-center p-6">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No events with location data</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Events will appear here when coordinates are added
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative rounded-lg overflow-hidden border border-border", className)}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mappableEvents.length === 1
          ? { lat: Number(mappableEvents[0].latitude), lng: Number(mappableEvents[0].longitude) }
          : DEFAULT_CENTER
        }
        zoom={mappableEvents.length === 1 ? 14 : 10}
        onLoad={onMapLoad}
        options={{
          styles: darkMapStyles,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        {mappableEvents.map((event) => {
          const typeColor = EVENT_TYPE_COLORS[event.event_type] || { hex: "#888888", label: event.event_type }
          const isSelected = selectedEventId === event.id

          return (
            <Marker
              key={event.id}
              position={{ lat: Number(event.latitude), lng: Number(event.longitude) }}
              icon={createMarkerIcon(typeColor.hex, isSelected)}
              onClick={() => handleMarkerClick(event.id)}
              zIndex={isSelected ? 1000 : 1}
            >
              {activeInfoWindow === event.id && (
                <InfoWindow
                  onCloseClick={() => setActiveInfoWindow(null)}
                >
                  <div className="p-1 max-w-[200px]">
                    <div className="flex items-center gap-1 mb-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: typeColor.hex }}
                      />
                      <span className="text-xs text-gray-500">{typeColor.label}</span>
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 mb-1">
                      {event.title}
                    </h3>
                    <div className="space-y-0.5 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(event.start_datetime), "MMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(event.start_datetime), "h:mm a")}
                      </div>
                      {event.requires_payment && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${event.price}
                        </div>
                      )}
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          )
        })}
      </GoogleMap>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm rounded-lg p-2 border border-border shadow-lg">
        <div className="text-xs font-medium text-muted-foreground mb-1.5">Event Types</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {Object.entries(EVENT_TYPE_COLORS).map(([type, { hex, label }]) => {
            const hasEvents = mappableEvents.some((e) => e.event_type === type)
            if (!hasEvents) return null
            return (
              <div key={type} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: hex }}
                />
                <span className="text-xs text-foreground/80">{label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
