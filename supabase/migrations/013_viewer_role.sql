-- ─────────────────────────────────────────
-- Viewer role: read-only access to the app
-- Members can comment, edit plots, upload files
-- Viewers can only see data — no writes
-- ─────────────────────────────────────────

-- Expand the role constraint to include viewer
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('admin', 'member', 'viewer'));

-- ── Plots: viewers cannot mutate ──────────
drop policy if exists "plots_update" on plots;
create policy "plots_update" on plots
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'member'))
  );

-- ── Calculator snapshots: viewers cannot write ──
drop policy if exists "calc_write" on calculator_snapshots;
create policy "calc_write" on calculator_snapshots
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'member'))
  );

-- ── Scoring inputs: viewers cannot write ──
drop policy if exists "scoring_write" on scoring_inputs;
create policy "scoring_write" on scoring_inputs
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'member'))
  );

-- ── Comments: viewers cannot post ─────────
drop policy if exists "plot_comments_insert" on plot_comments;
create policy "plot_comments_insert" on plot_comments
  for insert to authenticated with check (
    created_by = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'member'))
  );

drop policy if exists "plot_comments_delete" on plot_comments;
create policy "plot_comments_delete" on plot_comments
  for delete to authenticated using (
    created_by = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'member'))
  );

-- ── File attachments: viewers cannot upload or delete ──
drop policy if exists "plot_files_insert" on plot_files;
create policy "plot_files_insert" on plot_files
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'member'))
  );

drop policy if exists "plot_files_delete" on plot_files;
create policy "plot_files_delete" on plot_files
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'member'))
  );

-- ── Storage: viewers cannot upload or delete files ──
drop policy if exists "plot_files_storage_insert" on storage.objects;
create policy "plot_files_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'Plot Files'
    and exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'member'))
  );

drop policy if exists "plot_files_storage_delete" on storage.objects;
create policy "plot_files_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'Plot Files'
    and exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'member'))
  );

-- ── Label definitions: viewers cannot create labels ──
drop policy if exists "label_definitions_write" on label_definitions;
create policy "label_definitions_write" on label_definitions
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'member'))
  );

-- ── Kanban: viewers cannot move/reorder ──
-- (stages write is already admin-only; plot positions update is handled by action-level guards)
