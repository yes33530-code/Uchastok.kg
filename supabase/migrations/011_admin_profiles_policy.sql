-- Allow admins to update any user's profile (e.g. changing roles)
create policy "profiles_admin_update" on profiles
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
