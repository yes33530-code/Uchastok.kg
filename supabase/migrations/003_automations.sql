-- ─────────────────────────────────────────
-- Automation rules and checklists
-- ─────────────────────────────────────────

-- Automation rules: "when stage changes to X, attach checklist Y"
create table automation_rules (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  trigger_type    text not null default 'stage_change',
  trigger_stage_id uuid references kanban_stages(id) on delete cascade,
  action_type     text not null default 'attach_checklist',
  enabled         boolean not null default true,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- Checklist templates linked to a rule
create table checklist_templates (
  id          uuid primary key default uuid_generate_v4(),
  rule_id     uuid not null references automation_rules(id) on delete cascade,
  title       text not null,
  items       jsonb not null default '[]'::jsonb,
  -- items format: [{label: string, required: boolean}]
  created_at  timestamptz not null default now()
);

-- Checklist instances attached to a plot when automation fires
create table plot_checklists (
  id          uuid primary key default uuid_generate_v4(),
  plot_id     uuid not null references plots(id) on delete cascade,
  template_id uuid references checklist_templates(id) on delete set null,
  rule_id     uuid references automation_rules(id) on delete set null,
  stage_id    uuid references kanban_stages(id) on delete set null,
  title       text not null,
  items       jsonb not null default '[]'::jsonb,
  -- items format: [{label, required, checked, checked_by, checked_at}]
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger plot_checklists_updated_at
  before update on plot_checklists
  for each row execute function update_updated_at();

-- Stage change audit log (used to trigger automations)
create table stage_change_log (
  id            uuid primary key default uuid_generate_v4(),
  plot_id       uuid not null references plots(id) on delete cascade,
  from_stage_id uuid references kanban_stages(id) on delete set null,
  to_stage_id   uuid references kanban_stages(id) on delete set null,
  changed_by    uuid references profiles(id) on delete set null,
  changed_at    timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────
alter table automation_rules    enable row level security;
alter table checklist_templates enable row level security;
alter table plot_checklists     enable row level security;
alter table stage_change_log    enable row level security;

create policy "auto_rules_select" on automation_rules
  for select using (auth.role() = 'authenticated');

create policy "auto_rules_admin_write" on automation_rules
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "checklist_templates_select" on checklist_templates
  for select using (auth.role() = 'authenticated');

create policy "checklist_templates_admin_write" on checklist_templates
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "plot_checklists_all" on plot_checklists
  for all using (auth.role() = 'authenticated');

create policy "stage_log_all" on stage_change_log
  for all using (auth.role() = 'authenticated');

-- Indexes
create index plot_checklists_plot_id_idx on plot_checklists(plot_id);
create index stage_change_log_plot_id_idx on stage_change_log(plot_id);
