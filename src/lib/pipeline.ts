export const PIPELINE_STAGES = [
  "new_lead",
  "contacted",
  "showing_scheduled",
  "showed",
  "interested",
  "application_sent",
  "application_started",
  "application_submitted",
  "payment_received",
  "screening",
  "verification",
  "under_review",
  "approved",
  "denied",
  "withdrawn",
  "lease_sent",
  "lease_signed",
  "tenant",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  new_lead: "New Lead",
  contacted: "Contacted",
  showing_scheduled: "Showing Scheduled",
  showed: "Showed",
  interested: "Interested",
  application_sent: "Application Sent",
  application_started: "Application Started",
  application_submitted: "Application Submitted",
  payment_received: "Payment Received",
  screening: "Screening",
  verification: "Verification",
  under_review: "Under Review",
  approved: "Approved",
  denied: "Denied",
  withdrawn: "Withdrawn",
  lease_sent: "Lease Sent",
  lease_signed: "Lease Signed",
  tenant: "Tenant",
};

export function stageTone(stage: PipelineStage): "flat" | "good" | "warn" | "crit" | "info" {
  if (stage === "approved" || stage === "tenant" || stage === "lease_signed") return "good";
  if (stage === "denied" || stage === "withdrawn") return "crit";
  if (["screening", "verification", "under_review"].includes(stage)) return "warn";
  if (["application_sent", "application_started", "application_submitted", "payment_received", "lease_sent"].includes(stage))
    return "info";
  return "flat";
}
