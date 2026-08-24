-- Storage for general household documents. Sensitive files live under a
-- {household_id}/sensitive/ path prefix and are hidden from the readonly
-- role; everything else sits under {household_id}/general/.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents_bucket_staff_all" on storage.objects
  for all
  using (bucket_id = 'documents' and is_staff())
  with check (bucket_id = 'documents' and is_staff());

create policy "documents_bucket_readonly_select_nonsensitive" on storage.objects
  for select
  using (
    bucket_id = 'documents'
    and current_staff_role() = 'readonly'
    and position('/sensitive/' in name) = 0
  );
