-- ─────────────────────────────────────────
-- Custom fields (admin-defined, per workspace)
-- ─────────────────────────────────────────

create table custom_field_definitions (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  field_type  custom_field_type not null,
  options     jsonb,            -- for dropdown: ["Option A", "Option B"]
  position    integer not null default 0,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table custom_field_values (
  id              uuid primary key default uuid_generate_v4(),
  plot_id         uuid not null references plots(id) on delete cascade,
  field_id        uuid not null references custom_field_definitions(id) on delete cascade,
  value_text      text,
  value_number    numeric,
  value_date      date,
  value_boolean   boolean,
  updated_at      timestamptz not null default now(),
  unique (plot_id, field_id)
);

create trigger custom_field_values_updated_at
  before update on custom_field_values
  for each row execute function update_updated_at();

-- ── RLS ──────────────────────────────────
alter table custom_field_definitions enable row level security;
alter table custom_field_values      enable row level security;

create policy "cfd_select" on custom_field_definitions
  for select using (auth.role() = 'authenticated');

create policy "cfd_admin_write" on custom_field_definitions
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "cfv_all" on custom_field_values
  for all using (auth.role() = 'authenticated');

-- Indexes
create index cfv_plot_id_idx on custom_field_values(plot_id);
