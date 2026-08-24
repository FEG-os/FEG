-- maintenance_requests.household_id was missing ON DELETE CASCADE, unlike
-- every other household-scoped child table — deleting a household with
-- open maintenance requests failed with a foreign key violation.

alter table maintenance_requests
  drop constraint maintenance_requests_household_id_fkey,
  add constraint maintenance_requests_household_id_fkey
    foreign key (household_id) references households(id) on delete cascade;
