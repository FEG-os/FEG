"use client";

import { useState } from "react";

type Residence = {
  address: string;
  moveIn: string;
  moveOut: string;
  rentAmount: string;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
  reasonForLeaving: string;
  wasOnLease: boolean;
};

type Employment = {
  employerName: string;
  position: string;
  employerPhone: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  incomeAmount: string;
  incomeFrequency: string;
};

type IncomeSource = { sourceType: string; amount: string; frequency: string; notes: string };

type Reference = { name: string; relationship: string; referenceType: string; phone: string; email: string };

const emptyResidence: Residence = {
  address: "",
  moveIn: "",
  moveOut: "",
  rentAmount: "",
  landlordName: "",
  landlordPhone: "",
  landlordEmail: "",
  reasonForLeaving: "",
  wasOnLease: true,
};

const emptyEmployment: Employment = {
  employerName: "",
  position: "",
  employerPhone: "",
  startDate: "",
  endDate: "",
  isCurrent: true,
  incomeAmount: "",
  incomeFrequency: "monthly",
};

const emptyReference: Reference = { name: "", relationship: "", referenceType: "personal", phone: "", email: "" };

export default function QuestionnaireForm({
  currentAddress: initialAddress,
  residences: initialResidences,
  employment: initialEmployment,
  incomeSources: initialIncome,
  references: initialReferences,
  alreadySubmitted,
  onSubmit,
}: {
  currentAddress: string;
  residences: Residence[];
  employment: Employment[];
  incomeSources: IncomeSource[];
  references: Reference[];
  alreadySubmitted: boolean;
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  const [currentAddress, setCurrentAddress] = useState(initialAddress);
  const [residences, setResidences] = useState<Residence[]>(initialResidences.length ? initialResidences : [emptyResidence]);
  const [employment, setEmployment] = useState<Employment[]>(initialEmployment.length ? initialEmployment : [emptyEmployment]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(initialIncome);
  const [references, setReferences] = useState<Reference[]>(
    initialReferences.length ? initialReferences : [emptyReference, emptyReference]
  );
  const [authorize, setAuthorize] = useState(alreadySubmitted);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData();
    fd.set(
      "payload",
      JSON.stringify({
        currentAddress,
        residences,
        employment,
        incomeSources,
        references,
        authorizeVerification: authorize,
      })
    );
    try {
      await onSubmit(fd);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {alreadySubmitted && (
        <div className="rounded border border-info/30 bg-info-bg px-3 py-2 text-sm text-info">
          Already submitted. Changing anything below and resubmitting is recorded as a correction — your original
          answers stay on file.
        </div>
      )}

      <Section title="Current address">
        <input
          value={currentAddress}
          onChange={(e) => setCurrentAddress(e.target.value)}
          placeholder="Street, city, state, ZIP"
          required
          className="w-full rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </Section>

      <Section title="Residence history" hint="Cover about the last 5 years.">
        {residences.map((r, i) => (
          <RowCard key={i} onRemove={residences.length > 1 ? () => setResidences(residences.filter((_, j) => j !== i)) : undefined}>
            <input
              value={r.address}
              onChange={(e) => updateAt(setResidences, i, { address: e.target.value })}
              placeholder="Address"
              required
              className="col-span-2 rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <LabeledInput label="Move in" type="date" value={r.moveIn} onChange={(v) => updateAt(setResidences, i, { moveIn: v })} />
            <LabeledInput label="Move out" type="date" value={r.moveOut} onChange={(v) => updateAt(setResidences, i, { moveOut: v })} />
            <LabeledInput label="Monthly rent" type="number" value={r.rentAmount} onChange={(v) => updateAt(setResidences, i, { rentAmount: v })} />
            <label className="flex items-center gap-2 text-sm text-ink self-end pb-2">
              <input type="checkbox" checked={r.wasOnLease} onChange={(e) => updateAt(setResidences, i, { wasOnLease: e.target.checked })} className="rounded border-line" />
              On the lease
            </label>
            <LabeledInput label="Landlord name" value={r.landlordName} onChange={(v) => updateAt(setResidences, i, { landlordName: v })} />
            <LabeledInput label="Landlord phone" value={r.landlordPhone} onChange={(v) => updateAt(setResidences, i, { landlordPhone: v })} />
            <LabeledInput label="Landlord email" value={r.landlordEmail} onChange={(v) => updateAt(setResidences, i, { landlordEmail: v })} className="col-span-2" />
            <LabeledInput label="Reason for leaving" value={r.reasonForLeaving} onChange={(v) => updateAt(setResidences, i, { reasonForLeaving: v })} className="col-span-2" />
          </RowCard>
        ))}
        <AddButton onClick={() => setResidences([...residences, emptyResidence])}>+ Add another address</AddButton>
      </Section>

      <Section title="Employment">
        {employment.map((e, i) => (
          <RowCard key={i} onRemove={employment.length > 1 ? () => setEmployment(employment.filter((_, j) => j !== i)) : undefined}>
            <LabeledInput label="Employer" value={e.employerName} onChange={(v) => updateAt(setEmployment, i, { employerName: v })} required />
            <LabeledInput label="Position" value={e.position} onChange={(v) => updateAt(setEmployment, i, { position: v })} />
            <LabeledInput label="Employer phone" value={e.employerPhone} onChange={(v) => updateAt(setEmployment, i, { employerPhone: v })} />
            <label className="flex items-center gap-2 text-sm text-ink self-end pb-2">
              <input type="checkbox" checked={e.isCurrent} onChange={(ev) => updateAt(setEmployment, i, { isCurrent: ev.target.checked })} className="rounded border-line" />
              Current job
            </label>
            <LabeledInput label="Start date" type="date" value={e.startDate} onChange={(v) => updateAt(setEmployment, i, { startDate: v })} />
            <LabeledInput label="End date" type="date" value={e.endDate} onChange={(v) => updateAt(setEmployment, i, { endDate: v })} />
            <LabeledInput label="Gross income" type="number" value={e.incomeAmount} onChange={(v) => updateAt(setEmployment, i, { incomeAmount: v })} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink-soft">Frequency</label>
              <select
                value={e.incomeFrequency}
                onChange={(ev) => updateAt(setEmployment, i, { incomeFrequency: ev.target.value })}
                className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
              >
                <option value="hourly">Hourly</option>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </RowCard>
        ))}
        <AddButton onClick={() => setEmployment([...employment, emptyEmployment])}>+ Add another employer</AddButton>
      </Section>

      <Section title="Other income" hint="Optional — anything else you'd like considered.">
        {incomeSources.map((s, i) => (
          <RowCard key={i} onRemove={() => setIncomeSources(incomeSources.filter((_, j) => j !== i))}>
            <LabeledInput label="Source" value={s.sourceType} onChange={(v) => updateAt(setIncomeSources, i, { sourceType: v })} />
            <LabeledInput label="Amount" type="number" value={s.amount} onChange={(v) => updateAt(setIncomeSources, i, { amount: v })} />
            <LabeledInput label="Frequency" value={s.frequency} onChange={(v) => updateAt(setIncomeSources, i, { frequency: v })} />
            <LabeledInput label="Notes" value={s.notes} onChange={(v) => updateAt(setIncomeSources, i, { notes: v })} className="col-span-2" />
          </RowCard>
        ))}
        <AddButton onClick={() => setIncomeSources([...incomeSources, { sourceType: "", amount: "", frequency: "", notes: "" }])}>
          + Add income source
        </AddButton>
      </Section>

      <Section title="References">
        {references.map((r, i) => (
          <RowCard key={i} onRemove={references.length > 1 ? () => setReferences(references.filter((_, j) => j !== i)) : undefined}>
            <LabeledInput label="Name" value={r.name} onChange={(v) => updateAt(setReferences, i, { name: v })} required />
            <LabeledInput label="Relationship" value={r.relationship} onChange={(v) => updateAt(setReferences, i, { relationship: v })} />
            <LabeledInput label="Phone" value={r.phone} onChange={(v) => updateAt(setReferences, i, { phone: v })} />
            <LabeledInput label="Email" value={r.email} onChange={(v) => updateAt(setReferences, i, { email: v })} />
          </RowCard>
        ))}
        <AddButton onClick={() => setReferences([...references, emptyReference])}>+ Add reference</AddButton>
      </Section>

      <Section title="Authorization">
        <label className="flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={authorize}
            onChange={(e) => setAuthorize(e.target.checked)}
            required
            className="mt-0.5 rounded border-line"
          />
          I authorize the landlord/property manager to independently verify the residence, employment, and reference
          information above, and to obtain a lawful tenant screening report.
        </label>
      </Section>

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink hover:opacity-90 disabled:opacity-60 self-start"
      >
        {submitting ? "Submitting…" : alreadySubmitted ? "Save correction" : "Submit"}
      </button>
    </form>
  );
}

function updateAt<T>(setter: (fn: (prev: T[]) => T[]) => void, index: number, patch: Partial<T>) {
  setter((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {hint && <p className="text-xs text-ink-soft mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function RowCard({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <div className="relative rounded border border-line bg-surface p-3 grid grid-cols-2 gap-3">
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 text-xs text-ink-soft hover:text-crit"
        >
          Remove
        </button>
      )}
    </div>
  );
}

function AddButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-sm text-accent hover:underline self-start">
      {children}
    </button>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  required,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label className="text-xs font-medium text-ink-soft">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
    </div>
  );
}
