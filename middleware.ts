import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // 1. AUTH BYPASS: Let static files and auth-specific routes pass through immediately
  if (
    url.pathname.startsWith('/auth') || 
    url.searchParams.has('code')
  ) {
    return NextResponse.next();
  }

  // Create an initial response
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 2. INITIALIZE SUPABASE
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
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

  // IMPORTANT: Use getUser() not getSession() for security
  const { data: { user } } = await supabase.auth.getUser();

  // 3. PROTECT ROUTES
  
  // Case A: User is NOT logged in but trying to access dashboard
  if (!user && url.pathname.startsWith('/dashboard')) {
    const redirectUrl = new URL('/', request.url);
    const response = NextResponse.redirect(redirectUrl);
    // Copy cookies from the supabaseResponse to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, cookie);
    });
    return response;
  }

  // Case B: User IS logged in but trying to access the landing/login page
  if (user && url.pathname === '/') {
    const redirectUrl = new URL('/dashboard', request.url);
    const response = NextResponse.redirect(redirectUrl);
    // Copy cookies from the supabaseResponse to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, cookie);
    });
    return response;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};