"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/staff";
import { logActivity } from "@/lib/activity";

export async function createHousehold(formData: FormData) {
  const staff = await requireStaff();
  const supabase = await createClient();

  const propertyId = String(formData.get("property_id"));
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();

  const { data: household, error } = await supabase
    .from("households")
    .insert({
      property_id: propertyId || null,
      lead_source: String(formData.get("lead_source") ?? "") || null,
      rental_type_interest: String(formData.get("rental_type_interest") ?? "undecided") as "traditional" | "lease_option" | "undecided",
      desired_move_in: String(formData.get("desired_move_in") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
      assigned_staff_id: staff.id,
    })
    .select("id")
    .single();

  if (error || !household) throw new Error(error?.message ?? "Could not create household");

  if (firstName) {
    await supabase.from("people").insert({
      household_id: household.id,
      first_name: firstName,
      last_name: lastName,
      is_adult: true,
      phone: String(formData.get("phone") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
    });
  }

  await logActivity(supabase, {
    householdId: household.id,
    entityType: "household",
    entityId: household.id,
    eventType: "household_created",
    description: `New lead created${firstName ? ` — ${firstName} ${lastName}` : ""}`,
    actorId: staff.id,
  });

  redirect(`/households/${household.id}`);
}
