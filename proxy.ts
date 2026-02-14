import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();

  // 🔥 1. THE EMERGENCY BYPASS
  // If we are in the middle of an auth flow, stop the proxy and let it happen.
  if (
    url.pathname.startsWith('/auth') || 
    url.searchParams.has('code') || 
    url.searchParams.has('error')
  ) {
    return NextResponse.next();
  }

  // 2. Start with a neutral response
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 3. Initialize Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          
          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 4. Get the user
  const { data: { user } } = await supabase.auth.getUser();

  // 🛡️ AUTH REDIRECT LOGIC
  
  // If no user and trying to access dashboard -> Send to Home
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    url.pathname = '/';
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // If user is logged in and visits home -> Send to Dashboard
  if (user && request.nextUrl.pathname === '/') {
    url.pathname = '/dashboard';
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};