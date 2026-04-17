-- ─────────────────────────────────────────
-- Row Level Security for all tables
-- ─────────────────────────────────────────

alter table profiles          enable row level security;
alter table kanban_stages     enable row level security;
alter table plots             enable row level security;
alter table calculator_snapshots enable row level security;
alter table scoring_inputs    enable row level security;

-- ── Profiles ──────────────────────────────
create policy "profiles_select" on profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- ── Kanban stages ─────────────────────────
-- All authenticated users can read stages
create policy "stages_select" on kanban_stages
  for select using (auth.role() = 'authenticated');

-- Only admins can create/update/delete stages
create policy "stages_admin_write" on kanban_stages
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── Plots ─────────────────────────────────
-- All authenticated users can read and write plots (team-shared model)
create policy "plots_select" on plots
  for select using (auth.role() = 'authenticated');

create policy "plots_insert" on plots
  for insert with check (auth.role() = 'authenticated');

create policy "plots_update" on plots
  for update using (auth.role() = 'authenticated');

-- Only admins can hard-delete plots
create policy "plots_delete" on plots
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── Calculator snapshots ───────────────────
create policy "calc_select" on calculator_snapshots
  for select using (auth.role() = 'authenticated');

create policy "calc_write" on calculator_snapshots
  for all using (auth.role() = 'authenticated');

-- ── Scoring inputs ────────────────────────
create policy "scoring_select" on scoring_inputs
  for select using (auth.role() = 'authenticated');

create policy "scoring_write" on scoring_inputs
  for all using (auth.role() = 'authenticated');
