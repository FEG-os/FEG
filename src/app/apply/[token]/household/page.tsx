import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { getApplicationContext } from "@/lib/apply";
import { addOccupant, addPet } from "../actions";

export default async function HouseholdRosterPage({ params }: PageProps<"/apply/[token]/household">) {
  const { token } = await params;
  const ctx = await getApplicationContext(token);
  if (!ctx || ctx.expired || !ctx.application) notFound();

  const supabase = createServiceClient();
  const [{ data: pets }, { data: applicantProfiles }] = await Promise.all([
    supabase.from("pets").select("*").eq("household_id", ctx.household!.id),
    supabase
      .from("applicant_profiles")
      .select("id, status, person_id")
      .eq("application_id", ctx.application.id),
  ]);

  const statusByPerson = new Map((applicantProfiles ?? []).map((ap) => [ap.person_id, ap.status]));

  const addOccupantAction = addOccupant.bind(null, token);
  const addPetAction = addPet.bind(null, token);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Step 2 of 4</p>
        <h1 className="text-xl font-semibold text-ink mt-1">Who&apos;s moving in?</h1>
        <p className="text-sm text-ink-soft mt-1">List everyone who will live at the property, adults and minors.</p>
      </div>

      <div className="rounded border border-line bg-surface divide-y divide-line">
        {ctx.people.map((p) => (
          <div key={p.id} className="p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">
                {p.first_name} {p.last_name}
              </p>
              <p className="text-xs text-ink-soft">
                {p.is_adult ? "Adult" : "Minor"}
                {p.relationship_role ? ` · ${p.relationship_role}` : ""}
              </p>
            </div>
            {p.is_adult && (
              <span className="text-xs text-ink-soft capitalize">
                {(statusByPerson.get(p.id) ?? "not_started").replace(/_/g, " ")}
              </span>
            )}
          </div>
        ))}
      </div>

      <details className="rounded border border-line bg-surface">
        <summary className="p-3 text-sm font-medium text-ink cursor-pointer">+ Add another occupant</summary>
        <form action={addOccupantAction} className="p-3 pt-0 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input name="first_name" placeholder="First name" required className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
            <input name="last_name" placeholder="Last name" required className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="is_adult" className="rounded border-line" />
            18 or older
          </label>
          <input name="relationship_role" placeholder="Relationship to primary applicant" className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
          <input name="dob" type="date" placeholder="Date of birth" className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
          <button type="submit" className="rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90 self-start">
            Add
          </button>
        </form>
      </details>

      <details className="rounded border border-line bg-surface">
        <summary className="p-3 text-sm font-medium text-ink cursor-pointer">
          + Add a pet {pets && pets.length > 0 ? `(${pets.length} added)` : ""}
        </summary>
        <form action={addPetAction} className="p-3 pt-0 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input name="name" placeholder="Pet name" className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
            <input name="species" placeholder="Species (dog, cat…)" className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input name="breed" placeholder="Breed" className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
            <input name="weight_lbs" type="number" placeholder="Weight (lbs)" className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
          </div>
          <button type="submit" className="rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90 self-start">
            Add pet
          </button>
        </form>
      </details>

      <div className="rounded border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold text-ink mb-3">Each adult completes their own questionnaire</h2>
        <div className="flex flex-col gap-2">
          {ctx.people
            .filter((p) => p.is_adult)
            .map((p) => (
              <Link
                key={p.id}
                href={`/apply/${token}/applicant/${p.id}`}
                className="flex items-center justify-between rounded border border-line px-3 py-2 hover:border-accent"
              >
                <span className="text-sm text-ink">
                  {p.first_name} {p.last_name}
                </span>
                <span className="text-xs text-ink-soft capitalize">
                  {(statusByPerson.get(p.id) ?? "not_started").replace(/_/g, " ")} →
                </span>
              </Link>
            ))}
        </div>
      </div>

      <Link href={`/apply/${token}/review`} className="text-sm text-accent underline underline-offset-2 self-start">
        Once everyone&apos;s submitted, review &amp; continue →
      </Link>
    </div>
  );
}
