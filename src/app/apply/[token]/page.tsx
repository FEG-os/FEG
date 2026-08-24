import { notFound } from "next/navigation";
import { getApplicationContext } from "@/lib/apply";
import { acknowledgeDisclosures } from "./actions";

function money(n: number | null | undefined) {
  return `$${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export default async function ApplyOverviewPage({ params }: PageProps<"/apply/[token]">) {
  const { token } = await params;
  const ctx = await getApplicationContext(token);
  if (!ctx) notFound();
  if (ctx.expired) return <Expired />;

  const { property, people } = ctx;
  const adults = people.filter((p) => p.is_adult).length || 1;
  const feePerAdult = Number(property?.application_fee_per_adult ?? 85);
  const feeTotal = adults * feePerAdult;
  const totalBeforeMoveIn = Number(property?.security_deposit ?? 0) + Number(property?.monthly_rent ?? 0);

  const action = acknowledgeDisclosures.bind(null, token);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Rental application</p>
        <h1 className="text-xl font-semibold text-ink mt-1">{property?.name ?? "Property"}</h1>
        <p className="text-sm text-ink-soft mt-0.5">{property?.address}</p>
      </div>

      <div className="rounded border border-line bg-surface p-4 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
        <Term label="Monthly rent" value={money(property?.monthly_rent)} />
        <Term label="Security deposit" value={money(property?.security_deposit)} />
        <Term label="Total due before possession" value={money(totalBeforeMoveIn)} strong />
        <Term label="Application fee" value={`${money(feePerAdult)} per adult (18+)`} />
      </div>

      <div className="rounded border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold text-ink mb-2">Before you start</h2>
        <ul className="list-disc pl-5 text-sm text-ink-soft flex flex-col gap-1.5">
          <li>Every person age 18 or older who will live at the property must complete their own application.</li>
          <li>
            A non-refundable application/screening fee of {money(feePerAdult)} per adult is due after the questionnaire is
            complete ({adults} adult{adults === 1 ? "" : "s"} = {money(feeTotal)} total).
          </li>
          <li>You will not be asked for a Social Security number, bank login, or card number on this site.</li>
          <li>By continuing, you authorize the landlord to independently verify the information you provide.</li>
        </ul>
      </div>

      <form action={action}>
        <label className="flex items-start gap-2 text-sm text-ink mb-4">
          <input type="checkbox" required className="mt-0.5 rounded border-line" />
          I have read the above and agree to provide accurate information.
        </label>
        <button type="submit" className="rounded bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink hover:opacity-90">
          Continue
        </button>
      </form>
    </div>
  );
}

function Term({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className={`tabular ${strong ? "font-semibold text-ink" : "text-ink"}`}>{value}</dd>
    </div>
  );
}

function Expired() {
  return (
    <div className="rounded border border-line bg-surface p-6 text-center">
      <h1 className="text-lg font-semibold text-ink">This link has expired</h1>
      <p className="text-sm text-ink-soft mt-2">Contact the property manager for a new application link.</p>
    </div>
  );
}
