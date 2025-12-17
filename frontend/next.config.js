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
      // Production backend - Django media files
      {
        protocol: 'https',
        hostname: 'api.njstarselite.com',
      },
      // Printify mockup images
      {
        protocol: 'https',
        hostname: 'images-api.printify.com',
      },
      // Printify S3 product mockup images
      {
        protocol: 'https',
        hostname: 'pfy-prod-products-mockup-media.s3.us-east-2.amazonaws.com',
      },
      // Railway default domains
      {
        protocol: 'https',
        hostname: '*.up.railway.app',
      },
      // Local development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
}

module.exports = nextConfig
