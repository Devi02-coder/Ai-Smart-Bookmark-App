import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // 1. Determine where to send the user after successful login
  // Default to /dashboard, but respect the 'next' param if it exists
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    
    // 2. Exchange the temporary code for a permanent session
    // This sets the cookies in the response headers automatically via lib/supabase/server
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 3. Construct the absolute redirect URL
      const forwardTo = new URL(next, origin);
      return NextResponse.redirect(forwardTo);
    }

    // Log error for debugging in Vercel/Terminal
    console.error('Supabase Auth Callback Error:', error.message);
  }

  // 4. If exchange fails or no code, redirect to home with an error flag
  return NextResponse.redirect(new URL('/?error=auth_exchange_failed', origin));
}