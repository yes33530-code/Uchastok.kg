-- ─────────────────────────────────────────
-- Plot file attachments
-- ─────────────────────────────────────────

create table if not exists plot_files (
  id            uuid primary key default uuid_generate_v4(),
  plot_id       uuid not null references plots(id) on delete cascade,
  name          text not null,
  size          bigint,
  mime_type     text,
  storage_path  text not null,
  uploaded_by   uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index plot_files_plot_id_idx on plot_files(plot_id);

-- ── RLS ──────────────────────────────────
alter table plot_files enable row level security;

create policy "plot_files_select" on plot_files
  for select using (auth.role() = 'authenticated');

create policy "plot_files_insert" on plot_files
  for insert with check (auth.role() = 'authenticated');

create policy "plot_files_delete" on plot_files
  for delete using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- Storage bucket: Plot Files
-- ─────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('Plot Files', 'Plot Files', false, 52428800, null)
on conflict (id) do nothing;

-- Storage RLS policies
create policy "plot_files_storage_select" on storage.objects
  for select using (
    bucket_id = 'Plot Files' and auth.role() = 'authenticated'
  );

create policy "plot_files_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'Plot Files' and auth.role() = 'authenticated'
  );

create policy "plot_files_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'Plot Files' and auth.role() = 'authenticated'
  );

-- ─────────────────────────────────────────
-- Labels: column on plots + definitions table
-- ─────────────────────────────────────────

alter table plots add column if not exists labels jsonb not null default '[]'::jsonb;

create table if not exists label_definitions (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  color       text not null,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table label_definitions enable row level security;

create policy "label_definitions_select" on label_definitions
  for select using (auth.role() = 'authenticated');

create policy "label_definitions_write" on label_definitions
  for all using (auth.role() = 'authenticated');
