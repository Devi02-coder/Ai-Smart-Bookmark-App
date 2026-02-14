import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ✅ Next.js 16: Export must be named 'proxy'
export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();

  // 1. EMERGENCY BYPASS: Let auth traffic through without interference
  if (
    url.pathname.startsWith('/auth') || 
    url.searchParams.has('code') || 
    url.searchParams.has('error')
  ) {
    return NextResponse.next();
  }

  // 2. Initialize response and Supabase client
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on the request so the server can see them immediately
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          
          // Refresh the response to include the new cookies
          supabaseResponse = NextResponse.next({
            request,
          });

          // Set cookies on the actual response sent to the browser
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. Verify the session
  const { data: { user } } = await supabase.auth.getUser();

  // 🛡️ AUTH REDIRECT LOGIC

  // Case A: No user -> Trying to access dashboard -> Redirect to Home
  if (!user && url.pathname.startsWith('/dashboard')) {
    url.pathname = '/';
    const response = NextResponse.redirect(url);
    // Copy all cookies to the redirect
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, cookie.options);
    });
    return response;
  }

  // Case B: Logged in -> Visits Home page -> Redirect to Dashboard
  if (user && url.pathname === '/') {
    url.pathname = '/dashboard';
    const response = NextResponse.redirect(url);
    // CRITICAL: Copy auth cookies to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, cookie.options);
    });
    return response;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};