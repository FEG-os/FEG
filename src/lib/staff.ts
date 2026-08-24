import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StaffUser = {
  id: string;
  full_name: string;
  email: string;
  role: "owner" | "staff" | "readonly";
};

// Server-only. Fetches the logged-in staff profile or bounces to /login.
// Middleware already gates unauthenticated visitors off internal routes;
// this additionally confirms a staff_users row exists (an auth user
// without one shouldn't be treated as staff).
export async function requireStaff(): Promise<StaffUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: staff } = await supabase
    .from("staff_users")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .single();

  if (!staff) redirect("/login?error=not_staff");

  return staff as StaffUser;
}
