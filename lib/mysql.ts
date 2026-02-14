// lib/mysql.ts

/**
 * ⚠️ ATTENTION:
 * MySQL is disabled to prevent "ECONNREFUSED 127.0.0.1:3306" errors on Vercel.
 * All database operations have been moved to Supabase.
 * This file now acts as a safe placeholder.
 */

export function getPool() {
  // Return null because we are no longer using a MySQL pool
  return null;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  // This function is now a placeholder. 
  // If anything still calls it, it will return an empty array instead of crashing.
  console.warn('⚠️ A MySQL query was attempted, but MySQL is disabled. Switch to Supabase actions.');
  return [] as unknown as T;
}