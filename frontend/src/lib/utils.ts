import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if an image URL should skip Next.js image optimization.
 * Local media URLs (localhost, /media/) need to skip optimization because
 * the Next.js server can't reach localhost:8000 from inside Docker.
 */
export function shouldSkipImageOptimization(url: string | null | undefined): boolean {
  if (!url) return false
  return url.includes('localhost') || url.includes('/media/')
}
