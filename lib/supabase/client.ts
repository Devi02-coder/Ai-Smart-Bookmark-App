import { createBrowserClient } from '@supabase/ssr';

// We use a singleton pattern to ensure we don't keep creating clients on every click
let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 🛡️ Safety check: If keys are missing, log a clear error instead of crashing
  if (!url || !anonKey) {
    console.error("Supabase environment variables are missing! Check your Vercel Dashboard.");
    // Return a dummy client or handle gracefully to prevent the "reload loop"
  }

  client = createBrowserClient(url!, anonKey!);
  
  return client;
}