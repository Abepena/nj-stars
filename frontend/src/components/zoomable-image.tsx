"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { X, ZoomIn } from "lucide-react"
import { cn } from "@/lib/utils"

interface ZoomableImageProps {
  src: string
  alt: string
  unoptimized?: boolean
  priority?: boolean
}

// Zoomable image component with hover zoom on desktop, tap-to-fullscreen on mobile
export function ZoomableImage({ src, alt, unoptimized, priority }: ZoomableImageProps) {
  const [isZooming, setIsZooming] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  const handleMouseEnter = () => setIsZooming(true)
  const handleMouseLeave = () => setIsZooming(false)

  // Mobile: tap to open fullscreen
  const handleTap = () => {
    // Only trigger fullscreen on mobile (touch devices)
    if (window.matchMedia("(hover: none)").matches) {
      setIsFullscreen(true)
    }
  }

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full h-full cursor-zoom-in overflow-hidden group"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleTap}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className={cn(
            "object-contain transition-transform duration-200 ease-out",
            isZooming && "scale-[2]"
          )}
          style={isZooming ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` } : undefined}
          unoptimized={unoptimized}
          priority={priority}
        />
        {/* Mobile zoom hint */}
        <div className="absolute bottom-3 right-3 md:hidden bg-background/80 backdrop-blur-sm rounded-full p-2 opacity-70">
          <ZoomIn className="w-4 h-4" />
        </div>
        {/* Desktop zoom hint - shows briefly on hover */}
        <div
          className={cn(
            "absolute bottom-3 right-3 hidden md:flex items-center gap-1.5 bg-background/80 backdrop-blur-sm rounded-full px-2.5 py-1.5 text-xs transition-opacity duration-300",
            isZooming ? "opacity-0" : "opacity-70 group-hover:opacity-100"
          )}
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span>Hover to zoom</span>
        </div>
      </div>

      {/* Fullscreen lightbox for mobile */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
            onClick={() => setIsFullscreen(false)}
            aria-label="Close fullscreen"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            Pinch to zoom · Tap to close
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain touch-manipulation"
            style={{ touchAction: "pinch-zoom" }}
          />
        </div>
      )}
    </>
  )
}
