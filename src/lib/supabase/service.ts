import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// SERVER-ONLY. Uses the service role key, which bypasses Row Level
// Security entirely. Never import this file from a Client Component or
// anything that ships to the browser — it belongs exclusively in Route
// Handlers / Server Actions that need to act on behalf of an
// unauthenticated applicant (e.g. writing application answers against a
// validated access token) or process a signed webhook.
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
