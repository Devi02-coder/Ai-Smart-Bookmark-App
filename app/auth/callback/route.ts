import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  
  // Use a reliable origin (especially important for Vercel)
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    
    // 🔑 Exchange the temporary code for a permanent session
    // This function automatically sets the cookies in the background via your server client
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // ✅ SUCCESS: Send the user to the dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }

    // ❌ Log the actual error to Vercel Logs so you can see it
    console.error('Supabase Auth Callback Error:', error.message);
  }

  // 🛡️ FAILURE: If no code or exchange failed, send to home with error
  return NextResponse.redirect(`${origin}?error=auth_exchange_failed`);
}