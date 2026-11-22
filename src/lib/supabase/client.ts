/**
 * ReleaseLens Client-Side Supabase Interface (Read-Only Anon Key)
 *
 * SECURITY DIRECTIVE:
 * - This client strictly uses NEXT_PUBLIC_SUPABASE_ANON_KEY with Postgres Row Level Security (RLS).
 * - SUPABASE_SERVICE_ROLE_KEY is strictly server-only and must NEVER be imported or referenced here.
 * - All backend and administrative persistence routes through server-side adapters in src/lib/store/.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createBrowserClient(supabaseUrl, supabaseKey);
}
