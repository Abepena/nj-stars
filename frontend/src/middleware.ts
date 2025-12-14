import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/auth'

// Public portal routes that don't require authentication
const PUBLIC_PORTAL_ROUTES = [
  '/portal/login',
  '/portal/register',
  '/portal/forgot-password',
  '/portal/reset-password',
  '/portal/verify-email',
]

export default auth((request) => {
  const { pathname } = request.nextUrl

  // Check if maintenance mode is enabled
  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'

  if (maintenanceMode) {
    // Allow access to the warming-up page itself
    if (pathname === '/warming-up') {
      return NextResponse.next()
    }

    // Allow access to static assets
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/brand') ||
      pathname.startsWith('/api') ||
      pathname.includes('.')
    ) {
      return NextResponse.next()
    }

    // Redirect all other pages to warming-up
    return NextResponse.redirect(new URL('/warming-up', request.url))
  }

  // Check if this is a protected portal route
  const isPortalRoute = pathname.startsWith('/portal')
  const isPublicPortalRoute = PUBLIC_PORTAL_ROUTES.some(route =>
    pathname.startsWith(route)
  )

  // If it's a protected portal route and user is not authenticated
  if (isPortalRoute && !isPublicPortalRoute && !request.auth) {
    // Redirect to login with the current URL as callback
    const loginUrl = new URL('/portal/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If user is authenticated and trying to access login/register, redirect to dashboard
  if (isPublicPortalRoute && request.auth) {
    const callbackUrl = request.nextUrl.searchParams.get('next')
    return NextResponse.redirect(new URL(callbackUrl || '/portal/dashboard', request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
