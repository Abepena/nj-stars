/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker production builds
  output: 'standalone',

  images: {
    domains: [
      'images.unsplash.com',
      'scontent.cdninstagram.com',
      'scontent-*.cdninstagram.com'
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
}

module.exports = nextConfig
