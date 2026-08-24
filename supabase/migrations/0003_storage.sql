-- Storage buckets for lease documents (uploaded drafts + executed copies).
-- Staff-only; applicants never write here directly.

insert into storage.buckets (id, name, public)
values ('agreements', 'agreements', false)
on conflict (id) do nothing;

create policy "agreements_bucket_staff_all" on storage.objects
  for all
  using (bucket_id = 'agreements' and is_staff())
  with check (bucket_id = 'agreements' and is_staff());
