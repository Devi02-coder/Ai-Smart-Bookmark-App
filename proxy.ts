import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ✅ NEXT.JS 16 CONVENTION: Export must be named 'proxy' or be default
export default async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();

  // 1. AUTH BYPASS: Let Supabase auth traffic through
  if (
    url.pathname.startsWith('/auth') || 
    url.searchParams.has('code') || 
    url.searchParams.has('error')
  ) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 🛡️ REDIRECT LOGIC
  
  // Case A: If no user and on dashboard -> Go Home
  if (!user && url.pathname.startsWith('/dashboard')) {
    url.pathname = '/';
    const response = NextResponse.redirect(url);
    // ✅ FIX: Pass the cookie object directly to avoid the '.options' type error
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });
    return response;
  }

  // Case B: If user exists and on home -> Go Dashboard
  if (user && url.pathname === '/') {
    url.pathname = '/dashboard';
    const response = NextResponse.redirect(url);
    // ✅ FIX: Pass the cookie object directly to avoid the '.options' type error
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });
    return response;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};