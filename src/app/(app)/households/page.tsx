import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PIPELINE_STAGES, STAGE_LABELS, stageTone } from "@/lib/pipeline";

const TONE_CLASSES: Record<string, string> = {
  flat: "bg-surface-2 text-ink-soft",
  good: "bg-good-bg text-good",
  warn: "bg-warn-bg text-warn",
  crit: "bg-crit-bg text-crit",
  info: "bg-info-bg text-info",
};

export default async function HouseholdsPage() {
  const supabase = await createClient();

  const [{ data: households }, { data: properties }] = await Promise.all([
    supabase
      .from("households")
      .select("id, pipeline_stage, rental_type_interest, desired_move_in, created_at, properties(name), people(first_name, last_name, is_adult)")
      .order("created_at", { ascending: false }),
    supabase.from("properties").select("id, name").order("created_at"),
  ]);

  const byStage = new Map<string, typeof households>();
  for (const stage of PIPELINE_STAGES) byStage.set(stage, []);
  for (const h of households ?? []) {
    const list = byStage.get(h.pipeline_stage) ?? [];
    list.push(h);
    byStage.set(h.pipeline_stage, list);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Households</h1>
          <p className="text-sm text-ink-soft mt-1">{households?.length ?? 0} total, across the full pipeline.</p>
        </div>
        <Link
          href="/households/new"
          className="rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90"
        >
          New household
        </Link>
      </div>

      {(!properties || properties.length === 0) && (
        <div className="rounded border border-warn/30 bg-warn-bg px-3 py-2 text-sm text-warn">
          No properties yet.{" "}
          <Link href="/properties" className="underline underline-offset-2">
            Add one
          </Link>{" "}
          before creating households.
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
        {PIPELINE_STAGES.map((stage) => {
          const items = byStage.get(stage) ?? [];
          return (
            <div key={stage} className="w-64 flex-none flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${TONE_CLASSES[stageTone(stage)]}`}>
                  {STAGE_LABELS[stage]}
                </span>
                <span className="text-xs text-ink-soft tabular">{items.length}</span>
              </div>
              <div className="flex flex-col gap-2 min-h-[2rem]">
                {items.map((h) => {
                  const primary = h.people?.find((p) => p.is_adult) ?? h.people?.[0];
                  return (
                    <Link
                      key={h.id}
                      href={`/households/${h.id}`}
                      className="rounded border border-line bg-surface p-3 hover:border-accent transition-colors"
                    >
                      <p className="text-sm font-medium text-ink truncate">
                        {primary ? `${primary.first_name} ${primary.last_name}` : "Unnamed household"}
                      </p>
                      <p className="text-xs text-ink-soft mt-0.5 truncate">
                        {h.properties?.name ?? "No property"}
                      </p>
                      {h.desired_move_in && (
                        <p className="text-xs text-ink-soft mt-1 tabular">Move-in {h.desired_move_in}</p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
