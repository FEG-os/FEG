"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/staff";
import { logActivity } from "@/lib/activity";
import { STAGE_LABELS, type PipelineStage } from "@/lib/pipeline";
import { sendSignatureRequest, getSignatureRequest, downloadExecutedFile } from "@/lib/dropboxsign";

async function ctx() {
  const staff = await requireStaff();
  const supabase = await createClient();
  return { staff, supabase };
}

export async function updateStage(householdId: string, formData: FormData) {
  const { staff, supabase } = await ctx();
  const stage = String(formData.get("pipeline_stage")) as PipelineStage;

  const { error } = await supabase
    .from("households")
    .update({ pipeline_stage: stage })
    .eq("id", householdId);
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    householdId,
    entityType: "household",
    entityId: householdId,
    eventType: "stage_changed",
    description: `Stage changed to ${STAGE_LABELS[stage]}`,
    actorId: staff.id,
  });

  revalidatePath(`/households/${householdId}`);
}

export async function updateOverview(householdId: string, formData: FormData) {
  const { staff, supabase } = await ctx();

  const { error } = await supabase
    .from("households")
    .update({
      rental_type_interest: String(formData.get("rental_type_interest") ?? "undecided") as "traditional" | "lease_option" | "undecided",
      lead_source: String(formData.get("lead_source") ?? "") || null,
      desired_move_in: String(formData.get("desired_move_in") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
    })
    .eq("id", householdId);
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    householdId,
    entityType: "household",
    entityId: householdId,
    eventType: "overview_updated",
    description: "Overview details updated",
    actorId: staff.id,
  });

  revalidatePath(`/households/${householdId}`);
}

export async function addPerson(householdId: string, formData: FormData) {
  const { staff, supabase } = await ctx();
  const isAdult = formData.get("is_adult") === "on";

  const { error } = await supabase.from("people").insert({
    household_id: householdId,
    first_name: String(formData.get("first_name")),
    last_name: String(formData.get("last_name")),
    is_adult: isAdult,
    dob: String(formData.get("dob") ?? "") || null,
    relationship_role: String(formData.get("relationship_role") ?? "") || null,
    phone: String(formData.get("phone") ?? "") || null,
    email: String(formData.get("email") ?? "") || null,
  });
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    householdId,
    entityType: "person",
    eventType: "person_added",
    description: `${isAdult ? "Adult" : "Minor"} added to household — ${formData.get("first_name")} ${formData.get("last_name")}`,
    actorId: staff.id,
  });

  revalidatePath(`/households/${householdId}`);
}

// Sends (or resends) the application: ensures one applications row exists,
// makes sure every current adult has an applicant_profiles row, computes
// the fee total, and stamps the household into Application Sent.
export async function sendApplication(householdId: string) {
  const { staff, supabase } = await ctx();

  const { data: household } = await supabase
    .from("households")
    .select("id, property_id, properties(application_fee_per_adult)")
    .eq("id", householdId)
    .single();
  if (!household?.property_id) throw new Error("Assign a property before sending an application.");

  const feePerAdult = Number(household.properties?.application_fee_per_adult ?? 85);

  let { data: application } = await supabase
    .from("applications")
    .select("id")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!application) {
    const { data: created, error } = await supabase
      .from("applications")
      .insert({ household_id: householdId, property_id: household.property_id })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "Could not create application");
    application = created;
  }

  const { data: adults } = await supabase
    .from("people")
    .select("id")
    .eq("household_id", householdId)
    .eq("is_adult", true);

  for (const adult of adults ?? []) {
    await supabase
      .from("applicant_profiles")
      .upsert(
        { application_id: application.id, person_id: adult.id },
        { onConflict: "application_id,person_id", ignoreDuplicates: true }
      );
  }

  const feeTotal = (adults?.length ?? 0) * feePerAdult;

  await supabase
    .from("applications")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      fee_total: feeTotal,
      token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", application.id);

  await supabase.from("households").update({ pipeline_stage: "application_sent" }).eq("id", householdId);

  await logActivity(supabase, {
    householdId,
    entityType: "application",
    entityId: application.id,
    eventType: "application_sent",
    description: `Application sent — ${adults?.length ?? 0} adult${(adults?.length ?? 0) === 1 ? "" : "s"}, $${feeTotal.toFixed(2)} fee`,
    actorId: staff.id,
  });

  revalidatePath(`/households/${householdId}`);
}

export async function recordPayment(householdId: string, formData: FormData) {
  const { staff, supabase } = await ctx();
  const amount = Number(formData.get("amount"));
  const paymentType = String(formData.get("payment_type"));

  const { error } = await supabase.from("payments").insert({
    household_id: householdId,
    payment_type: paymentType as
      | "application_fee"
      | "security_deposit"
      | "first_month_rent"
      | "monthly_rent"
      | "option_consideration"
      | "late_fee"
      | "refund"
      | "other",
    amount,
    status: "paid",
    paid_at: new Date().toISOString(),
    square_invoice_id: String(formData.get("square_invoice_id") ?? "") || null,
  });
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    householdId,
    entityType: "payment",
    eventType: "payment_recorded",
    description: `$${amount.toFixed(2)} ${paymentType.replace(/_/g, " ")} recorded`,
    actorId: staff.id,
  });

  revalidatePath(`/households/${householdId}`);
}

export async function addCommunication(householdId: string, formData: FormData) {
  const { staff, supabase } = await ctx();

  const { error } = await supabase.from("communications").insert({
    household_id: householdId,
    type: String(formData.get("type")) as "phone" | "text" | "email" | "in_person" | "internal_note" | "system",
    direction: String(formData.get("direction")) as "incoming" | "outgoing" | "internal",
    subject: String(formData.get("subject") ?? "") || null,
    content: String(formData.get("content") ?? "") || null,
    staff_user_id: staff.id,
  });
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    householdId,
    entityType: "communication",
    eventType: "communication_logged",
    description: `${String(formData.get("type"))} logged — ${String(formData.get("subject") ?? "no subject")}`,
    actorId: staff.id,
  });

  revalidatePath(`/households/${householdId}`);
}

export async function addTask(householdId: string, formData: FormData) {
  const { staff, supabase } = await ctx();

  const { error } = await supabase.from("tasks").insert({
    household_id: householdId,
    type: String(formData.get("type")),
    description: String(formData.get("description")),
    due_date: String(formData.get("due_date") ?? "") || null,
    assigned_to: staff.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/households/${householdId}`);
}

export async function completeTask(taskId: string, householdId: string) {
  const { supabase } = await ctx();
  await supabase.from("tasks").update({ status: "done" }).eq("id", taskId);
  revalidatePath(`/households/${householdId}`);
}

// Sends a staff-provided lease PDF out for signature via Dropbox Sign.
// We never generate lease legal language ourselves — staff upload their
// own (attorney-reviewed) document; this just handles the e-signature
// workflow around it.
export async function sendAgreement(householdId: string, formData: FormData) {
  const { staff, supabase } = await ctx();

  const agreementType = String(formData.get("agreement_type")) as "traditional_lease" | "lease_option";
  const file = formData.get("file") as File;
  const signerIds = formData.getAll("signer_ids") as string[];
  if (!file || file.size === 0) throw new Error("Attach a lease document.");
  if (signerIds.length === 0) throw new Error("Select at least one signer.");

  const { data: people } = await supabase
    .from("people")
    .select("id, first_name, last_name, email")
    .in("id", signerIds);

  const signers = (people ?? []).map((p) => ({
    name: `${p.first_name} ${p.last_name}`,
    email: p.email ?? "",
  }));
  if (signers.some((s) => !s.email)) throw new Error("Every signer needs an email on file.");

  const { data: property } = await supabase
    .from("households")
    .select("properties(name)")
    .eq("id", householdId)
    .single();

  const title = `${property?.properties?.name ?? "Lease"} — ${agreementType === "lease_option" ? "Lease with Option to Purchase" : "Lease Agreement"}`;

  const result = await sendSignatureRequest({
    title,
    subject: `Please sign: ${title}`,
    signers,
    file,
  });

  const { data: agreement, error } = await supabase
    .from("agreements")
    .insert({
      household_id: householdId,
      agreement_type: agreementType,
      dropbox_sign_request_id: result.signature_request_id,
      status: "sent",
      signers,
      sent_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !agreement) throw new Error(error?.message ?? "Could not save agreement record");

  await logActivity(supabase, {
    householdId,
    entityType: "agreement",
    entityId: agreement.id,
    eventType: "agreement_sent",
    description: `${title} sent for signature (${signers.map((s) => s.name).join(", ")})`,
    actorId: staff.id,
  });

  revalidatePath(`/households/${householdId}`);
}

export async function refreshAgreementStatus(householdId: string, agreementId: string) {
  const { staff, supabase } = await ctx();

  const { data: agreement } = await supabase
    .from("agreements")
    .select("id, dropbox_sign_request_id, status")
    .eq("id", agreementId)
    .single();
  if (!agreement?.dropbox_sign_request_id) return;

  const remote = await getSignatureRequest(agreement.dropbox_sign_request_id);

  let status: "sent" | "partially_signed" | "completed" | "declined" = "sent";
  if (remote.is_declined) status = "declined";
  else if (remote.is_complete) status = "completed";
  else if (remote.signatures.some((s) => s.status_code === "signed")) status = "partially_signed";

  const patch: {
    status: "sent" | "partially_signed" | "completed" | "declined";
    executed_document_path?: string;
    completed_at?: string;
  } = { status };

  if (status === "completed" && agreement.status !== "completed") {
    const fileBuffer = await downloadExecutedFile(agreement.dropbox_sign_request_id);
    const path = `${householdId}/${agreementId}.pdf`;
    await supabase.storage.from("agreements").upload(path, fileBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });
    patch.executed_document_path = path;
    patch.completed_at = new Date().toISOString();
  }

  await supabase.from("agreements").update(patch).eq("id", agreementId);

  if (status === "completed" && agreement.status !== "completed") {
    await logActivity(supabase, {
      householdId,
      entityType: "agreement",
      entityId: agreementId,
      eventType: "agreement_completed",
      description: "All parties have signed — executed document saved",
      actorId: staff.id,
    });
    await supabase.from("households").update({ pipeline_stage: "lease_signed" }).eq("id", householdId);
  }

  revalidatePath(`/households/${householdId}`);
}

export async function getAgreementDownloadUrl(path: string) {
  const { supabase } = await ctx();
  const { data } = await supabase.storage.from("agreements").createSignedUrl(path, 60 * 5);
  return data?.signedUrl ?? null;
}

// ---------------------------------------------------------------------
// Screening (RentPrep — manual workflow, no API available at this scale)
// ---------------------------------------------------------------------

export async function requestScreening(householdId: string, formData: FormData) {
  const { staff, supabase } = await ctx();
  const applicantProfileId = String(formData.get("applicant_profile_id"));
  const screeningType = String(formData.get("screening_type"));

  const { data: screening, error } = await supabase
    .from("screenings")
    .insert({
      applicant_profile_id: applicantProfileId,
      screening_type: screeningType,
      status: "requested",
      requested_at: new Date().toISOString(),
      requested_by: staff.id,
    })
    .select("id, applicant_profiles(people(first_name, last_name))")
    .single();
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    householdId,
    entityType: "screening",
    entityId: screening?.id,
    eventType: "screening_requested",
    description: `${screeningType.replace(/_/g, " ")} screening requested — ${screening?.applicant_profiles?.people?.first_name ?? ""} ${screening?.applicant_profiles?.people?.last_name ?? ""}`,
    actorId: staff.id,
  });

  revalidatePath(`/households/${householdId}`);
}

export async function updateScreeningStatus(householdId: string, formData: FormData) {
  const { staff, supabase } = await ctx();
  const screeningId = String(formData.get("screening_id"));
  const status = String(formData.get("status")) as "pending" | "completed" | "could_not_complete";
  const outcomeSummary = String(formData.get("outcome_summary") ?? "") || null;

  const patch: { status: typeof status; outcome_summary: string | null; completed_at?: string } = {
    status,
    outcome_summary: outcomeSummary,
  };
  if (status === "completed" || status === "could_not_complete") {
    patch.completed_at = new Date().toISOString();
  }

  const { data: screening, error } = await supabase
    .from("screenings")
    .update(patch)
    .eq("id", screeningId)
    .select("applicant_profiles(people(first_name, last_name))")
    .single();
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    householdId,
    entityType: "screening",
    entityId: screeningId,
    eventType: "screening_" + status,
    description: `Screening marked ${status.replace(/_/g, " ")} — ${screening?.applicant_profiles?.people?.first_name ?? ""} ${screening?.applicant_profiles?.people?.last_name ?? ""}`,
    actorId: staff.id,
  });

  revalidatePath(`/households/${householdId}`);
}

// ---------------------------------------------------------------------
// Verification workspace
// ---------------------------------------------------------------------

export async function saveLandlordVerification(householdId: string, formData: FormData) {
  const { staff, supabase } = await ctx();
  const residenceHistoryId = String(formData.get("residence_history_id"));
  const existingId = String(formData.get("verification_id") ?? "") || null;

  const payload = {
    residence_history_id: residenceHistoryId,
    contact_attempted_at: new Date().toISOString(),
    phone_used: String(formData.get("phone_used") ?? "") || null,
    email_used: String(formData.get("email_used") ?? "") || null,
    independently_verified: formData.get("independently_verified") === "on",
    person_spoken_to: String(formData.get("person_spoken_to") ?? "") || null,
    relationship_to_property: String(formData.get("relationship_to_property") ?? "") || null,
    tenancy_dates_confirmed: formData.get("tenancy_dates_confirmed") === "on",
    rent_payment_history_notes: String(formData.get("rent_payment_history_notes") ?? "") || null,
    lease_violations_notes: String(formData.get("lease_violations_notes") ?? "") || null,
    property_condition_notes: String(formData.get("property_condition_notes") ?? "") || null,
    notice_given_notes: String(formData.get("notice_given_notes") ?? "") || null,
    would_rent_again: String(formData.get("would_rent_again") ?? "unknown") as "yes" | "no" | "unknown",
    notes: String(formData.get("notes") ?? "") || null,
    verified_by: staff.id,
    verified_at: new Date().toISOString(),
  };

  const { error } = existingId
    ? await supabase.from("landlord_verifications").update(payload).eq("id", existingId)
    : await supabase.from("landlord_verifications").insert(payload);
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    householdId,
    entityType: "landlord_verification",
    eventType: "landlord_verified",
    description: `Landlord verification saved${payload.person_spoken_to ? ` — spoke with ${payload.person_spoken_to}` : ""}`,
    actorId: staff.id,
  });

  revalidatePath(`/households/${householdId}`);
}

export async function saveEmploymentVerification(householdId: string, formData: FormData) {
  const { staff, supabase } = await ctx();
  const employmentHistoryId = String(formData.get("employment_history_id"));
  const existingId = String(formData.get("verification_id") ?? "") || null;

  const payload = {
    employment_history_id: employmentHistoryId,
    verified: formData.get("verified") === "on",
    method: String(formData.get("method") ?? "") || null,
    source_person: String(formData.get("source_person") ?? "") || null,
    dates_confirmed: formData.get("dates_confirmed") === "on",
    income_verified: formData.get("income_verified") === "on",
    bank_income_verification_completed: formData.get("bank_income_verification_completed") === "on",
    discrepancies_notes: String(formData.get("discrepancies_notes") ?? "") || null,
    follow_up_required: formData.get("follow_up_required") === "on",
    notes: String(formData.get("notes") ?? "") || null,
    verified_by: staff.id,
    verified_at: new Date().toISOString(),
  };

  const { error } = existingId
    ? await supabase.from("employment_verifications").update(payload).eq("id", existingId)
    : await supabase.from("employment_verifications").insert(payload);
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    householdId,
    entityType: "employment_verification",
    eventType: "employment_verified",
    description: "Employment verification saved",
    actorId: staff.id,
  });

  revalidatePath(`/households/${householdId}`);
}

export async function saveReferenceCheck(householdId: string, formData: FormData) {
  const { staff, supabase } = await ctx();
  const applicantReferenceId = String(formData.get("applicant_reference_id"));
  const existingId = String(formData.get("check_id") ?? "") || null;

  const payload = {
    applicant_reference_id: applicantReferenceId,
    contact_attempted: true,
    attempted_at: new Date().toISOString(),
    outcome: String(formData.get("outcome") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
    verified_by: staff.id,
    verified_at: new Date().toISOString(),
  };

  const { error } = existingId
    ? await supabase.from("reference_checks").update(payload).eq("id", existingId)
    : await supabase.from("reference_checks").insert(payload);
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    householdId,
    entityType: "reference_check",
    eventType: "reference_checked",
    description: "Reference check saved",
    actorId: staff.id,
  });

  revalidatePath(`/households/${householdId}`);
}

// ---------------------------------------------------------------------
// Discrepancies
// ---------------------------------------------------------------------

export async function addDiscrepancy(householdId: string, formData: FormData) {
  const { staff, supabase } = await ctx();

  const { data: discrepancy, error } = await supabase
    .from("discrepancies")
    .insert({
      application_id: String(formData.get("application_id")),
      person_id: String(formData.get("person_id") ?? "") || null,
      category: String(formData.get("category")) as
        | "address_not_disclosed"
        | "employment_dates_inconsistent"
        | "income_discrepancy"
        | "landlord_identity_unverified"
        | "rental_dates_inconsistent"
        | "material_information_omitted"
        | "other",
      description: String(formData.get("description")),
      opened_by: staff.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    householdId,
    entityType: "discrepancy",
    entityId: discrepancy?.id,
    eventType: "discrepancy_opened",
    description: `Discrepancy opened — ${String(formData.get("category")).replace(/_/g, " ")}`,
    actorId: staff.id,
  });

  revalidatePath(`/households/${householdId}`);
}

export async function updateDiscrepancyStatus(householdId: string, formData: FormData) {
  const { staff, supabase } = await ctx();
  const discrepancyId = String(formData.get("discrepancy_id"));
  const status = String(formData.get("status")) as
    | "open"
    | "clarification_requested"
    | "explanation_received"
    | "verified"
    | "resolved"
    | "unresolved";

  const patch: {
    status: typeof status;
    applicant_explanation?: string;
    resolution_notes?: string;
    resolved_by?: string;
    resolved_at?: string;
  } = { status };

  const explanation = String(formData.get("applicant_explanation") ?? "");
  if (explanation) patch.applicant_explanation = explanation;
  const resolution = String(formData.get("resolution_notes") ?? "");
  if (resolution) patch.resolution_notes = resolution;
  if (["verified", "resolved", "unresolved"].includes(status)) {
    patch.resolved_by = staff.id;
    patch.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase.from("discrepancies").update(patch).eq("id", discrepancyId);
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    householdId,
    entityType: "discrepancy",
    entityId: discrepancyId,
    eventType: "discrepancy_" + status,
    description: `Discrepancy marked ${status.replace(/_/g, " ")}`,
    actorId: staff.id,
  });

  revalidatePath(`/households/${householdId}`);
}

// ---------------------------------------------------------------------
// Decision
// ---------------------------------------------------------------------

export async function recordDecision(householdId: string, formData: FormData) {
  const { staff, supabase } = await ctx();

  const outcome = String(formData.get("outcome")) as "approved" | "denied" | "withdrawn";
  const decisionTypeRaw = String(formData.get("decision_type") ?? "") || null;
  const decisionType = decisionTypeRaw as "traditional_lease" | "lease_option" | null;
  const adverseActionUsed = formData.get("adverse_action_report_used") === "on";

  const factorKeys = [
    "ability_to_meet_rent",
    "ability_to_provide_move_in_funds",
    "verified_income",
    "rental_payment_history",
    "credit_information",
    "eviction_history",
    "application_completeness",
    "landlord_verification",
    "employment_verification",
    "references",
    "material_discrepancies",
  ];
  const factors: Record<string, string> = {};
  for (const key of factorKeys) {
    const val = String(formData.get(`factor_${key}`) ?? "").trim();
    if (val) factors[key] = val;
  }

  const { data: application } = await supabase
    .from("applications")
    .select("id")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!application) throw new Error("No application found for this household.");

  const { data: decision, error } = await supabase
    .from("decisions")
    .insert({
      application_id: application.id,
      outcome,
      decision_type: decisionType,
      reasoning_notes: String(formData.get("reasoning_notes") ?? ""),
      factors,
      adverse_action_report_used: adverseActionUsed,
      decided_by: staff.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("households").update({ pipeline_stage: outcome }).eq("id", householdId);

  await logActivity(supabase, {
    householdId,
    entityType: "decision",
    entityId: decision?.id,
    eventType: "decision_recorded",
    description: `Application ${outcome}${adverseActionUsed ? " — screening report used, adverse action notices required" : ""}`,
    actorId: staff.id,
  });

  if (adverseActionUsed && outcome === "denied") {
    await supabase.from("tasks").insert({
      household_id: householdId,
      type: "adverse_action_notice",
      description: "Send pre-adverse action notice, then adverse action notice after waiting period (FCRA) — confirm exact language/timing with counsel.",
      assigned_to: staff.id,
    });
  }

  revalidatePath(`/households/${householdId}`);
}

export async function recordNoticeSent(householdId: string, formData: FormData) {
  const { staff, supabase } = await ctx();
  const decisionId = String(formData.get("decision_id"));
  const noticeField = String(formData.get("notice_field")) as "pre_adverse_notice_sent_at" | "adverse_notice_sent_at";

  const nowIso = new Date().toISOString();
  const patch =
    noticeField === "pre_adverse_notice_sent_at" ? { pre_adverse_notice_sent_at: nowIso } : { adverse_notice_sent_at: nowIso };

  const { error } = await supabase.from("decisions").update(patch).eq("id", decisionId);
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    householdId,
    entityType: "decision",
    entityId: decisionId,
    eventType: noticeField,
    description: noticeField === "pre_adverse_notice_sent_at" ? "Pre-adverse action notice sent" : "Adverse action notice sent",
    actorId: staff.id,
  });

  revalidatePath(`/households/${householdId}`);
}
