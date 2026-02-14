import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    
    // 4. Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // ✅ Success: Go to dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }

    // ❌ Log the error so you can see it in Vercel "Runtime Logs"
    console.error('Supabase Auth Error:', error.message);
  }

  /**
   * ❌ FAILURE FIX: 
   * Instead of going to /auth/auth-code-error (which causes a 404),
   * we send them back to the home page with an error message in the URL.
   */
  return NextResponse.redirect(`${origin}/?error=auth_exchange_failed`);
}