import { createClient } from "@/lib/supabase/server";
import { createProperty } from "./actions";

function money(n: number | null) {
  if (n === null || n === undefined) return "—";
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export default async function PropertiesPage() {
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold text-ink">Properties</h1>
        <p className="text-sm text-ink-soft mt-1">
          Every household references one of these. Add a second address here when you expand.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(properties ?? []).map((p) => (
          <div key={p.id} className="rounded border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-ink">{p.name}</h3>
              <span className="text-xs rounded-full bg-surface-2 px-2 py-0.5 text-ink-soft capitalize">
                {p.status}
              </span>
            </div>
            <p className="text-sm text-ink-soft mt-1">{p.address}</p>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm tabular">
              <div>
                <dt className="text-xs text-ink-soft">Rent</dt>
                <dd className="font-medium">{money(p.monthly_rent)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">Deposit</dt>
                <dd className="font-medium">{money(p.security_deposit)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">App fee / adult</dt>
                <dd className="font-medium">{money(p.application_fee_per_adult)}</dd>
              </div>
            </dl>
          </div>
        ))}
        {(!properties || properties.length === 0) && (
          <p className="text-sm text-ink-soft">No properties yet — add your first one.</p>
        )}
      </div>

      <div className="rounded border border-line bg-surface p-5 max-w-md">
        <h2 className="text-sm font-semibold text-ink mb-3">Add a property</h2>
        <form action={createProperty} className="flex flex-col gap-3">
          <Field label="Name" name="name" placeholder="412 Elm St" required />
          <Field label="Address" name="address" placeholder="412 Elm St, Wichita, KS" required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monthly rent" name="monthly_rent" type="number" step="0.01" required />
            <Field label="Security deposit" name="security_deposit" type="number" step="0.01" required />
          </div>
          <Field
            label="Application fee / adult"
            name="application_fee_per_adult"
            type="number"
            step="0.01"
            defaultValue="85"
          />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="is_furnished" className="rounded border-line" />
            Furnished
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="pet_deposit_allowed" className="rounded border-line" />
            Pets allowed (with deposit)
          </label>
          <button
            type="submit"
            className="mt-1 rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90 self-start"
          >
            Add property
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  step,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-ink-soft">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        step={step}
        defaultValue={defaultValue}
        className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
    </div>
  );
}
