import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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

  // 3. IMPORTANT: Use getUser() to verify the session
  const { data: { user } } = await supabase.auth.getUser();

  // 🛡️ AUTH REDIRECT LOGIC

  // Case A: No user -> Trying to access dashboard -> Redirect to Home
  if (!user && url.pathname.startsWith('/dashboard')) {
    url.pathname = '/';
    const response = NextResponse.redirect(url);
    // Copy all cookies (including the logic that cleared the session) to the redirect
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value);
    });
    return response;
  }

  // Case B: Logged in -> Visits Home page -> Redirect to Dashboard
  if (user && url.pathname === '/') {
    url.pathname = '/dashboard';
    const response = NextResponse.redirect(url);
    // CRITICAL: Copy the new auth cookies to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value);
    });
    return response;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Apply middleware to all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};