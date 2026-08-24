"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/staff";

export async function createProperty(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase.from("properties").insert({
    name: String(formData.get("name")),
    address: String(formData.get("address")),
    monthly_rent: Number(formData.get("monthly_rent")),
    security_deposit: Number(formData.get("security_deposit")),
    is_furnished: formData.get("is_furnished") === "on",
    pet_deposit_allowed: formData.get("pet_deposit_allowed") === "on",
    application_fee_per_adult: Number(formData.get("application_fee_per_adult") || 85),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/properties");
}
