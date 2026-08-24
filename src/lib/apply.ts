import { createServiceClient } from "@/lib/supabase/service";

// Server-only. The applicant-facing flow has no Supabase Auth session —
// the access_token in the URL is the only credential, so every /apply
// page validates it here (via the service role, bypassing RLS) rather
// than relying on row-level security to scope an anonymous request.
export async function getApplicationContext(token: string) {
  const supabase = createServiceClient();

  const { data: application } = await supabase
    .from("applications")
    .select("*, households(*, properties(*), people(*))")
    .eq("access_token", token)
    .maybeSingle();

  if (!application) return null;
  if (application.token_expires_at && new Date(application.token_expires_at) < new Date()) {
    return { expired: true as const, application: null, household: null, property: null, people: [] };
  }

  const household = application.households;
  const property = household?.properties;
  const people = household?.people ?? [];

  return { expired: false as const, application, household, property, people };
}
