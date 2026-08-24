import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { STAGE_LABELS } from "@/lib/pipeline";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: households }, { data: openTasks }] = await Promise.all([
    supabase.from("households").select("id, pipeline_stage, people(first_name, last_name, is_adult)"),
    supabase
      .from("tasks")
      .select("id, description, due_date, household_id, households(people(first_name, last_name, is_adult))")
      .neq("status", "done")
      .order("due_date"),
  ]);

  const all = households ?? [];
  const prospects = all.filter((h) => ["new_lead", "contacted", "showing_scheduled", "showed", "interested"].includes(h.pipeline_stage));
  const applying = all.filter((h) =>
    ["application_sent", "application_started", "application_submitted", "payment_received", "screening", "verification", "under_review"].includes(
      h.pipeline_stage
    )
  );
  const approved = all.filter((h) => h.pipeline_stage === "approved");
  const denied = all.filter((h) => h.pipeline_stage === "denied");
  const tenants = all.filter((h) => h.pipeline_stage === "tenant");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-lg font-semibold text-ink">Dashboard</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Prospects" value={prospects.length} />
        <Stat label="In application / screening" value={applying.length} />
        <Stat label="Active tenants" value={tenants.length} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Section title={`Applications in flight (${applying.length})`}>
          {applying.length === 0 && <Empty />}
          {applying.map((h) => (
            <HouseholdRow key={h.id} household={h} />
          ))}
        </Section>

        <Section title="Open tasks">
          {(!openTasks || openTasks.length === 0) && <Empty />}
          {(openTasks ?? []).map((t) => {
            const person = t.households?.people?.find((p: { is_adult: boolean }) => p.is_adult);
            return (
              <Link
                key={t.id}
                href={t.household_id ? `/households/${t.household_id}` : "/tasks"}
                className="flex items-center justify-between px-3 py-2 rounded hover:bg-surface-2"
              >
                <span className="text-sm text-ink">{t.description}</span>
                <span className="text-xs text-ink-soft">{person ? `${person.first_name} ${person.last_name}` : ""}</span>
              </Link>
            );
          })}
        </Section>

        <Section title={`Recently approved (${approved.length})`}>
          {approved.length === 0 && <Empty />}
          {approved.map((h) => (
            <HouseholdRow key={h.id} household={h} />
          ))}
        </Section>

        <Section title={`Denied / withdrawn (${denied.length})`}>
          {denied.length === 0 && <Empty />}
          {denied.map((h) => (
            <HouseholdRow key={h.id} household={h} />
          ))}
        </Section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-line bg-surface p-4">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="text-2xl font-semibold text-ink tabular mt-1">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-line bg-surface">
      <div className="px-3 py-2 border-b border-line">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>
      <div className="p-1">{children}</div>
    </div>
  );
}

function Empty() {
  return <p className="px-3 py-3 text-sm text-ink-soft">Nothing here.</p>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HouseholdRow({ household }: { household: any }) {
  const primary = household.people?.find((p: { is_adult: boolean }) => p.is_adult) ?? household.people?.[0];
  return (
    <Link href={`/households/${household.id}`} className="flex items-center justify-between px-3 py-2 rounded hover:bg-surface-2">
      <span className="text-sm text-ink">{primary ? `${primary.first_name} ${primary.last_name}` : "Unnamed"}</span>
      <span className="text-xs text-ink-soft">{STAGE_LABELS[household.pipeline_stage as keyof typeof STAGE_LABELS]}</span>
    </Link>
  );
}
