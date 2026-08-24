"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/staff";
import { logActivity } from "@/lib/activity";
import { STAGE_LABELS, type PipelineStage } from "@/lib/pipeline";

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
