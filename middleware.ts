import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { SessionData, SESSION_OPTIONS } from './lib/session'
import { refreshAccessToken } from './lib/keycloak'

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/callback',
  '/api/auth/logout',
  '/_next',
  '/favicon.ico',
  '/public',
]

// Paths that are part of the shell or zone pages — need auth check
const PROTECTED_PAGE_PATHS = [
  '/dashboard',
  '/users',
  '/licenses',
  '/production',
  '/reports',
  '/settings',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow all public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Redirect root to dashboard
  if (pathname === '/') {
    const response = NextResponse.next()
    const session = await getIronSession<SessionData>(request, response, SESSION_OPTIONS)
    if (!session.accessToken) {
      return NextResponse.redirect(new URL('/api/auth/login', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect pages and API routes
  const isProtectedPage = PROTECTED_PAGE_PATHS.some((p) => pathname.startsWith(p))
  const isProtectedApi = pathname.startsWith('/api/') && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (isProtectedPage || isProtectedApi) {
    const response = NextResponse.next()
    const session = await getIronSession<SessionData>(request, response, SESSION_OPTIONS)

    // No session at all — redirect to login
    if (!session.accessToken) {
      if (isProtectedApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const loginUrl = new URL('/api/auth/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Token expiry check — attempt silent refresh if within 2 minutes of expiry
    const now = Date.now()
    const expiresAt = session.accessTokenExpiresAt || 0
    const twoMinutes = 2 * 60 * 1000

    if (expiresAt - now < twoMinutes) {
      const refreshed = await refreshAccessToken(session)
      if (!refreshed) {
        // Refresh failed — clear session and redirect to login
        session.destroy()
        if (isProtectedApi) {
          return NextResponse.json({ error: 'Session expired' }, { status: 401 })
        }
        const loginUrl = new URL('/api/auth/login', request.url)
        loginUrl.searchParams.set('returnUrl', pathname)
        return NextResponse.redirect(loginUrl)
      }
      await session.save()
    }

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
