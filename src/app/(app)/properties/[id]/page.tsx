import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/staff";
import { STAGE_LABELS, stageTone } from "@/lib/pipeline";
import { updateProperty, deleteProperty } from "../actions";
import DeletePropertyButton from "../DeletePropertyButton";

const TONE_CLASSES: Record<string, string> = {
  flat: "bg-surface-2 text-ink-soft",
  info: "bg-info-bg text-info",
  warn: "bg-warn-bg text-warn",
  good: "bg-good-bg text-good",
  crit: "bg-crit-bg text-crit",
};

function money(n: number | null) {
  if (n === null || n === undefined) return "—";
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export default async function PropertyDetailPage({ params }: PageProps<"/properties/[id]">) {
  const { id } = await params;
  const staff = await requireStaff();
  const supabase = await createClient();

  const { data: property } = await supabase.from("properties").select("*").eq("id", id).single();
  if (!property) notFound();

  const [{ data: households }, { data: maintenanceRequests }] = await Promise.all([
    supabase
      .from("households")
      .select("id, pipeline_stage, created_at, people(first_name, last_name, is_adult)")
      .eq("property_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("maintenance_requests")
      .select("id, description, status, reported_at, resolved_at")
      .eq("property_id", id)
      .order("reported_at", { ascending: false }),
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <Link href="/properties" className="text-xs text-ink-soft hover:text-accent transition-colors">
          ← All properties
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-ink">{property.name}</h1>
            <p className="text-sm text-ink-soft mt-0.5">{property.address}</p>
          </div>
          {staff.role === "owner" && (
            <DeletePropertyButton
              propertyName={property.name}
              onDelete={deleteProperty.bind(null, property.id)}
              redirectTo="/properties"
            />
          )}
        </div>
      </div>

      <div className="rounded border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink mb-3">Details</h2>
        <form action={updateProperty.bind(null, property.id)} className="flex flex-col gap-3">
          <Field label="Name" name="name" defaultValue={property.name} required />
          <Field label="Address" name="address" defaultValue={property.address} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monthly rent" name="monthly_rent" type="number" step="0.01" defaultValue={property.monthly_rent} required />
            <Field label="Security deposit" name="security_deposit" type="number" step="0.01" defaultValue={property.security_deposit} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Application fee / adult"
              name="application_fee_per_adult"
              type="number"
              step="0.01"
              defaultValue={property.application_fee_per_adult}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink-soft">Status</label>
              <select
                name="status"
                defaultValue={property.status}
                className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="off_market">Off market</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="is_furnished" defaultChecked={property.is_furnished} className="rounded border-line" />
            Furnished
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="pet_deposit_allowed" defaultChecked={property.pet_deposit_allowed} className="rounded border-line" />
            Pets allowed (with deposit)
          </label>
          <button
            type="submit"
            className="mt-1 rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90 self-start"
          >
            Save changes
          </button>
        </form>
      </div>

      <div className="rounded border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink mb-3">
          Households ({households?.length ?? 0})
        </h2>
        {households && households.length > 0 ? (
          <ul className="flex flex-col divide-y divide-line">
            {households.map((h) => {
              const primary = h.people?.find((p: { is_adult: boolean }) => p.is_adult) ?? h.people?.[0];
              const name = primary ? `${primary.first_name} ${primary.last_name}` : "Unnamed household";
              return (
                <li key={h.id} className="py-2.5 flex items-center justify-between gap-3">
                  <Link href={`/households/${h.id}`} className="text-sm text-ink hover:text-accent transition-colors">
                    {name}
                  </Link>
                  <span className={`text-xs rounded-full px-2 py-0.5 ${TONE_CLASSES[stageTone(h.pipeline_stage)]}`}>
                    {STAGE_LABELS[h.pipeline_stage as keyof typeof STAGE_LABELS]}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-ink-soft">No households have referenced this property yet.</p>
        )}
      </div>

      <div className="rounded border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink mb-3">
          Maintenance ({maintenanceRequests?.length ?? 0})
        </h2>
        {maintenanceRequests && maintenanceRequests.length > 0 ? (
          <ul className="flex flex-col divide-y divide-line">
            {maintenanceRequests.map((m) => (
              <li key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                <p className="text-sm text-ink">{m.description}</p>
                <span className={`text-xs rounded-full px-2 py-0.5 shrink-0 ${m.status === "open" ? TONE_CLASSES.warn : TONE_CLASSES.good}`}>
                  {m.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-soft">No maintenance requests for this property.</p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  step,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  step?: string;
  defaultValue?: string | number | null;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-ink-soft">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        step={step}
        defaultValue={defaultValue ?? undefined}
        className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
    </div>
  );
}
