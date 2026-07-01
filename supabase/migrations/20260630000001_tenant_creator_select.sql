-- Allow creators to select their own tenants immediately after insert
-- before tenant_members row is created.
create policy "tenants_select_creator" on public.tenants
  for select to authenticated
  using (created_by = auth.uid());
