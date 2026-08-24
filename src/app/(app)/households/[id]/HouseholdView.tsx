"use client";

import { useState } from "react";
import { PIPELINE_STAGES, STAGE_LABELS } from "@/lib/pipeline";

const TABS = [
  "Overview",
  "People",
  "Application",
  "Screening",
  "Verification",
  "Discrepancies",
  "Decision",
  "Agreements",
  "Documents",
  "Payments",
  "Communications",
  "Notices",
  "Maintenance",
  "Tasks",
  "Activity",
] as const;

type Tab = (typeof TABS)[number];

// Loosely typed — these come from Supabase joins whose shapes aren't worth
// hand-modeling here. Real column names match supabase/migrations/0001_init.sql.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const TONE_CLASSES: Record<string, string> = {
  flat: "bg-surface-2 text-ink-soft",
  info: "bg-info-bg text-info",
  warn: "bg-warn-bg text-warn",
  good: "bg-good-bg text-good",
  crit: "bg-crit-bg text-crit",
};

export default function HouseholdView({
  household,
  people,
  applications,
  payments,
  communications,
  tasks,
  activity,
  agreements,
  applicantProfiles,
  discrepancies,
  decisions,
  documents,
  notices,
  maintenanceRequests,
  latestApplicationId,
  actions,
}: {
  household: Row;
  people: Row[];
  applications: Row[];
  payments: Row[];
  communications: Row[];
  tasks: Row[];
  activity: Row[];
  agreements: Row[];
  applicantProfiles: Row[];
  discrepancies: Row[];
  decisions: Row[];
  documents: Row[];
  notices: Row[];
  maintenanceRequests: Row[];
  latestApplicationId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actions: Record<string, (...args: any[]) => Promise<any>>;
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const primary = people.find((p) => p.is_adult) ?? people[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-ink">
            {primary ? `${primary.first_name} ${primary.last_name}` : "Unnamed household"}
          </h1>
          <p className="text-sm text-ink-soft mt-0.5">{household.properties?.name ?? "No property assigned"}</p>
        </div>
        <form action={async (fd) => actions.updateStage(fd)} className="flex items-center gap-2">
          <select
            key={household.pipeline_stage}
            name="pipeline_stage"
            defaultValue={household.pipeline_stage}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="rounded border border-line bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
          >
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </form>
      </div>

      <div className="border-b border-line flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px ${
              tab === t ? "border-accent text-ink font-medium" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <Overview household={household} action={actions.updateOverview} />}
      {tab === "People" && <People people={people} action={actions.addPerson} />}
      {tab === "Application" && (
        <ApplicationTab applications={applications} onSend={actions.sendApplication} adults={people.filter((p) => p.is_adult).length} />
      )}
      {tab === "Screening" && (
        <Screening applicantProfiles={applicantProfiles} onRequest={actions.requestScreening} onUpdateStatus={actions.updateScreeningStatus} />
      )}
      {tab === "Verification" && (
        <Verification
          applicantProfiles={applicantProfiles}
          onSaveLandlord={actions.saveLandlordVerification}
          onSaveEmployment={actions.saveEmploymentVerification}
          onSaveReference={actions.saveReferenceCheck}
        />
      )}
      {tab === "Discrepancies" && (
        <Discrepancies
          discrepancies={discrepancies}
          applicantProfiles={applicantProfiles}
          applicationId={latestApplicationId}
          onAdd={actions.addDiscrepancy}
          onUpdateStatus={actions.updateDiscrepancyStatus}
        />
      )}
      {tab === "Decision" && (
        <Decision decisions={decisions} onRecord={actions.recordDecision} onRecordNotice={actions.recordNoticeSent} />
      )}
      {tab === "Agreements" && (
        <Agreements
          agreements={agreements}
          adults={people.filter((p) => p.is_adult)}
          onSend={actions.sendAgreement}
          onRefresh={actions.refreshAgreementStatus}
          onGetDownloadUrl={actions.getAgreementDownloadUrl}
        />
      )}
      {tab === "Documents" && (
        <Documents documents={documents} onUpload={actions.uploadDocument} onGetDownloadUrl={actions.getDocumentDownloadUrl} />
      )}
      {tab === "Payments" && <Payments payments={payments} action={actions.recordPayment} />}
      {tab === "Communications" && <Communications items={communications} action={actions.addCommunication} />}
      {tab === "Notices" && <Notices notices={notices} onAdd={actions.addNotice} />}
      {tab === "Maintenance" && (
        <Maintenance requests={maintenanceRequests} onAdd={actions.addMaintenanceRequest} onResolve={actions.resolveMaintenanceRequest} />
      )}
      {tab === "Tasks" && <Tasks tasks={tasks} onAdd={actions.addTask} onComplete={actions.completeTask} />}
      {tab === "Activity" && <Activity items={activity} />}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded border border-line bg-surface p-4 max-w-2xl">{children}</div>;
}

function Overview({ household, action }: { household: Row; action: (fd: FormData) => Promise<void> }) {
  return (
    <Card>
      <form action={action} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink-soft">Interest</label>
          <select
            name="rental_type_interest"
            defaultValue={household.rental_type_interest}
            className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="undecided">Undecided</option>
            <option value="traditional">Traditional rental</option>
            <option value="lease_option">Lease with option to purchase</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink-soft">Lead source</label>
          <input
            name="lead_source"
            defaultValue={household.lead_source ?? ""}
            className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink-soft">Desired move-in</label>
          <input
            type="date"
            name="desired_move_in"
            defaultValue={household.desired_move_in ?? ""}
            className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink-soft">Notes</label>
          <textarea
            name="notes"
            rows={4}
            defaultValue={household.notes ?? ""}
            className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <button type="submit" className="rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90 self-start">
          Save
        </button>
      </form>
    </Card>
  );
}

function People({ people, action }: { people: Row[]; action: (fd: FormData) => Promise<void> }) {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="rounded border border-line bg-surface divide-y divide-line">
        {people.length === 0 && <p className="p-4 text-sm text-ink-soft">No one added yet.</p>}
        {people.map((p) => (
          <div key={p.id} className="p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">
                {p.first_name} {p.last_name}
              </p>
              <p className="text-xs text-ink-soft">
                {p.is_adult ? "Adult" : "Minor"}
                {p.relationship_role ? ` · ${p.relationship_role}` : ""}
                {p.phone ? ` · ${p.phone}` : ""}
                {p.email ? ` · ${p.email}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Add a person</h3>
        <form action={action} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input name="first_name" placeholder="First name" required className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
            <input name="last_name" placeholder="Last name" required className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="is_adult" defaultChecked className="rounded border-line" />
            Adult (18+, will need to apply)
          </label>
          <input name="relationship_role" placeholder="Relationship (spouse, child…)" className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
          <div className="grid grid-cols-2 gap-3">
            <input name="phone" placeholder="Phone" className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
            <input name="email" placeholder="Email" className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
          </div>
          <button type="submit" className="rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90 self-start">
            Add
          </button>
        </form>
      </Card>
    </div>
  );
}

function ApplicationTab({ applications, onSend, adults }: { applications: Row[]; onSend: () => Promise<void>; adults: number }) {
  const [origin, setOrigin] = useState("");
  if (typeof window !== "undefined" && !origin) setOrigin(window.location.origin);

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Card>
        <p className="text-sm text-ink-soft mb-3">
          {adults} adult{adults === 1 ? "" : "s"} currently on this household. Sending (re)computes the fee and makes sure
          each adult has an applicant profile.
        </p>
        <form action={onSend}>
          <button type="submit" className="rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90">
            {applications.length === 0 ? "Send application" : "Refresh & resend"}
          </button>
        </form>
      </Card>

      {applications.map((app) => (
        <Card key={app.id}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs rounded-full bg-surface-2 px-2 py-0.5 text-ink-soft capitalize">{app.status}</span>
            <span className="text-sm tabular text-ink-soft">{app.fee_total ? `$${Number(app.fee_total).toFixed(2)}` : ""}</span>
          </div>
          <p className="text-xs text-ink-soft break-all mb-2">
            {origin}/apply/{app.access_token}
          </p>
          <div className="divide-y divide-line">
            {(app.applicant_profiles ?? []).map((ap: Row) => (
              <div key={ap.id} className="py-2 flex items-center justify-between text-sm">
                <span>
                  {ap.people?.first_name} {ap.people?.last_name}
                </span>
                <span className="text-xs text-ink-soft capitalize">{ap.status.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

const PAYMENT_TYPES = [
  "application_fee",
  "security_deposit",
  "first_month_rent",
  "monthly_rent",
  "option_consideration",
  "late_fee",
  "refund",
  "other",
];

function Payments({ payments, action }: { payments: Row[]; action: (fd: FormData) => Promise<void> }) {
  const total = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0);
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="rounded border border-line bg-surface divide-y divide-line">
        {payments.length === 0 && <p className="p-4 text-sm text-ink-soft">No payments recorded yet.</p>}
        {payments.map((p) => (
          <div key={p.id} className="p-3 flex items-center justify-between text-sm">
            <span className="capitalize">{p.payment_type.replace(/_/g, " ")}</span>
            <span className="tabular">${Number(p.amount).toFixed(2)}</span>
            <span className="text-xs text-ink-soft capitalize">{p.status}</span>
          </div>
        ))}
        {payments.length > 0 && (
          <div className="p-3 flex items-center justify-between text-sm font-medium">
            <span>Total paid</span>
            <span className="tabular">${total.toFixed(2)}</span>
          </div>
        )}
      </div>
      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Record a payment</h3>
        <p className="text-xs text-ink-soft mb-3">
          For manual entries only (bank deposits, cash). Square-paid fees will populate automatically once webhooks are wired up.
        </p>
        <form action={action} className="flex flex-col gap-3">
          <select name="payment_type" required className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent">
            {PAYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <input name="amount" type="number" step="0.01" placeholder="Amount" required className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
          <input name="square_invoice_id" placeholder="Square invoice ID (optional)" className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
          <button type="submit" className="rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90 self-start">
            Record
          </button>
        </form>
      </Card>
    </div>
  );
}

function Communications({ items, action }: { items: Row[]; action: (fd: FormData) => Promise<void> }) {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="rounded border border-line bg-surface divide-y divide-line">
        {items.length === 0 && <p className="p-4 text-sm text-ink-soft">Nothing logged yet.</p>}
        {items.map((c) => (
          <div key={c.id} className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize">
                {c.type} · {c.direction}
              </span>
              <span className="text-xs text-ink-soft tabular">{new Date(c.occurred_at).toLocaleString()}</span>
            </div>
            {c.subject && <p className="text-sm text-ink mt-1">{c.subject}</p>}
            {c.content && <p className="text-sm text-ink-soft mt-1 whitespace-pre-wrap">{c.content}</p>}
          </div>
        ))}
      </div>
      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Log a communication</h3>
        <form action={action} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <select name="type" className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent">
              <option value="phone">Phone</option>
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="in_person">In person</option>
              <option value="internal_note">Internal note</option>
            </select>
            <select name="direction" className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent">
              <option value="outgoing">Outgoing</option>
              <option value="incoming">Incoming</option>
              <option value="internal">Internal</option>
            </select>
          </div>
          <input name="subject" placeholder="Subject" className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
          <textarea name="content" rows={3} placeholder="Notes" className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
          <button type="submit" className="rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90 self-start">
            Log it
          </button>
        </form>
      </Card>
    </div>
  );
}

function Tasks({ tasks, onAdd, onComplete }: { tasks: Row[]; onAdd: (fd: FormData) => Promise<void>; onComplete: (id: string) => Promise<void> }) {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="rounded border border-line bg-surface divide-y divide-line">
        {tasks.length === 0 && <p className="p-4 text-sm text-ink-soft">No open tasks.</p>}
        {tasks.map((t) => (
          <div key={t.id} className="p-3 flex items-center justify-between">
            <div>
              <p className={`text-sm ${t.status === "done" ? "line-through text-ink-soft" : "text-ink"}`}>{t.description}</p>
              <p className="text-xs text-ink-soft">
                {t.type}
                {t.due_date ? ` · due ${t.due_date}` : ""}
              </p>
            </div>
            {t.status !== "done" && (
              <form action={async () => onComplete(t.id)}>
                <button className="text-xs text-accent hover:underline">Mark done</button>
              </form>
            )}
          </div>
        ))}
      </div>
      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Add a task</h3>
        <form action={onAdd} className="flex flex-col gap-3">
          <input name="type" placeholder="Type (call landlord, verify employer…)" required className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
          <input name="description" placeholder="Description" required className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
          <input name="due_date" type="date" className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
          <button type="submit" className="rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90 self-start">
            Add task
          </button>
        </form>
      </Card>
    </div>
  );
}

function Activity({ items }: { items: Row[] }) {
  return (
    <div className="max-w-2xl rounded border border-line bg-surface divide-y divide-line">
      {items.length === 0 && <p className="p-4 text-sm text-ink-soft">Nothing yet.</p>}
      {items.map((a) => (
        <div key={a.id} className="p-3">
          <p className="text-sm text-ink">{a.description}</p>
          <p className="text-xs text-ink-soft tabular mt-0.5">{new Date(a.occurred_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

const AGREEMENT_STATUS_TONE: Record<string, string> = {
  draft: "flat",
  generated: "flat",
  sent: "info",
  partially_signed: "warn",
  completed: "good",
  declined: "crit",
};

function Agreements({
  agreements,
  adults,
  onSend,
  onRefresh,
  onGetDownloadUrl,
}: {
  agreements: Row[];
  adults: Row[];
  onSend: (fd: FormData) => Promise<void>;
  onRefresh: (agreementId: string) => Promise<void>;
  onGetDownloadUrl: (path: string) => Promise<string | null>;
}) {
  const [sending, setSending] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const missingEmail = adults.filter((a) => !a.email);

  async function handleSend(fd: FormData) {
    setSending(true);
    try {
      await onSend(fd);
    } finally {
      setSending(false);
    }
  }

  async function handleRefresh(id: string) {
    setRefreshingId(id);
    try {
      await onRefresh(id);
    } finally {
      setRefreshingId(null);
    }
  }

  async function handleDownload(path: string) {
    const url = await onGetDownloadUrl(path);
    if (url) window.open(url, "_blank");
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {agreements.length === 0 && (
        <p className="text-sm text-ink-soft">Nothing sent yet.</p>
      )}

      {agreements.map((a) => (
        <Card key={a.id}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-ink capitalize">
              {a.agreement_type === "lease_option" ? "Lease with option to purchase" : "Traditional lease"}
            </span>
            <span
              className={`text-xs rounded-full px-2 py-0.5 capitalize ${TONE_CLASSES[AGREEMENT_STATUS_TONE[a.status] ?? "flat"]}`}
            >
              {String(a.status).replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-ink-soft mb-2">
            Signers: {(a.signers ?? []).map((s: { name: string }) => s.name).join(", ")}
          </p>
          <div className="flex items-center gap-3">
            {a.status !== "completed" && a.status !== "declined" && (
              <button
                onClick={() => handleRefresh(a.id)}
                disabled={refreshingId === a.id}
                className="text-xs text-accent hover:underline disabled:opacity-60"
              >
                {refreshingId === a.id ? "Checking…" : "Refresh status"}
              </button>
            )}
            {a.executed_document_path && (
              <button onClick={() => handleDownload(a.executed_document_path)} className="text-xs text-accent hover:underline">
                Download executed PDF
              </button>
            )}
          </div>
        </Card>
      ))}

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-1">Send a new agreement</h3>
        <p className="text-xs text-ink-soft mb-3">
          Upload your own lease document (PDF) — this app never generates lease language itself. Dropbox Sign handles
          the signatures; each adult signer needs an email on file.
        </p>
        {missingEmail.length > 0 && (
          <p className="text-xs text-warn mb-3">
            Missing email for: {missingEmail.map((p) => `${p.first_name} ${p.last_name}`).join(", ")} — add it under People first.
          </p>
        )}
        <form action={handleSend} className="flex flex-col gap-3">
          <select name="agreement_type" required className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent">
            <option value="traditional_lease">Traditional lease</option>
            <option value="lease_option">Lease with option to purchase</option>
          </select>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-ink-soft">Signers</span>
            {adults.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  name="signer_ids"
                  value={a.id}
                  defaultChecked={Boolean(a.email)}
                  className="rounded border-line"
                  disabled={!a.email}
                />
                {a.first_name} {a.last_name} {!a.email && <span className="text-warn text-xs">(no email)</span>}
              </label>
            ))}
          </div>
          <input
            type="file"
            name="file"
            accept="application/pdf"
            required
            className="text-sm text-ink-soft file:mr-3 file:rounded file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-ink"
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:bg-accent-strong disabled:opacity-60 self-start"
          >
            {sending ? "Sending…" : "Send for signature"}
          </button>
        </form>
      </Card>
    </div>
  );
}

const SCREENING_TYPES = [
  { value: "complete", label: "RentPrep Complete" },
  { value: "income_verification", label: "Income Verification" },
];

const SCREENING_TONE: Record<string, string> = {
  not_started: "flat",
  requested: "info",
  pending: "warn",
  completed: "good",
  could_not_complete: "crit",
};

function Screening({
  applicantProfiles,
  onRequest,
  onUpdateStatus,
}: {
  applicantProfiles: Row[];
  onRequest: (fd: FormData) => Promise<void>;
  onUpdateStatus: (fd: FormData) => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {applicantProfiles.length === 0 && <p className="text-sm text-ink-soft">No submitted application yet.</p>}
      {applicantProfiles.map((ap) => (
        <Card key={ap.id}>
          <h3 className="text-sm font-semibold text-ink mb-3">
            {ap.people?.first_name} {ap.people?.last_name}
          </h3>
          <div className="flex flex-col gap-2 mb-3">
            {(ap.screenings ?? []).length === 0 && <p className="text-xs text-ink-soft">No screening requested yet.</p>}
            {(ap.screenings ?? []).map((s: Row) => (
              <ScreeningRow key={s.id} screening={s} onUpdateStatus={onUpdateStatus} />
            ))}
          </div>
          <form action={onRequest} className="flex items-center gap-2">
            <input type="hidden" name="applicant_profile_id" value={ap.id} />
            <select
              name="screening_type"
              className="rounded border border-line bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
            >
              {SCREENING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink hover:bg-accent-strong">
              Start screening
            </button>
          </form>
        </Card>
      ))}
    </div>
  );
}

function ScreeningRow({ screening, onUpdateStatus }: { screening: Row; onUpdateStatus: (fd: FormData) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="rounded border border-line p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink capitalize">{screening.screening_type.replace(/_/g, " ")}</span>
        <span className={`text-xs rounded-full px-2 py-0.5 capitalize ${TONE_CLASSES[SCREENING_TONE[screening.status] ?? "flat"]}`}>
          {screening.status.replace(/_/g, " ")}
        </span>
      </div>
      {screening.outcome_summary && <p className="text-xs text-ink-soft mt-1">{screening.outcome_summary}</p>}
      {screening.status !== "completed" && screening.status !== "could_not_complete" && (
        <div className="mt-2">
          {!editing ? (
            <button onClick={() => setEditing(true)} className="text-xs text-accent hover:underline">
              Mark outcome
            </button>
          ) : (
            <form action={onUpdateStatus} className="flex flex-col gap-2 mt-1">
              <input type="hidden" name="screening_id" value={screening.id} />
              <select
                name="status"
                defaultValue="completed"
                className="rounded border border-line bg-surface px-2 py-1 text-xs outline-none focus:border-accent"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="could_not_complete">Could not complete</option>
              </select>
              <textarea
                name="outcome_summary"
                placeholder="Lawful summary of the outcome (not the raw report)"
                rows={2}
                className="rounded border border-line bg-surface px-2 py-1 text-xs outline-none focus:border-accent"
              />
              <button
                type="submit"
                className="rounded bg-accent px-2 py-1 text-xs font-medium text-accent-ink hover:bg-accent-strong self-start"
              >
                Save
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function Verification({
  applicantProfiles,
  onSaveLandlord,
  onSaveEmployment,
  onSaveReference,
}: {
  applicantProfiles: Row[];
  onSaveLandlord: (fd: FormData) => Promise<void>;
  onSaveEmployment: (fd: FormData) => Promise<void>;
  onSaveReference: (fd: FormData) => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {applicantProfiles.length === 0 && <p className="text-sm text-ink-soft">No submitted application yet.</p>}
      {applicantProfiles.map((ap) => (
        <div key={ap.id} className="flex flex-col gap-4">
          <h3 className="font-display text-base text-ink">
            {ap.people?.first_name} {ap.people?.last_name}
          </h3>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">Residence history</h4>
            <div className="flex flex-col gap-3">
              {(ap.residence_history ?? []).length === 0 && <p className="text-xs text-ink-soft">None disclosed.</p>}
              {(ap.residence_history ?? []).map((r: Row) => (
                <LandlordVerificationCard key={r.id} residence={r} onSave={onSaveLandlord} />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">Employment</h4>
            <div className="flex flex-col gap-3">
              {(ap.employment_history ?? []).length === 0 && <p className="text-xs text-ink-soft">None disclosed.</p>}
              {(ap.employment_history ?? []).map((e: Row) => (
                <EmploymentVerificationCard key={e.id} employment={e} onSave={onSaveEmployment} />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">References</h4>
            <div className="flex flex-col gap-3">
              {(ap.applicant_references ?? []).length === 0 && <p className="text-xs text-ink-soft">None disclosed.</p>}
              {(ap.applicant_references ?? []).map((r: Row) => (
                <ReferenceCheckCard key={r.id} reference={r} onSave={onSaveReference} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const fieldCls = "rounded border border-line bg-surface px-2 py-1 text-xs outline-none focus:border-accent";

function LandlordVerificationCard({ residence, onSave }: { residence: Row; onSave: (fd: FormData) => Promise<void> }) {
  const v = residence.landlord_verifications?.[0];
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded border border-line p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink">{residence.address}</p>
          <p className="text-xs text-ink-soft">
            {residence.move_in_date ?? "?"} – {residence.move_out_date ?? "present"} · ${residence.rent_amount ?? "?"}/mo · Landlord:{" "}
            {residence.landlord_name ?? "—"} {residence.landlord_phone ?? ""}
          </p>
        </div>
        <span className={`text-xs rounded-full px-2 py-0.5 whitespace-nowrap ${v?.verified_at ? TONE_CLASSES.good : TONE_CLASSES.flat}`}>
          {v?.verified_at ? "Verified" : "Not verified"}
        </span>
      </div>
      <button onClick={() => setOpen(!open)} className="text-xs text-accent hover:underline mt-2">
        {open ? "Hide" : v ? "Edit verification" : "Verify landlord"}
      </button>
      {open && (
        <form key={v?.verified_at ?? "new"} action={onSave} className="flex flex-col gap-2 mt-3">
          <input type="hidden" name="residence_history_id" value={residence.id} />
          {v && <input type="hidden" name="verification_id" value={v.id} />}
          <div className="grid grid-cols-2 gap-2">
            <input name="phone_used" defaultValue={v?.phone_used ?? residence.landlord_phone ?? ""} placeholder="Phone used" className={fieldCls} />
            <input name="email_used" defaultValue={v?.email_used ?? residence.landlord_email ?? ""} placeholder="Email used" className={fieldCls} />
          </div>
          <label className="flex items-start gap-2 text-xs text-ink">
            <input type="checkbox" name="independently_verified" defaultChecked={v?.independently_verified} className="mt-0.5 rounded border-line" />
            Independently confirmed this contact owns/manages the property, rather than just trusting the number the applicant gave
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input name="person_spoken_to" defaultValue={v?.person_spoken_to ?? ""} placeholder="Person spoken to" className={fieldCls} />
            <input
              name="relationship_to_property"
              defaultValue={v?.relationship_to_property ?? ""}
              placeholder="Their relationship to property"
              className={fieldCls}
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-ink">
            <input type="checkbox" name="tenancy_dates_confirmed" defaultChecked={v?.tenancy_dates_confirmed} className="rounded border-line" />
            Tenancy dates confirmed
          </label>
          <textarea name="rent_payment_history_notes" defaultValue={v?.rent_payment_history_notes ?? ""} placeholder="Rent / payment history" rows={2} className={fieldCls} />
          <textarea name="lease_violations_notes" defaultValue={v?.lease_violations_notes ?? ""} placeholder="Lease violations (if lawfully relevant)" rows={2} className={fieldCls} />
          <textarea name="property_condition_notes" defaultValue={v?.property_condition_notes ?? ""} placeholder="Property condition on move-out" rows={2} className={fieldCls} />
          <textarea name="notice_given_notes" defaultValue={v?.notice_given_notes ?? ""} placeholder="Notice given" rows={2} className={fieldCls} />
          <div className="flex items-center gap-2">
            <label className="text-xs text-ink-soft">Would rent again?</label>
            <select name="would_rent_again" defaultValue={v?.would_rent_again ?? "unknown"} className={fieldCls}>
              <option value="unknown">Unknown</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <textarea name="notes" defaultValue={v?.notes ?? ""} placeholder="Other notes" rows={2} className={fieldCls} />
          <button type="submit" className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-ink hover:bg-accent-strong self-start">
            Save verification
          </button>
        </form>
      )}
    </div>
  );
}

function EmploymentVerificationCard({ employment, onSave }: { employment: Row; onSave: (fd: FormData) => Promise<void> }) {
  const v = employment.employment_verifications?.[0];
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded border border-line p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink">
            {employment.employer_name} {employment.is_current && <span className="text-xs text-ink-soft">(current)</span>}
          </p>
          <p className="text-xs text-ink-soft">
            {employment.position ?? "—"} · {employment.employer_phone ?? "no phone"} · ${employment.income_amount ?? "?"}{" "}
            {employment.income_frequency}
          </p>
        </div>
        <span className={`text-xs rounded-full px-2 py-0.5 whitespace-nowrap ${v?.verified_at ? TONE_CLASSES.good : TONE_CLASSES.flat}`}>
          {v?.verified_at ? "Verified" : "Not verified"}
        </span>
      </div>
      <button onClick={() => setOpen(!open)} className="text-xs text-accent hover:underline mt-2">
        {open ? "Hide" : v ? "Edit verification" : "Verify employment"}
      </button>
      {open && (
        <form key={v?.verified_at ?? "new"} action={onSave} className="flex flex-col gap-2 mt-3">
          <input type="hidden" name="employment_history_id" value={employment.id} />
          {v && <input type="hidden" name="verification_id" value={v.id} />}
          <div className="grid grid-cols-2 gap-2">
            <input name="method" defaultValue={v?.method ?? ""} placeholder="Method (call, paystub…)" className={fieldCls} />
            <input name="source_person" defaultValue={v?.source_person ?? ""} placeholder="Source / person contacted" className={fieldCls} />
          </div>
          <label className="flex items-center gap-2 text-xs text-ink">
            <input type="checkbox" name="verified" defaultChecked={v?.verified} className="rounded border-line" />
            Employer verified
          </label>
          <label className="flex items-center gap-2 text-xs text-ink">
            <input type="checkbox" name="dates_confirmed" defaultChecked={v?.dates_confirmed} className="rounded border-line" />
            Employment dates confirmed
          </label>
          <label className="flex items-center gap-2 text-xs text-ink">
            <input type="checkbox" name="income_verified" defaultChecked={v?.income_verified} className="rounded border-line" />
            Income verified
          </label>
          <label className="flex items-center gap-2 text-xs text-ink">
            <input type="checkbox" name="bank_income_verification_completed" defaultChecked={v?.bank_income_verification_completed} className="rounded border-line" />
            RentPrep bank-income verification completed
          </label>
          <label className="flex items-center gap-2 text-xs text-ink">
            <input type="checkbox" name="follow_up_required" defaultChecked={v?.follow_up_required} className="rounded border-line" />
            Follow-up required
          </label>
          <textarea name="discrepancies_notes" defaultValue={v?.discrepancies_notes ?? ""} placeholder="Discrepancies" rows={2} className={fieldCls} />
          <textarea name="notes" defaultValue={v?.notes ?? ""} placeholder="Notes" rows={2} className={fieldCls} />
          <button type="submit" className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-ink hover:bg-accent-strong self-start">
            Save verification
          </button>
        </form>
      )}
    </div>
  );
}

function ReferenceCheckCard({ reference, onSave }: { reference: Row; onSave: (fd: FormData) => Promise<void> }) {
  const c = reference.reference_checks?.[0];
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded border border-line p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink">
            {reference.name} <span className="text-xs text-ink-soft">({reference.reference_type ?? reference.relationship ?? "reference"})</span>
          </p>
          <p className="text-xs text-ink-soft">
            {reference.phone ?? "—"} · {reference.email ?? "—"}
          </p>
        </div>
        <span className={`text-xs rounded-full px-2 py-0.5 whitespace-nowrap ${c?.contact_attempted ? TONE_CLASSES.good : TONE_CLASSES.flat}`}>
          {c?.contact_attempted ? "Contacted" : "Not contacted"}
        </span>
      </div>
      <button onClick={() => setOpen(!open)} className="text-xs text-accent hover:underline mt-2">
        {open ? "Hide" : c ? "Edit" : "Log contact"}
      </button>
      {open && (
        <form key={c?.verified_at ?? "new"} action={onSave} className="flex flex-col gap-2 mt-3">
          <input type="hidden" name="applicant_reference_id" value={reference.id} />
          {c && <input type="hidden" name="check_id" value={c.id} />}
          <input name="outcome" defaultValue={c?.outcome ?? ""} placeholder="Outcome" className={fieldCls} />
          <textarea name="notes" defaultValue={c?.notes ?? ""} placeholder="Notes" rows={2} className={fieldCls} />
          <button type="submit" className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-ink hover:bg-accent-strong self-start">
            Save
          </button>
        </form>
      )}
    </div>
  );
}

const DISCREPANCY_CATEGORIES = [
  "address_not_disclosed",
  "employment_dates_inconsistent",
  "income_discrepancy",
  "landlord_identity_unverified",
  "rental_dates_inconsistent",
  "material_information_omitted",
  "other",
];

const DISCREPANCY_STATUSES = ["open", "clarification_requested", "explanation_received", "verified", "resolved", "unresolved"];

const DISCREPANCY_TONE: Record<string, string> = {
  open: "warn",
  clarification_requested: "info",
  explanation_received: "info",
  verified: "good",
  resolved: "good",
  unresolved: "crit",
};

function Discrepancies({
  discrepancies,
  applicantProfiles,
  applicationId,
  onAdd,
  onUpdateStatus,
}: {
  discrepancies: Row[];
  applicantProfiles: Row[];
  applicationId: string | null;
  onAdd: (fd: FormData) => Promise<void>;
  onUpdateStatus: (fd: FormData) => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {discrepancies.length === 0 && <p className="text-sm text-ink-soft">None flagged.</p>}
      {discrepancies.map((d) => (
        <DiscrepancyCard key={d.id} discrepancy={d} onUpdateStatus={onUpdateStatus} />
      ))}
      {applicationId && (
        <Card>
          <h3 className="text-sm font-semibold text-ink mb-3">Flag a discrepancy</h3>
          <p className="text-xs text-ink-soft mb-3">
            A discrepancy isn&apos;t automatically proof someone lied — it&apos;s a flag to follow up on.
          </p>
          <form action={onAdd} className="flex flex-col gap-3">
            <input type="hidden" name="application_id" value={applicationId} />
            <select name="person_id" className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent">
              <option value="">Household-wide</option>
              {applicantProfiles.map((ap) => (
                <option key={ap.person_id} value={ap.person_id}>
                  {ap.people?.first_name} {ap.people?.last_name}
                </option>
              ))}
            </select>
            <select name="category" required className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent">
              {DISCREPANCY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <textarea
              name="description"
              required
              placeholder="What was found and how"
              rows={3}
              className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button type="submit" className="rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:bg-accent-strong self-start">
              Flag it
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}

function DiscrepancyCard({ discrepancy, onUpdateStatus }: { discrepancy: Row; onUpdateStatus: (fd: FormData) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink capitalize">{discrepancy.category.replace(/_/g, " ")}</span>
        <span className={`text-xs rounded-full px-2 py-0.5 capitalize ${TONE_CLASSES[DISCREPANCY_TONE[discrepancy.status] ?? "flat"]}`}>
          {discrepancy.status.replace(/_/g, " ")}
        </span>
      </div>
      {discrepancy.people && (
        <p className="text-xs text-ink-soft mt-0.5">
          {discrepancy.people.first_name} {discrepancy.people.last_name}
        </p>
      )}
      <p className="text-sm text-ink mt-2">{discrepancy.description}</p>
      {discrepancy.applicant_explanation && (
        <p className="text-xs text-ink-soft mt-2">
          <span className="font-medium text-ink">Explanation:</span> {discrepancy.applicant_explanation}
        </p>
      )}
      {discrepancy.resolution_notes && (
        <p className="text-xs text-ink-soft mt-1">
          <span className="font-medium text-ink">Resolution:</span> {discrepancy.resolution_notes}
        </p>
      )}
      {!editing ? (
        <button onClick={() => setEditing(true)} className="text-xs text-accent hover:underline mt-3">
          Update
        </button>
      ) : (
        <form action={onUpdateStatus} className="flex flex-col gap-2 mt-3">
          <input type="hidden" name="discrepancy_id" value={discrepancy.id} />
          <select
            key={discrepancy.status}
            name="status"
            defaultValue={discrepancy.status}
            className="rounded border border-line bg-surface px-2 py-1 text-xs outline-none focus:border-accent"
          >
            {DISCREPANCY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <textarea name="applicant_explanation" placeholder="Applicant's explanation (if given)" rows={2} className={fieldCls} />
          <textarea name="resolution_notes" placeholder="Resolution notes" rows={2} className={fieldCls} />
          <button type="submit" className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-ink hover:bg-accent-strong self-start">
            Save
          </button>
        </form>
      )}
    </Card>
  );
}

const DECISION_FACTORS = [
  ["ability_to_meet_rent", "Ability to meet monthly rent"],
  ["ability_to_provide_move_in_funds", "Ability to provide required funds before possession"],
  ["verified_income", "Verified income / resources"],
  ["rental_payment_history", "Rental / payment history"],
  ["credit_information", "Credit information"],
  ["eviction_history", "Relevant eviction history"],
  ["application_completeness", "Completeness / accuracy of application"],
  ["landlord_verification", "Landlord verification"],
  ["employment_verification", "Employment verification"],
  ["references", "References"],
  ["material_discrepancies", "Material discrepancies and explanations"],
] as const;

function Decision({
  decisions,
  onRecord,
  onRecordNotice,
}: {
  decisions: Row[];
  onRecord: (fd: FormData) => Promise<void>;
  onRecordNotice: (fd: FormData) => Promise<void>;
}) {
  const latest = decisions[0];
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {latest && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-ink capitalize">{latest.outcome}</span>
            <span className="text-xs text-ink-soft tabular">{new Date(latest.decided_at).toLocaleDateString()}</span>
          </div>
          <p className="text-sm text-ink whitespace-pre-wrap">{latest.reasoning_notes}</p>
          {Object.keys(latest.factors ?? {}).length > 0 && (
            <dl className="mt-3 flex flex-col gap-1">
              {Object.entries(latest.factors as Record<string, string>).map(([k, v]) => (
                <div key={k} className="text-xs">
                  <dt className="text-ink-soft inline">{DECISION_FACTORS.find(([key]) => key === k)?.[1] ?? k}: </dt>
                  <dd className="inline text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {latest.adverse_action_report_used && (
            <div className="mt-3 rounded border border-warn/30 bg-warn-bg px-3 py-2 text-xs text-warn flex flex-col gap-2">
              <span>Screening report was used — FCRA adverse action notices required. Confirm exact language/timing with counsel.</span>
              <div className="flex gap-4">
                {latest.pre_adverse_notice_sent_at ? (
                  <span>Pre-adverse sent {new Date(latest.pre_adverse_notice_sent_at).toLocaleDateString()}</span>
                ) : (
                  <form action={onRecordNotice}>
                    <input type="hidden" name="decision_id" value={latest.id} />
                    <input type="hidden" name="notice_field" value="pre_adverse_notice_sent_at" />
                    <button type="submit" className="underline hover:no-underline">
                      Mark pre-adverse notice sent
                    </button>
                  </form>
                )}
                {latest.adverse_notice_sent_at ? (
                  <span>Adverse sent {new Date(latest.adverse_notice_sent_at).toLocaleDateString()}</span>
                ) : (
                  <form action={onRecordNotice}>
                    <input type="hidden" name="decision_id" value={latest.id} />
                    <input type="hidden" name="notice_field" value="adverse_notice_sent_at" />
                    <button type="submit" className="underline hover:no-underline">
                      Mark adverse notice sent
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-1">{latest ? "Record a new decision" : "Record decision"}</h3>
        <p className="text-xs text-ink-soft mb-3">
          Holistic and documented — never based on credit score alone, never on protected characteristics.
        </p>
        <form action={onRecord} className="flex flex-col gap-3">
          <select name="outcome" required className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent">
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
          <select name="decision_type" className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent">
            <option value="">— If approved: agreement type —</option>
            <option value="traditional_lease">Traditional lease</option>
            <option value="lease_option">Lease with option to purchase</option>
          </select>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-ink-soft">Factors considered</span>
            {DECISION_FACTORS.map(([key, label]) => (
              <div key={key} className="grid grid-cols-[1fr_2fr] gap-2 items-start">
                <label className="text-xs text-ink pt-2">{label}</label>
                <input name={`factor_${key}`} placeholder="Notes (optional)" className="rounded border border-line bg-surface px-2 py-1.5 text-xs outline-none focus:border-accent" />
              </div>
            ))}
          </div>
          <textarea
            name="reasoning_notes"
            required
            placeholder="Overall reasoning — why this decision"
            rows={4}
            className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="adverse_action_report_used" className="rounded border-line" />
            A screening/consumer report factored into this decision
          </label>
          <button type="submit" className="rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:bg-accent-strong self-start">
            Record decision
          </button>
        </form>
      </Card>
    </div>
  );
}

const DOCUMENT_CATEGORIES = [
  "application",
  "applicant_upload",
  "verification",
  "screening",
  "lease",
  "lease_option",
  "addendum",
  "notice",
  "payment",
  "maintenance",
  "photo",
  "correspondence",
  "other",
];

function Documents({
  documents,
  onUpload,
  onGetDownloadUrl,
}: {
  documents: Row[];
  onUpload: (fd: FormData) => Promise<void>;
  onGetDownloadUrl: (path: string) => Promise<string | null>;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(fd: FormData) {
    setUploading(true);
    try {
      await onUpload(fd);
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(path: string) {
    const url = await onGetDownloadUrl(path);
    if (url) window.open(url, "_blank");
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="rounded border border-line bg-surface divide-y divide-line">
        {documents.length === 0 && <p className="p-4 text-sm text-ink-soft">Nothing uploaded yet.</p>}
        {documents.map((d) => (
          <div key={d.id} className="p-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-ink capitalize">{d.category.replace(/_/g, " ")}</p>
              <p className="text-xs text-ink-soft tabular">{new Date(d.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-3">
              {d.is_sensitive && <span className="text-xs rounded-full px-2 py-0.5 bg-warn-bg text-warn">Sensitive</span>}
              <button onClick={() => handleDownload(d.storage_path)} className="text-xs text-accent hover:underline">
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Upload a document</h3>
        <form action={handleUpload} className="flex flex-col gap-3">
          <select name="category" required className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent">
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="is_sensitive" className="rounded border-line" />
            Sensitive — restrict to owner/staff only
          </label>
          <input
            type="file"
            name="file"
            required
            className="text-sm text-ink-soft file:mr-3 file:rounded file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-ink"
          />
          <button
            type="submit"
            disabled={uploading}
            className="rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:bg-accent-strong disabled:opacity-60 self-start"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>
      </Card>
    </div>
  );
}

function Notices({ notices, onAdd }: { notices: Row[]; onAdd: (fd: FormData) => Promise<void> }) {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="rounded border border-line bg-surface divide-y divide-line">
        {notices.length === 0 && <p className="p-4 text-sm text-ink-soft">None sent.</p>}
        {notices.map((n) => (
          <div key={n.id} className="p-3 flex items-center justify-between">
            <span className="text-sm text-ink">{n.notice_type}</span>
            <span className="text-xs text-ink-soft tabular">{new Date(n.sent_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Log a notice</h3>
        <form action={onAdd} className="flex flex-col gap-3">
          <input
            name="notice_type"
            required
            placeholder="Notice type (late rent, entry notice, lease violation…)"
            className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button type="submit" className="rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:bg-accent-strong self-start">
            Log notice
          </button>
        </form>
      </Card>
    </div>
  );
}

const MAINTENANCE_TONE: Record<string, string> = { open: "warn", resolved: "good" };

function Maintenance({
  requests,
  onAdd,
  onResolve,
}: {
  requests: Row[];
  onAdd: (fd: FormData) => Promise<void>;
  onResolve: (id: string) => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="rounded border border-line bg-surface divide-y divide-line">
        {requests.length === 0 && <p className="p-4 text-sm text-ink-soft">Nothing reported.</p>}
        {requests.map((r) => (
          <div key={r.id} className="p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-ink">{r.description}</p>
              <p className="text-xs text-ink-soft tabular">Reported {new Date(r.reported_at).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs rounded-full px-2 py-0.5 capitalize ${TONE_CLASSES[MAINTENANCE_TONE[r.status] ?? "flat"]}`}>
                {r.status}
              </span>
              {r.status !== "resolved" && (
                <form action={async () => onResolve(r.id)}>
                  <button className="text-xs text-accent hover:underline">Resolve</button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3">Report an issue</h3>
        <form action={onAdd} className="flex flex-col gap-3">
          <textarea
            name="description"
            required
            rows={3}
            placeholder="What's wrong and where"
            className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button type="submit" className="rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:bg-accent-strong self-start">
            Report
          </button>
        </form>
      </Card>
    </div>
  );
}
