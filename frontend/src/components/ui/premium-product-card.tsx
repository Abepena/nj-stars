import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface PremiumProductCardProps {
  id: number
  slug: string
  title: string
  price: number
  image?: string
  featured?: boolean
  onClick?: () => void
  className?: string
}

export function PremiumProductCard({
  id,
  slug,
  title,
  price,
  image,
  featured = false,
  onClick,
  className,
}: PremiumProductCardProps) {
  const href = `/shop/${slug}`

  const content = (
    <div className="flex flex-col h-full">
      {/* Image Container */}
      <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden bg-bg-secondary border border-white/8 flex items-center justify-center group">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="text-text-tertiary text-sm">No image</div>
        )}

        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-3 right-3 bg-primary/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
            Featured
          </div>
        )}

        {/* Icon Watermark Drop-Shadow Effect */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            filter:
              "drop-shadow(0 4px 12px rgba(227, 24, 95, 0.15)) drop-shadow(0 2px 6px rgba(227, 24, 95, 0.1))",
          }}
        >
          <svg
            className="w-16 h-16 text-primary/30"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 2c-1.105 0-2 .895-2 2v4H5c-1.105 0-2 .895-2 2v10c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V10c0-1.105-.895-2-2-2h-2V4c0-1.105-.895-2-2-2H9zm0 2h6v4H9V4zm-4 6h14v10H5V10z" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-base font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>

        {/* Description spacer */}
        <p className="text-xs text-text-tertiary flex-1 mb-3">Premium apparel</p>

        {/* Price */}
        <div className="text-lg font-bold text-primary">
          ${price.toFixed(2)}
        </div>
      </div>
    </div>
  )

  const cardClasses = cn(
    "group bg-bg-secondary border border-white/8 rounded-lg p-4 transition-all duration-300 cursor-pointer",
    "hover:border-primary/40 hover:shadow-[0_12px_48px_rgba(227,24,95,0.08)] hover:translate-y-[-2px]",
    className
  )

  if (onClick) {
    return (
      <button className={cardClasses} onClick={onClick}>
        {content}
      </button>
    )
  }

  return (
    <Link href={href} className={cardClasses}>
      {content}
    </Link>
  )
}
