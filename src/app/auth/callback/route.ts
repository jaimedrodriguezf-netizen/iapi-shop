import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSafeRedirect } from '@/lib/auth/url-utils'

// Whitelist of allowed hosts to prevent host header injection.
// Falls back to NEXT_PUBLIC_SITE_URL env var if set, otherwise these defaults.
const ALLOWED_HOSTS: string[] = [
  "iapi.shop",
  "www.iapi.shop",
  "localhost:3000",
  ...(process.env.NEXT_PUBLIC_SITE_URL
    ? [new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname]
    : []),
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect destination
  const next = searchParams.get('next') ?? '/perfil'
  const safeNext = isSafeRedirect(next) ? next : '/perfil'

  // Validate host against whitelist to prevent header injection.
  // x-forwarded-host is attacker-controllable, so we must not trust it blindly.
  const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000'
  const host = ALLOWED_HOSTS.includes(rawHost) ? rawHost : 'localhost:3000'
  const proto = request.headers.get('x-forwarded-proto') === 'https' ? 'https' : 'http'
  const origin = `${proto}://${host}`

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=OAuth%20Authentication%20Failed`)
}
