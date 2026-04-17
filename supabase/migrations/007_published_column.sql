-- Add published flag to plots (safe to re-run)
alter table plots add column if not exists published boolean not null default false;

-- Allow anyone (including unauthenticated visitors) to read published plots
drop policy if exists "plots_public_select" on plots;
create policy "plots_public_select" on plots
  for select using (published = true);
