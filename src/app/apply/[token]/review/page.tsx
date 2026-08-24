import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { getApplicationContext } from "@/lib/apply";

export default async function ReviewPage({ params }: PageProps<"/apply/[token]/review">) {
  const { token } = await params;
  const ctx = await getApplicationContext(token);
  if (!ctx || ctx.expired || !ctx.application) notFound();

  const supabase = createServiceClient();
  const { data: profiles } = await supabase
    .from("applicant_profiles")
    .select("*, people(first_name, last_name), residence_history(id), employment_history(id), applicant_references(id)")
    .eq("application_id", ctx.application.id);

  const adults = ctx.people.filter((p) => p.is_adult);
  const allSubmitted = (profiles ?? []).length >= adults.length && (profiles ?? []).every((p) => p.status === "submitted");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Step 4 of 4</p>
        <h1 className="text-xl font-semibold text-ink mt-1">Review</h1>
        <p className="text-sm text-ink-soft mt-1">A quick recap before the application fee.</p>
      </div>

      <div className="rounded border border-line bg-surface divide-y divide-line">
        {(profiles ?? []).map((p) => (
          <div key={p.id} className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">
                {p.people?.first_name} {p.people?.last_name}
              </span>
              <span className={`text-xs capitalize ${p.status === "submitted" ? "text-good" : "text-warn"}`}>
                {p.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-1">
              {p.current_address || "No current address yet"} · {p.residence_history?.length ?? 0} address
              {(p.residence_history?.length ?? 0) === 1 ? "" : "es"} · {p.employment_history?.length ?? 0} employer
              {(p.employment_history?.length ?? 0) === 1 ? "" : "s"} · {p.applicant_references?.length ?? 0} reference
              {(p.applicant_references?.length ?? 0) === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>

      {!allSubmitted ? (
        <div className="rounded border border-warn/30 bg-warn-bg px-3 py-2 text-sm text-warn">
          Every adult needs to submit their questionnaire before continuing.{" "}
          <Link href={`/apply/${token}/household`} className="underline underline-offset-2">
            Back to household
          </Link>
        </div>
      ) : (
        <Link
          href={`/apply/${token}/pay`}
          className="rounded bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink hover:opacity-90 self-start"
        >
          Continue to application fee
        </Link>
      )}
    </div>
  );
}
