import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { getApplicationContext } from "@/lib/apply";
import { saveAndSubmitQuestionnaire } from "../../actions";
import QuestionnaireForm from "./QuestionnaireForm";

export default async function ApplicantQuestionnairePage({
  params,
}: PageProps<"/apply/[token]/applicant/[personId]">) {
  const { token, personId } = await params;
  const ctx = await getApplicationContext(token);
  if (!ctx || ctx.expired || !ctx.application) notFound();

  const person = ctx.people.find((p) => p.id === personId);
  if (!person) notFound();

  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("applicant_profiles")
    .select("*")
    .eq("application_id", ctx.application.id)
    .eq("person_id", personId)
    .single();
  if (!profile) notFound();

  const [{ data: residences }, { data: employment }, { data: incomeSources }, { data: references }] = await Promise.all([
    supabase.from("residence_history").select("*").eq("applicant_profile_id", profile.id).order("sequence"),
    supabase.from("employment_history").select("*").eq("applicant_profile_id", profile.id),
    supabase.from("income_sources").select("*").eq("applicant_profile_id", profile.id),
    supabase.from("applicant_references").select("*").eq("applicant_profile_id", profile.id),
  ]);

  const onSubmit = saveAndSubmitQuestionnaire.bind(null, token, personId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Step 3 of 4</p>
        <h1 className="text-xl font-semibold text-ink mt-1">
          {person.first_name} {person.last_name}
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          About 5 years of residence and employment history, plus a couple of references.
        </p>
      </div>

      <QuestionnaireForm
        currentAddress={profile.current_address ?? ""}
        residences={(residences ?? []).map((r) => ({
          address: r.address,
          moveIn: r.move_in_date ?? "",
          moveOut: r.move_out_date ?? "",
          rentAmount: r.rent_amount?.toString() ?? "",
          landlordName: r.landlord_name ?? "",
          landlordPhone: r.landlord_phone ?? "",
          landlordEmail: r.landlord_email ?? "",
          reasonForLeaving: r.reason_for_leaving ?? "",
          wasOnLease: r.was_on_lease ?? true,
        }))}
        employment={(employment ?? []).map((e) => ({
          employerName: e.employer_name,
          position: e.position ?? "",
          employerPhone: e.employer_phone ?? "",
          startDate: e.start_date ?? "",
          endDate: e.end_date ?? "",
          isCurrent: e.is_current,
          incomeAmount: e.income_amount?.toString() ?? "",
          incomeFrequency: e.income_frequency ?? "monthly",
        }))}
        incomeSources={(incomeSources ?? []).map((s) => ({
          sourceType: s.source_type,
          amount: s.amount?.toString() ?? "",
          frequency: s.frequency ?? "",
          notes: s.notes ?? "",
        }))}
        references={(references ?? []).map((r) => ({
          name: r.name,
          relationship: r.relationship ?? "",
          referenceType: r.reference_type ?? "personal",
          phone: r.phone ?? "",
          email: r.email ?? "",
        }))}
        alreadySubmitted={profile.status === "submitted"}
        onSubmit={onSubmit}
      />
    </div>
  );
}
