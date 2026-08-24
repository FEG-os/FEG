import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { completeTaskGlobal } from "./actions";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, households(id, people(first_name, last_name, is_adult))")
    .order("status")
    .order("due_date");

  const open = (tasks ?? []).filter((t) => t.status !== "done");
  const done = (tasks ?? []).filter((t) => t.status === "done");

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-lg font-semibold text-ink">Tasks</h1>

      <div className="rounded border border-line bg-surface divide-y divide-line">
        {open.length === 0 && <p className="p-4 text-sm text-ink-soft">Nothing open.</p>}
        {open.map((t) => {
          const person = t.households?.people?.find((p: { is_adult: boolean }) => p.is_adult);
          return (
            <div key={t.id} className="p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-ink">{t.description}</p>
                <p className="text-xs text-ink-soft">
                  {t.type}
                  {t.due_date ? ` · due ${t.due_date}` : ""}
                  {person && t.household_id && (
                    <>
                      {" · "}
                      <Link href={`/households/${t.household_id}`} className="underline underline-offset-2">
                        {person.first_name} {person.last_name}
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <form action={async () => completeTaskGlobal(t.id)}>
                <button className="text-xs text-accent hover:underline whitespace-nowrap">Mark done</button>
              </form>
            </div>
          );
        })}
      </div>

      {done.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-ink-soft mb-2">Done</h2>
          <div className="rounded border border-line bg-surface divide-y divide-line">
            {done.map((t) => (
              <div key={t.id} className="p-3 text-sm text-ink-soft line-through">
                {t.description}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
