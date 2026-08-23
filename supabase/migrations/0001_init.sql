-- Household Ledger — initial schema
-- Single source of truth: one household record from lead through tenancy.
-- See project architecture doc for full rationale.

create extension if not exists pgcrypto;

-- =========================================================================
-- ENUMS
-- =========================================================================

create type staff_role as enum ('owner', 'staff', 'readonly');

create type property_status as enum ('available', 'occupied', 'off_market');

create type pipeline_stage as enum (
  'new_lead', 'contacted', 'showing_scheduled', 'showed', 'interested',
  'application_sent', 'application_started', 'application_submitted',
  'payment_received', 'screening', 'verification', 'under_review',
  'approved', 'denied', 'withdrawn',
  'lease_sent', 'lease_signed', 'tenant'
);

create type rental_type as enum ('traditional', 'lease_option', 'undecided');

create type application_status as enum (
  'not_sent', 'sent', 'in_progress', 'submitted', 'paid', 'reopened'
);

create type applicant_status as enum ('not_started', 'in_progress', 'submitted');

create type payment_type as enum (
  'application_fee', 'security_deposit', 'first_month_rent',
  'monthly_rent', 'option_consideration', 'late_fee', 'refund', 'other'
);

create type payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');

create type screening_status as enum (
  'not_started', 'requested', 'pending', 'completed', 'could_not_complete'
);

create type tri_state as enum ('yes', 'no', 'unknown');

create type discrepancy_category as enum (
  'address_not_disclosed', 'employment_dates_inconsistent', 'income_discrepancy',
  'landlord_identity_unverified', 'rental_dates_inconsistent',
  'material_information_omitted', 'other'
);

create type discrepancy_status as enum (
  'open', 'clarification_requested', 'explanation_received',
  'verified', 'resolved', 'unresolved'
);

create type decision_outcome as enum ('approved', 'denied', 'withdrawn');

create type agreement_type as enum ('traditional_lease', 'lease_option');

create type agreement_status as enum (
  'draft', 'generated', 'sent', 'partially_signed', 'completed', 'declined'
);

create type communication_type as enum ('phone', 'text', 'email', 'in_person', 'internal_note', 'system');

create type communication_direction as enum ('incoming', 'outgoing', 'internal');

create type document_category as enum (
  'application', 'applicant_upload', 'verification', 'screening',
  'lease', 'lease_option', 'addendum', 'notice', 'payment', 'maintenance',
  'photo', 'correspondence', 'other'
);

create type task_status as enum ('open', 'in_progress', 'done', 'cancelled');

create type webhook_provider as enum ('square', 'dropbox_sign');

-- =========================================================================
-- STAFF
-- =========================================================================

create table staff_users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role staff_role not null default 'staff',
  created_at timestamptz not null default now()
);

create table properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  monthly_rent numeric(10,2) not null,
  security_deposit numeric(10,2) not null,
  is_furnished boolean not null default false,
  pet_deposit_allowed boolean not null default false,
  application_fee_per_adult numeric(10,2) not null default 85.00,
  status property_status not null default 'available',
  jurisdiction_notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table property_staff (
  property_id uuid not null references properties(id) on delete cascade,
  staff_user_id uuid not null references staff_users(id) on delete cascade,
  primary key (property_id, staff_user_id)
);

-- =========================================================================
-- HOUSEHOLDS & PEOPLE
-- =========================================================================

create table households (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id),
  pipeline_stage pipeline_stage not null default 'new_lead',
  rental_type_interest rental_type not null default 'undecided',
  lead_source text,
  desired_move_in date,
  assigned_staff_id uuid references staff_users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table people (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  dob date,
  is_adult boolean not null default true,
  relationship_role text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table pets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text,
  species text,
  breed text,
  weight_lbs numeric(6,2),
  created_at timestamptz not null default now()
);

-- =========================================================================
-- APPLICATION
-- =========================================================================

create table applications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  property_id uuid not null references properties(id),
  access_token uuid not null default gen_random_uuid() unique,
  status application_status not null default 'not_sent',
  sent_at timestamptz,
  started_at timestamptz,
  submitted_at timestamptz,
  fee_total numeric(10,2),
  disclosures_acknowledged_at timestamptz,
  token_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table applicant_profiles (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  current_address text,
  status applicant_status not null default 'not_started',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (application_id, person_id)
);

create table application_snapshots (
  id uuid primary key default gen_random_uuid(),
  applicant_profile_id uuid not null references applicant_profiles(id) on delete cascade,
  version integer not null,
  payload jsonb not null,
  captured_at timestamptz not null default now(),
  captured_reason text,
  unique (applicant_profile_id, version)
);

create table residence_history (
  id uuid primary key default gen_random_uuid(),
  applicant_profile_id uuid not null references applicant_profiles(id) on delete cascade,
  sequence integer not null default 0,
  address text not null,
  move_in_date date,
  move_out_date date,
  rent_amount numeric(10,2),
  landlord_name text,
  landlord_phone text,
  landlord_email text,
  reason_for_leaving text,
  was_on_lease boolean,
  created_at timestamptz not null default now()
);

create table employment_history (
  id uuid primary key default gen_random_uuid(),
  applicant_profile_id uuid not null references applicant_profiles(id) on delete cascade,
  employer_name text not null,
  position text,
  employer_phone text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  income_amount numeric(10,2),
  income_frequency text,
  created_at timestamptz not null default now()
);

create table income_sources (
  id uuid primary key default gen_random_uuid(),
  applicant_profile_id uuid not null references applicant_profiles(id) on delete cascade,
  source_type text not null,
  amount numeric(10,2),
  frequency text,
  notes text,
  created_at timestamptz not null default now()
);

create table applicant_references (
  id uuid primary key default gen_random_uuid(),
  applicant_profile_id uuid not null references applicant_profiles(id) on delete cascade,
  name text not null,
  relationship text,
  reference_type text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table consents (
  id uuid primary key default gen_random_uuid(),
  applicant_profile_id uuid not null references applicant_profiles(id) on delete cascade,
  consent_type text not null,
  accepted_at timestamptz not null default now(),
  ip_address text
);

-- =========================================================================
-- PAYMENTS (Square is the source of truth; this is our index)
-- =========================================================================

create table payments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  application_id uuid references applications(id),
  payment_type payment_type not null,
  square_customer_id text,
  square_invoice_id text,
  square_payment_id text,
  amount numeric(10,2) not null,
  status payment_status not null default 'pending',
  paid_at timestamptz,
  refund_amount numeric(10,2),
  square_hosted_url text,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- SCREENING & VERIFICATION
-- =========================================================================

create table screenings (
  id uuid primary key default gen_random_uuid(),
  applicant_profile_id uuid not null references applicant_profiles(id) on delete cascade,
  provider text not null default 'rentprep',
  screening_type text not null,
  status screening_status not null default 'not_started',
  requested_at timestamptz,
  requested_by uuid references staff_users(id),
  completed_at timestamptz,
  outcome_summary text,
  created_at timestamptz not null default now()
);

create table landlord_verifications (
  id uuid primary key default gen_random_uuid(),
  residence_history_id uuid not null references residence_history(id) on delete cascade,
  contact_attempted_at timestamptz,
  phone_used text,
  email_used text,
  independently_verified boolean,
  person_spoken_to text,
  relationship_to_property text,
  tenancy_dates_confirmed boolean,
  rent_payment_history_notes text,
  lease_violations_notes text,
  property_condition_notes text,
  notice_given_notes text,
  would_rent_again tri_state default 'unknown',
  notes text,
  verified_by uuid references staff_users(id),
  verified_at timestamptz
);

create table employment_verifications (
  id uuid primary key default gen_random_uuid(),
  employment_history_id uuid not null references employment_history(id) on delete cascade,
  verified boolean,
  method text,
  source_person text,
  dates_confirmed boolean,
  income_verified boolean,
  bank_income_verification_completed boolean not null default false,
  discrepancies_notes text,
  follow_up_required boolean not null default false,
  notes text,
  verified_by uuid references staff_users(id),
  verified_at timestamptz
);

create table reference_checks (
  id uuid primary key default gen_random_uuid(),
  applicant_reference_id uuid not null references applicant_references(id) on delete cascade,
  contact_attempted boolean not null default false,
  attempted_at timestamptz,
  outcome text,
  notes text,
  verified_by uuid references staff_users(id),
  verified_at timestamptz
);

create table discrepancies (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  person_id uuid references people(id),
  category discrepancy_category not null,
  description text not null,
  status discrepancy_status not null default 'open',
  applicant_explanation text,
  resolution_notes text,
  opened_by uuid references staff_users(id),
  opened_at timestamptz not null default now(),
  resolved_by uuid references staff_users(id),
  resolved_at timestamptz
);

create table decisions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  outcome decision_outcome not null,
  decision_type agreement_type,
  reasoning_notes text not null,
  factors jsonb not null default '{}'::jsonb,
  adverse_action_report_used boolean not null default false,
  pre_adverse_notice_sent_at timestamptz,
  adverse_notice_sent_at timestamptz,
  decided_by uuid references staff_users(id),
  decided_at timestamptz not null default now()
);

-- =========================================================================
-- AGREEMENTS, DOCUMENTS, COMMUNICATIONS, TASKS, NOTICES, MAINTENANCE
-- =========================================================================

create table agreements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  agreement_type agreement_type not null,
  dropbox_sign_request_id text,
  template_used text,
  status agreement_status not null default 'draft',
  signers jsonb not null default '[]'::jsonb,
  sent_at timestamptz,
  completed_at timestamptz,
  executed_document_path text,
  dropbox_sign_hosted_url text,
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category document_category not null,
  storage_path text not null,
  is_sensitive boolean not null default false,
  uploaded_by uuid references staff_users(id),
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz not null default now()
);

create table communications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  person_id uuid references people(id),
  type communication_type not null,
  direction communication_direction not null,
  subject text,
  content text,
  occurred_at timestamptz not null default now(),
  staff_user_id uuid references staff_users(id),
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  type text not null,
  description text not null,
  due_date date,
  assigned_to uuid references staff_users(id),
  status task_status not null default 'open',
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz not null default now()
);

create table notices (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  notice_type text not null,
  sent_at timestamptz not null default now(),
  document_ref uuid references documents(id)
);

create table maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id),
  household_id uuid references households(id),
  description text not null,
  status text not null default 'open',
  reported_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- =========================================================================
-- SYSTEM: ACTIVITY LOG & WEBHOOK EVENTS (append-only)
-- =========================================================================

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  event_type text not null,
  description text not null,
  actor_id uuid references staff_users(id),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider webhook_provider not null,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_status text not null default 'received',
  related_entity_type text,
  related_entity_id uuid
);

-- =========================================================================
-- INDEXES
-- =========================================================================

create index idx_households_property on households(property_id);
create index idx_households_stage on households(pipeline_stage);
create index idx_people_household on people(household_id);
create index idx_applications_household on applications(household_id);
create index idx_applicant_profiles_application on applicant_profiles(application_id);
create index idx_payments_household on payments(household_id);
create index idx_screenings_applicant on screenings(applicant_profile_id);
create index idx_discrepancies_application on discrepancies(application_id);
create index idx_activity_log_household on activity_log(household_id, occurred_at desc);
create index idx_communications_household on communications(household_id, occurred_at desc);
create index idx_documents_household on documents(household_id);
create index idx_tasks_status on tasks(status, due_date);

-- =========================================================================
-- updated_at trigger for households
-- =========================================================================

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_households_updated_at
  before update on households
  for each row execute function set_updated_at();
