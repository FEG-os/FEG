import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/staff";
import HouseholdView from "./HouseholdView";
import {
  updateStage,
  updateOverview,
  addPerson,
  sendApplication,
  recordPayment,
  addCommunication,
  addTask,
  completeTask,
  sendAgreement,
  refreshAgreementStatus,
  getAgreementDownloadUrl,
} from "./actions";

export default async function HouseholdDetailPage({ params }: PageProps<"/households/[id]">) {
  const { id } = await params;
  await requireStaff();
  const supabase = await createClient();

  const { data: household } = await supabase
    .from("households")
    .select("*, properties(*)")
    .eq("id", id)
    .single();

  if (!household) notFound();

  const [
    { data: people },
    { data: applications },
    { data: payments },
    { data: communications },
    { data: tasks },
    { data: activity },
    { data: agreements },
  ] = await Promise.all([
    supabase.from("people").select("*").eq("household_id", id).order("created_at"),
    supabase
      .from("applications")
      .select("*, applicant_profiles(*, people(first_name, last_name))")
      .eq("household_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("payments").select("*").eq("household_id", id).order("created_at", { ascending: false }),
    supabase.from("communications").select("*").eq("household_id", id).order("occurred_at", { ascending: false }),
    supabase.from("tasks").select("*").eq("household_id", id).order("due_date"),
    supabase.from("activity_log").select("*").eq("household_id", id).order("occurred_at", { ascending: false }),
    supabase.from("agreements").select("*").eq("household_id", id).order("created_at", { ascending: false }),
  ]);

  return (
    <HouseholdView
      household={household}
      people={people ?? []}
      applications={applications ?? []}
      payments={payments ?? []}
      communications={communications ?? []}
      tasks={tasks ?? []}
      activity={activity ?? []}
      agreements={agreements ?? []}
      actions={{
        updateStage: updateStage.bind(null, id),
        updateOverview: updateOverview.bind(null, id),
        addPerson: addPerson.bind(null, id),
        sendApplication: sendApplication.bind(null, id),
        recordPayment: recordPayment.bind(null, id),
        addCommunication: addCommunication.bind(null, id),
        addTask: addTask.bind(null, id),
        completeTask: completeTask.bind(null, id),
        sendAgreement: sendAgreement.bind(null, id),
        refreshAgreementStatus: refreshAgreementStatus.bind(null, id),
        getAgreementDownloadUrl,
      }}
    />
  );
}
