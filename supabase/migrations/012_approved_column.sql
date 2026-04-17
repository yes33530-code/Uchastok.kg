-- Add approval gate to profiles
alter table profiles add column if not exists approved boolean not null default false;

-- Existing users (already using the app) should be approved automatically
-- New signups default to false and need admin approval
-- Run this manually to approve yourself as the first admin:
-- update profiles set approved = true, role = 'admin' where id = '<your-user-id>';
