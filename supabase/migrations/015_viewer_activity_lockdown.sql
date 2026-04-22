-- Complete the viewer-role lockdown that 013 missed: plot_activity inserts
-- and plot_comments updates were still permitted for viewers at the RLS
-- layer (action-level guards covered it, but defence-in-depth was missing).

drop policy if exists "plot_activity_insert" on plot_activity;
create policy "plot_activity_insert" on plot_activity
  for insert to authenticated with check (
    actor_id = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'member'))
  );

drop policy if exists "plot_comments_update" on plot_comments;
create policy "plot_comments_update" on plot_comments
  for update to authenticated using (
    created_by = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'member'))
  );
