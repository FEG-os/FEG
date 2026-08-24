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
  requestScreening,
  updateScreeningStatus,
  saveLandlordVerification,
  saveEmploymentVerification,
  saveReferenceCheck,
  addDiscrepancy,
  updateDiscrepancyStatus,
  recordDecision,
  recordNoticeSent,
  uploadDocument,
  getDocumentDownloadUrl,
  addNotice,
  addMaintenanceRequest,
  resolveMaintenanceRequest,
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
    { data: documents },
    { data: notices },
    { data: maintenanceRequests },
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
    supabase.from("documents").select("*").eq("household_id", id).order("created_at", { ascending: false }),
    supabase.from("notices").select("*").eq("household_id", id).order("sent_at", { ascending: false }),
    supabase.from("maintenance_requests").select("*").eq("household_id", id).order("reported_at", { ascending: false }),
  ]);

  const latestApplicationId = applications?.[0]?.id as string | undefined;

  const [{ data: applicantProfiles }, { data: discrepancies }, { data: decisions }] = await Promise.all([
    latestApplicationId
      ? supabase
          .from("applicant_profiles")
          .select(
            `id, current_address, status, person_id,
             people(first_name, last_name),
             screenings(*),
             residence_history(*, landlord_verifications(*)),
             employment_history(*, employment_verifications(*)),
             applicant_references(*, reference_checks(*))`
          )
          .eq("application_id", latestApplicationId)
      : Promise.resolve({ data: [] }),
    latestApplicationId
      ? supabase
          .from("discrepancies")
          .select("*, people(first_name, last_name)")
          .eq("application_id", latestApplicationId)
          .order("opened_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    latestApplicationId
      ? supabase.from("decisions").select("*").eq("application_id", latestApplicationId).order("decided_at", { ascending: false })
      : Promise.resolve({ data: [] }),
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
      applicantProfiles={applicantProfiles ?? []}
      discrepancies={discrepancies ?? []}
      decisions={decisions ?? []}
      documents={documents ?? []}
      notices={notices ?? []}
      maintenanceRequests={maintenanceRequests ?? []}
      latestApplicationId={latestApplicationId ?? null}
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
        requestScreening: requestScreening.bind(null, id),
        updateScreeningStatus: updateScreeningStatus.bind(null, id),
        saveLandlordVerification: saveLandlordVerification.bind(null, id),
        saveEmploymentVerification: saveEmploymentVerification.bind(null, id),
        saveReferenceCheck: saveReferenceCheck.bind(null, id),
        addDiscrepancy: addDiscrepancy.bind(null, id),
        updateDiscrepancyStatus: updateDiscrepancyStatus.bind(null, id),
        recordDecision: recordDecision.bind(null, id),
        recordNoticeSent: recordNoticeSent.bind(null, id),
        uploadDocument: uploadDocument.bind(null, id),
        getDocumentDownloadUrl,
        addNotice: addNotice.bind(null, id),
        addMaintenanceRequest: addMaintenanceRequest.bind(null, id),
        resolveMaintenanceRequest: resolveMaintenanceRequest.bind(null, id),
      }}
    />
  );
}
