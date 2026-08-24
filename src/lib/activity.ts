import type { SupabaseClient } from "@supabase/supabase-js";

// Every meaningful event writes one row here. Insert-only by RLS design —
// see supabase/migrations/0002_rls.sql. Call this from server actions and
// route handlers right after the state change it's describing.
export async function logActivity(
  supabase: SupabaseClient,
  entry: {
    householdId?: string | null;
    entityType: string;
    entityId?: string | null;
    eventType: string;
    description: string;
    actorId?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  await supabase.from("activity_log").insert({
    household_id: entry.householdId ?? null,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    event_type: entry.eventType,
    description: entry.description,
    actor_id: entry.actorId ?? null,
    metadata: entry.metadata ?? {},
  });
}
