-- Row Level Security
--
-- Access model:
--   * Internal tools (staff_users) authenticate via Supabase Auth. Role is
--     'owner', 'staff', or 'readonly'. Owner/staff can read and write
--     everything below except append-only logs. Readonly can read
--     ordinary CRM data but is locked out of sensitive tables entirely.
--   * The applicant-facing application flow never talks to Supabase
--     directly. It goes through server-side API routes using the service
--     role key, which bypasses RLS. So application/screening/verification
--     tables have NO anon/authenticated-insert policies at all — only
--     staff read/write policies exist; the service role writes regardless.
--   * activity_log and webhook_events are append-only / service-role-only.
--     No UPDATE or DELETE policy exists for them, on purpose.

-- ---------------------------------------------------------------------
-- Helper functions (security definer so they can read staff_users
-- without recursing through RLS on that table)
-- ---------------------------------------------------------------------

create or replace function current_staff_role() returns staff_role
language sql stable security definer set search_path = public as $$
  select role from staff_users where id = auth.uid();
$$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select current_staff_role() in ('owner', 'staff');
$$;

create or replace function is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select current_staff_role() = 'owner';
$$;

create or replace function is_authenticated_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select current_staff_role() is not null;
$$;

-- ---------------------------------------------------------------------
-- staff_users
-- ---------------------------------------------------------------------

alter table staff_users enable row level security;

create policy staff_users_select_self_or_owner on staff_users
  for select using (id = auth.uid() or is_owner());

create policy staff_users_owner_manages on staff_users
  for all using (is_owner()) with check (is_owner());

-- ---------------------------------------------------------------------
-- properties / property_staff — ordinary CRM tier
-- ---------------------------------------------------------------------

alter table properties enable row level security;
alter table property_staff enable row level security;

create policy properties_read on properties for select using (is_authenticated_staff());
create policy properties_write on properties for all using (is_staff()) with check (is_staff());

create policy property_staff_read on property_staff for select using (is_authenticated_staff());
create policy property_staff_write on property_staff for all using (is_owner()) with check (is_owner());

-- ---------------------------------------------------------------------
-- households / people / pets — ordinary CRM tier
-- ---------------------------------------------------------------------

alter table households enable row level security;
alter table people enable row level security;
alter table pets enable row level security;

create policy households_read on households for select using (is_authenticated_staff());
create policy households_write on households for all using (is_staff()) with check (is_staff());

create policy people_read on people for select using (is_authenticated_staff());
create policy people_write on people for all using (is_staff()) with check (is_staff());

create policy pets_read on pets for select using (is_authenticated_staff());
create policy pets_write on pets for all using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------------
-- Application data — sensitive tier (owner/staff only, no readonly)
-- ---------------------------------------------------------------------

alter table applications enable row level security;
alter table applicant_profiles enable row level security;
alter table application_snapshots enable row level security;
alter table residence_history enable row level security;
alter table employment_history enable row level security;
alter table income_sources enable row level security;
alter table applicant_references enable row level security;
alter table consents enable row level security;

create policy applications_staff_rw on applications for all using (is_staff()) with check (is_staff());
create policy applicant_profiles_staff_rw on applicant_profiles for all using (is_staff()) with check (is_staff());

-- append-only: staff can read and insert new versions, never update/delete
create policy application_snapshots_staff_read on application_snapshots for select using (is_staff());
create policy application_snapshots_staff_insert on application_snapshots for insert with check (is_staff());

create policy residence_history_staff_rw on residence_history for all using (is_staff()) with check (is_staff());
create policy employment_history_staff_rw on employment_history for all using (is_staff()) with check (is_staff());
create policy income_sources_staff_rw on income_sources for all using (is_staff()) with check (is_staff());
create policy applicant_references_staff_rw on applicant_references for all using (is_staff()) with check (is_staff());
create policy consents_staff_read on consents for select using (is_staff());

-- ---------------------------------------------------------------------
-- Payments — sensitive tier
-- ---------------------------------------------------------------------

alter table payments enable row level security;
create policy payments_staff_rw on payments for all using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------------
-- Screening & verification — sensitive tier
-- ---------------------------------------------------------------------

alter table screenings enable row level security;
alter table landlord_verifications enable row level security;
alter table employment_verifications enable row level security;
alter table reference_checks enable row level security;
alter table discrepancies enable row level security;
alter table decisions enable row level security;

create policy screenings_staff_rw on screenings for all using (is_staff()) with check (is_staff());
create policy landlord_verifications_staff_rw on landlord_verifications for all using (is_staff()) with check (is_staff());
create policy employment_verifications_staff_rw on employment_verifications for all using (is_staff()) with check (is_staff());
create policy reference_checks_staff_rw on reference_checks for all using (is_staff()) with check (is_staff());
create policy discrepancies_staff_rw on discrepancies for all using (is_staff()) with check (is_staff());
create policy decisions_staff_rw on decisions for all using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------------
-- Agreements, documents, communications, tasks, notices, maintenance
-- ---------------------------------------------------------------------

alter table agreements enable row level security;
alter table documents enable row level security;
alter table communications enable row level security;
alter table tasks enable row level security;
alter table notices enable row level security;
alter table maintenance_requests enable row level security;

create policy agreements_staff_rw on agreements for all using (is_staff()) with check (is_staff());

-- documents: readonly can see non-sensitive docs only; owner/staff see all
create policy documents_read on documents for select using (
  is_staff() or (current_staff_role() = 'readonly' and is_sensitive = false)
);
create policy documents_write on documents for all using (is_staff()) with check (is_staff());

create policy communications_read on communications for select using (is_authenticated_staff());
create policy communications_write on communications for all using (is_staff()) with check (is_staff());

create policy tasks_read on tasks for select using (is_authenticated_staff());
create policy tasks_write on tasks for all using (is_staff()) with check (is_staff());

create policy notices_staff_rw on notices for all using (is_staff()) with check (is_staff());
create policy maintenance_read on maintenance_requests for select using (is_authenticated_staff());
create policy maintenance_write on maintenance_requests for all using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------------
-- activity_log — append-only, all staff can read + insert, nobody can
-- update or delete (no policy for those actions == denied)
-- ---------------------------------------------------------------------

alter table activity_log enable row level security;
create policy activity_log_read on activity_log for select using (is_authenticated_staff());
create policy activity_log_insert on activity_log for insert with check (is_authenticated_staff());

-- ---------------------------------------------------------------------
-- webhook_events — service role only. RLS enabled, zero policies for
-- anon/authenticated, so every client role is locked out entirely.
-- ---------------------------------------------------------------------

alter table webhook_events enable row level security;
