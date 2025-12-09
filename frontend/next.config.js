/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker production builds
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'scontent.cdninstagram.com',
      },
      // Local development - Django media files
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
      // Docker internal network
      {
        protocol: 'http',
        hostname: 'backend',
        port: '8000',
      },
      // Production backend
      {
        protocol: 'https',
        hostname: '*.njstarselite.com',
      },
      // Railway fallback
      {
        protocol: 'https',
        hostname: '*.up.railway.app',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
}

module.exports = nextConfig
