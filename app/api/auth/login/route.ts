import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { SessionData, SESSION_OPTIONS } from '@/lib/session'
import {
  generateRandomString,
  generateCodeChallenge,
  buildAuthorizationUrl,
} from '@/lib/keycloak'

const SHELL_URL = process.env.NEXT_PUBLIC_SHELL_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, SESSION_OPTIONS)

  // Generate PKCE parameters
  const codeVerifier = generateRandomString(64)
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const state = generateRandomString(32)

  // Store in session for callback verification
  session.codeVerifier = codeVerifier
  session.oauthState = state
  session.returnUrl = request.nextUrl.searchParams.get('returnUrl') || '/dashboard'
  await session.save()

  const redirectUri = `${SHELL_URL}/api/auth/callback`
  const authUrl = buildAuthorizationUrl({ codeChallenge, state, redirectUri })

  return NextResponse.redirect(authUrl)
}
