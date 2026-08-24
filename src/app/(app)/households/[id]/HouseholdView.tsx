"use client";

import { useState } from "react";
import { PIPELINE_STAGES, STAGE_LABELS } from "@/lib/pipeline";

const TABS = [
  "Overview",
  "People",
  "Application",
  "Payments",
  "Communications",
  "Tasks",
  "Activity",
  "Roadmap",
] as const;

type Tab = (typeof TABS)[number];

// Loosely typed — these come from Supabase joins whose shapes aren't worth
// hand-modeling here. Real column names match supabase/migrations/0001_init.sql.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

export default function HouseholdView({
  household,
  people,
  applications,
  payments,
  communications,
  tasks,
  activity,
  actions,
}: {
  household: Row;
  people: Row[];
  applications: Row[];
  payments: Row[];
  communications: Row[];
  tasks: Row[];
  activity: Row[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actions: Record<string, (...args: any[]) => Promise<void>>;
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
      {tab === "Payments" && <Payments payments={payments} action={actions.recordPayment} />}
      {tab === "Communications" && <Communications items={communications} action={actions.addCommunication} />}
      {tab === "Tasks" && <Tasks tasks={tasks} onAdd={actions.addTask} onComplete={actions.completeTask} />}
      {tab === "Activity" && <Activity items={activity} />}
      {tab === "Roadmap" && <Roadmap />}
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

function Roadmap() {
  const items = [
    "Screening — RentPrep request tracking",
    "Verification workspace — landlord/employer/reference checks",
    "Discrepancies",
    "Decision notes",
    "Documents",
    "Lease / lease-option agreements (Dropbox Sign)",
    "Notices",
    "Maintenance",
  ];
  return (
    <Card>
      <p className="text-sm text-ink-soft mb-2">Not built yet — next up after the applicant-facing flow is working end to end.</p>
      <ul className="list-disc pl-5 text-sm text-ink-soft flex flex-col gap-1">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </Card>
  );
}
