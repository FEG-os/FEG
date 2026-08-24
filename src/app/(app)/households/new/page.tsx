import { createClient } from "@/lib/supabase/server";
import { createHousehold } from "../actions";

export default async function NewHouseholdPage() {
  const supabase = await createClient();
  const { data: properties } = await supabase.from("properties").select("id, name").order("created_at");

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-semibold text-ink mb-1">New household</h1>
      <p className="text-sm text-ink-soft mb-6">Start the record as soon as someone reaches out — details fill in over time.</p>

      <form action={createHousehold} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink-soft">Property</label>
          <select
            name="property_id"
            required
            className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Select a property…</option>
            {(properties ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" name="first_name" />
          <Field label="Last name" name="last_name" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone" name="phone" type="tel" />
          <Field label="Email" name="email" type="email" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink-soft">Lead source</label>
          <input
            name="lead_source"
            placeholder="Zillow, referral, sign call…"
            className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink-soft">Interest</label>
          <select
            name="rental_type_interest"
            defaultValue="undecided"
            className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="undecided">Undecided</option>
            <option value="traditional">Traditional rental</option>
            <option value="lease_option">Lease with option to purchase</option>
          </select>
        </div>

        <Field label="Desired move-in" name="desired_move_in" type="date" />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink-soft">Notes</label>
          <textarea
            name="notes"
            rows={3}
            className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        <button
          type="submit"
          className="mt-2 rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90 self-start"
        >
          Create household
        </button>
      </form>
    </div>
  );
}

function Field({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-ink-soft">{label}</label>
      <input
        name={name}
        type={type}
        className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
    </div>
  );
}
