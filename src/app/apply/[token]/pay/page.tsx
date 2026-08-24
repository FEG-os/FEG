import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { getApplicationContext } from "@/lib/apply";
import { squareConfigured } from "@/lib/square";
import { startPayment } from "../actions";

export default async function PayPage({
  params,
  searchParams,
}: PageProps<"/apply/[token]/pay">) {
  const { token } = await params;
  const sp = await searchParams;
  const ctx = await getApplicationContext(token);
  if (!ctx || ctx.expired || !ctx.application) notFound();

  const supabase = createServiceClient();
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("*")
    .eq("application_id", ctx.application.id)
    .eq("payment_type", "application_fee")
    .order("created_at", { ascending: false })
    .maybeSingle();

  const feeTotal = Number(ctx.application.fee_total ?? 0);
  const action = startPayment.bind(null, token);
  const error = typeof sp.error === "string" ? sp.error : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Application fee</h1>
        <p className="text-sm text-ink-soft mt-1">{ctx.household?.properties?.name}</p>
      </div>

      <div className="rounded border border-line bg-surface p-4 flex items-center justify-between">
        <span className="text-sm text-ink-soft">Total due</span>
        <span className="text-lg font-semibold text-ink tabular">${feeTotal.toFixed(2)}</span>
      </div>

      {existingPayment?.status === "paid" ? (
        <div className="rounded border border-good/30 bg-good-bg px-3 py-3 text-sm text-good">
          Paid — thank you. We&apos;ll be in touch as we review your application.
        </div>
      ) : existingPayment?.status === "pending" && existingPayment.square_hosted_url ? (
        <a
          href={existingPayment.square_hosted_url}
          className="rounded bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink hover:opacity-90 self-start"
        >
          Continue to payment
        </a>
      ) : squareConfigured() ? (
        <form action={action}>
          <button type="submit" className="rounded bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink hover:opacity-90">
            Pay with card
          </button>
        </form>
      ) : (
        <div className="rounded border border-warn/30 bg-warn-bg px-3 py-3 text-sm text-warn">
          Online payment isn&apos;t turned on yet. Please contact the property manager to arrange payment of $
          {feeTotal.toFixed(2)}.
        </div>
      )}

      {error === "square_failed" && (
        <p className="text-sm text-crit">Something went wrong starting the payment — please try again in a moment.</p>
      )}
    </div>
  );
}
