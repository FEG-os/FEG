"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { logActivity } from "@/lib/activity";
import { getApplicationContext } from "@/lib/apply";
import { createApplicationFeeInvoice, squareConfigured } from "@/lib/square";

async function loadOrThrow(token: string) {
  const ctx = await getApplicationContext(token);
  if (!ctx || ctx.expired || !ctx.application) throw new Error("This application link is no longer valid.");
  return ctx;
}

export async function acknowledgeDisclosures(token: string) {
  const { application, household } = await loadOrThrow(token);
  const supabase = createServiceClient();

  const patch: {
    disclosures_acknowledged_at: string;
    status?: "in_progress";
    started_at?: string;
  } = { disclosures_acknowledged_at: new Date().toISOString() };
  if (application.status === "sent" || application.status === "not_sent") {
    patch.status = "in_progress";
    patch.started_at = application.started_at ?? new Date().toISOString();
  }

  await supabase.from("applications").update(patch).eq("id", application.id);

  if (household?.pipeline_stage === "application_sent") {
    await supabase.from("households").update({ pipeline_stage: "application_started" }).eq("id", household.id);
  }

  await logActivity(supabase, {
    householdId: household?.id,
    entityType: "application",
    entityId: application.id,
    eventType: "application_started",
    description: "Applicant opened the application and acknowledged disclosures",
  });

  redirect(`/apply/${token}/household`);
}

export async function addOccupant(token: string, formData: FormData) {
  const { application, household } = await loadOrThrow(token);
  const supabase = createServiceClient();
  if (!household) throw new Error("No household on this application.");

  const isAdult = formData.get("is_adult") === "on";
  const { data: person, error } = await supabase
    .from("people")
    .insert({
      household_id: household.id,
      first_name: String(formData.get("first_name")),
      last_name: String(formData.get("last_name")),
      is_adult: isAdult,
      dob: String(formData.get("dob") ?? "") || null,
      relationship_role: String(formData.get("relationship_role") ?? "") || null,
    })
    .select("id")
    .single();
  if (error || !person) throw new Error(error?.message ?? "Could not add occupant");

  if (isAdult) {
    await supabase
      .from("applicant_profiles")
      .upsert({ application_id: application.id, person_id: person.id }, { onConflict: "application_id,person_id", ignoreDuplicates: true });
  }

  await logActivity(supabase, {
    householdId: household.id,
    entityType: "person",
    eventType: "occupant_added_by_applicant",
    description: `Applicant added ${isAdult ? "adult" : "minor"} occupant — ${formData.get("first_name")} ${formData.get("last_name")}`,
  });

  revalidatePath(`/apply/${token}/household`);
}

export async function addPet(token: string, formData: FormData) {
  const { household } = await loadOrThrow(token);
  const supabase = createServiceClient();
  if (!household) throw new Error("No household on this application.");

  await supabase.from("pets").insert({
    household_id: household.id,
    name: String(formData.get("name") ?? "") || null,
    species: String(formData.get("species") ?? "") || null,
    breed: String(formData.get("breed") ?? "") || null,
    weight_lbs: formData.get("weight_lbs") ? Number(formData.get("weight_lbs")) : null,
  });

  revalidatePath(`/apply/${token}/household`);
}

type QuestionnairePayload = {
  currentAddress: string;
  residences: {
    address: string;
    moveIn: string;
    moveOut: string;
    rentAmount: string;
    landlordName: string;
    landlordPhone: string;
    landlordEmail: string;
    reasonForLeaving: string;
    wasOnLease: boolean;
  }[];
  employment: {
    employerName: string;
    position: string;
    employerPhone: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    incomeAmount: string;
    incomeFrequency: string;
  }[];
  incomeSources: { sourceType: string; amount: string; frequency: string; notes: string }[];
  references: { name: string; relationship: string; referenceType: string; phone: string; email: string }[];
  authorizeVerification: boolean;
};

export async function saveAndSubmitQuestionnaire(token: string, personId: string, formData: FormData) {
  const { application, household } = await loadOrThrow(token);
  const supabase = createServiceClient();

  const payload = JSON.parse(String(formData.get("payload"))) as QuestionnairePayload;

  const { data: profile } = await supabase
    .from("applicant_profiles")
    .select("id, person_id")
    .eq("application_id", application.id)
    .eq("person_id", personId)
    .single();
  if (!profile) throw new Error("Applicant profile not found.");

  await supabase.from("applicant_profiles").update({ current_address: payload.currentAddress }).eq("id", profile.id);

  // Replace child rows wholesale — simplest correct approach while the
  // applicant can still be actively editing before final submission.
  await supabase.from("residence_history").delete().eq("applicant_profile_id", profile.id);
  await supabase.from("employment_history").delete().eq("applicant_profile_id", profile.id);
  await supabase.from("income_sources").delete().eq("applicant_profile_id", profile.id);
  await supabase.from("applicant_references").delete().eq("applicant_profile_id", profile.id);

  if (payload.residences.length) {
    await supabase.from("residence_history").insert(
      payload.residences.map((r, i) => ({
        applicant_profile_id: profile.id,
        sequence: i,
        address: r.address,
        move_in_date: r.moveIn || null,
        move_out_date: r.moveOut || null,
        rent_amount: r.rentAmount ? Number(r.rentAmount) : null,
        landlord_name: r.landlordName || null,
        landlord_phone: r.landlordPhone || null,
        landlord_email: r.landlordEmail || null,
        reason_for_leaving: r.reasonForLeaving || null,
        was_on_lease: r.wasOnLease,
      }))
    );
  }

  if (payload.employment.length) {
    await supabase.from("employment_history").insert(
      payload.employment.map((e) => ({
        applicant_profile_id: profile.id,
        employer_name: e.employerName,
        position: e.position || null,
        employer_phone: e.employerPhone || null,
        start_date: e.startDate || null,
        end_date: e.endDate || null,
        is_current: e.isCurrent,
        income_amount: e.incomeAmount ? Number(e.incomeAmount) : null,
        income_frequency: e.incomeFrequency || null,
      }))
    );
  }

  if (payload.incomeSources.length) {
    await supabase.from("income_sources").insert(
      payload.incomeSources.map((s) => ({
        applicant_profile_id: profile.id,
        source_type: s.sourceType,
        amount: s.amount ? Number(s.amount) : null,
        frequency: s.frequency || null,
        notes: s.notes || null,
      }))
    );
  }

  if (payload.references.length) {
    await supabase.from("applicant_references").insert(
      payload.references.map((r) => ({
        applicant_profile_id: profile.id,
        name: r.name,
        relationship: r.relationship || null,
        reference_type: r.referenceType || null,
        phone: r.phone || null,
        email: r.email || null,
      }))
    );
  }

  if (payload.authorizeVerification) {
    await supabase.from("consents").insert({
      applicant_profile_id: profile.id,
      consent_type: "background_and_verification_authorization",
    });
  }

  // Versioned snapshot — the permanent, never-overwritten record of what
  // was submitted, independent of any later corrections.
  const { count } = await supabase
    .from("application_snapshots")
    .select("id", { count: "exact", head: true })
    .eq("applicant_profile_id", profile.id);

  await supabase.from("application_snapshots").insert({
    applicant_profile_id: profile.id,
    version: (count ?? 0) + 1,
    payload,
    captured_reason: (count ?? 0) === 0 ? "initial submission" : "applicant correction",
  });

  await supabase
    .from("applicant_profiles")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", profile.id);

  await logActivity(supabase, {
    householdId: household?.id,
    entityType: "applicant_profile",
    entityId: profile.id,
    eventType: "applicant_submitted",
    description: "Applicant submitted their questionnaire",
  });

  // If every adult on this application has now submitted, flip the
  // application (and household) to Submitted.
  const { data: allProfiles } = await supabase
    .from("applicant_profiles")
    .select("status")
    .eq("application_id", application.id);

  const allSubmitted = (allProfiles ?? []).every((p) => p.status === "submitted");
  if (allSubmitted) {
    await supabase
      .from("applications")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", application.id);
    if (household) {
      await supabase.from("households").update({ pipeline_stage: "application_submitted" }).eq("id", household.id);
    }
    await logActivity(supabase, {
      householdId: household?.id,
      entityType: "application",
      entityId: application.id,
      eventType: "application_submitted",
      description: "All adults have submitted — application complete, ready for the fee",
    });
  }

  revalidatePath(`/apply/${token}`, "layout");
  redirect(`/apply/${token}/household`);
}

export async function startPayment(token: string) {
  const { application, household, people } = await loadOrThrow(token);
  if (!squareConfigured()) redirect(`/apply/${token}/pay?error=not_configured`);

  const supabase = createServiceClient();
  const adults = people.filter((p) => p.is_adult);

  let invoice;
  try {
    invoice = await createApplicationFeeInvoice({
      householdId: household!.id,
      applicationId: application.id,
      propertyName: household?.properties?.name ?? "Rental application",
      feeTotal: Number(application.fee_total ?? 0),
      adults: adults.map((a) => ({ name: `${a.first_name} ${a.last_name}`, email: a.email })),
    });
  } catch (err) {
    console.error("Square invoice creation failed", err);
    redirect(`/apply/${token}/pay?error=square_failed`);
  }

  await supabase.from("payments").insert({
    household_id: household!.id,
    application_id: application.id,
    payment_type: "application_fee",
    square_customer_id: invoice.customerId,
    square_invoice_id: invoice.invoiceId,
    amount: Number(application.fee_total ?? 0),
    status: "pending",
    square_hosted_url: invoice.publicUrl,
  });

  await logActivity(supabase, {
    householdId: household?.id,
    entityType: "application",
    entityId: application.id,
    eventType: "square_invoice_created",
    description: `Square invoice created for $${Number(application.fee_total ?? 0).toFixed(2)} application fee`,
  });

  redirect(invoice.publicUrl);
}
