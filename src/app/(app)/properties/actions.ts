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

export async function deleteProperty(propertyId: string) {
  const staff = await requireStaff();
  if (staff.role !== "owner") {
    throw new Error("Only an owner can delete a property.");
  }
  const supabase = await createClient();

  const { count } = await supabase
    .from("households")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);

  if (count && count > 0) {
    throw new Error(
      `This property has ${count} household${count === 1 ? "" : "s"} attached — remove or reassign ${count === 1 ? "it" : "them"} first.`
    );
  }

  const { error } = await supabase.from("properties").delete().eq("id", propertyId);
  if (error) throw new Error(error.message);

  revalidatePath("/properties");
}
