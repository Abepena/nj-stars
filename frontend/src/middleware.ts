import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if maintenance mode is enabled
  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'

  if (maintenanceMode) {
    // Allow access to the under-construction page itself
    if (request.nextUrl.pathname === '/under-construction') {
      return NextResponse.next()
    }

    // Allow access to static assets
    if (
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/brand') ||
      request.nextUrl.pathname.startsWith('/api') ||
      request.nextUrl.pathname.includes('.')
    ) {
      return NextResponse.next()
    }

    // Redirect all other pages to under-construction
    return NextResponse.redirect(new URL('/under-construction', request.url))
  }

  return NextResponse.next()
}

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
