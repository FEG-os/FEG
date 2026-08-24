"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/staff";

export async function completeTaskGlobal(taskId: string) {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from("tasks").update({ status: "done" }).eq("id", taskId);
  revalidatePath("/tasks");
}
