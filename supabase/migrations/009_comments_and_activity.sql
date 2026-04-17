-- ─────────────────────────────────────────
-- Comments on plots (Trello-style)
-- ─────────────────────────────────────────
create table plot_comments (
  id          uuid primary key default uuid_generate_v4(),
  plot_id     uuid not null references plots(id) on delete cascade,
  body        text not null check (char_length(body) > 0),
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index plot_comments_plot_id_idx on plot_comments(plot_id);
create index plot_comments_created_at_idx on plot_comments(created_at desc);

create trigger plot_comments_updated_at
  before update on plot_comments
  for each row execute function update_updated_at();

-- RLS
alter table plot_comments enable row level security;

-- Authenticated users can read all comments
create policy "plot_comments_select" on plot_comments
  for select to authenticated using (true);

-- Authenticated users can insert their own comments
create policy "plot_comments_insert" on plot_comments
  for insert to authenticated with check (created_by = auth.uid());

-- Only the comment author can delete their own comment
create policy "plot_comments_delete" on plot_comments
  for delete to authenticated using (created_by = auth.uid());

-- Only the comment author can update their own comment
create policy "plot_comments_update" on plot_comments
  for update to authenticated using (created_by = auth.uid());

-- ─────────────────────────────────────────
-- Activity / audit log for plots
-- ─────────────────────────────────────────
create table plot_activity (
  id           uuid primary key default uuid_generate_v4(),
  plot_id      uuid not null references plots(id) on delete cascade,
  actor_id     uuid references profiles(id) on delete set null,
  action_type  text not null,
  -- payload examples:
  --   stage_changed:  { from_stage: "Новый", to_stage: "В работе" }
  --   comment_added:  { comment_id: "...", preview: "Первые 80 символов..." }
  --   comment_deleted:{ preview: "..." }
  --   file_uploaded:  { file_name: "doc.pdf" }
  --   file_deleted:   { file_name: "doc.pdf" }
  --   plot_created:   {}
  --   plot_archived:  {}
  --   plot_unarchived:{}
  --   plot_published: {}
  --   field_updated:  { field: "address", from: "...", to: "..." }
  payload      jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

create index plot_activity_plot_id_idx   on plot_activity(plot_id);
create index plot_activity_created_at_idx on plot_activity(created_at desc);

-- RLS
alter table plot_activity enable row level security;

-- Authenticated users can read all activity
create policy "plot_activity_select" on plot_activity
  for select to authenticated using (true);

-- Authenticated users can insert activity (actions log their own events)
create policy "plot_activity_insert" on plot_activity
  for insert to authenticated with check (actor_id = auth.uid());
