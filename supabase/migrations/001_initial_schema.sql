-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Enums
create type zone_type as enum ('Residential', 'Commercial', 'Agricultural', 'Mixed-use');
create type custom_field_type as enum ('text', 'number', 'date', 'boolean', 'dropdown');

-- ─────────────────────────────────────────
-- Profiles (extends auth.users)
-- ─────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  role        text not null default 'member' check (role in ('admin', 'member')),
  created_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────
-- Kanban stages
-- ─────────────────────────────────────────
create table kanban_stages (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  position    integer not null,
  color       text not null default '#6366f1',
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- Plots (core entity)
-- ─────────────────────────────────────────
create table plots (
  id                      uuid primary key default uuid_generate_v4(),

  -- Identity
  address                 text not null,

  -- Size and pricing
  size_sotok              numeric(10,2) not null,
  price_usd_per_100sqm    numeric(12,2),

  -- Deal structure
  owner_share_pct         numeric(5,2) not null default 0
                            check (owner_share_pct >= 0 and owner_share_pct <= 100),

  -- Contact
  contact_name            text,
  contact_phone           text,
  contact_email           text,

  -- Project details
  project_duration_months integer,
  legal_clearance         boolean not null default false,
  zone                    zone_type,

  -- Workflow
  stage_id                uuid references kanban_stages(id) on delete set null,
  assigned_to             uuid references profiles(id) on delete set null,
  notes                   text,

  -- Scoring (cached)
  score                   integer check (score >= 0 and score <= 100),
  score_breakdown         jsonb,

  -- Archive
  archived                boolean not null default false,
  archived_at             timestamptz,
  archived_by             uuid references profiles(id) on delete set null,

  -- Audit
  created_by              uuid references profiles(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- Calculator snapshots (1:1 with plots)
-- ─────────────────────────────────────────
create table calculator_snapshots (
  id                              uuid primary key default uuid_generate_v4(),
  plot_id                         uuid not null unique references plots(id) on delete cascade,

  -- Inputs
  land_acquisition_cost           numeric(15,2),
  construction_cost_per_sqm       numeric(10,2),
  total_buildable_area_sqm        numeric(10,2),
  owner_share_pct                 numeric(5,2),
  avg_sale_price_per_sqm          numeric(10,2),
  financing_rate_pct              numeric(5,2),
  tax_rate_pct                    numeric(5,2),
  contingency_pct                 numeric(5,2),
  project_duration_months         integer,

  -- Outputs (cached)
  owner_share_deduction_sqm       numeric(10,2),
  effective_sellable_area_sqm     numeric(10,2),
  construction_total              numeric(15,2),
  financing_cost                  numeric(15,2),
  contingency_amount              numeric(15,2),
  total_development_cost          numeric(15,2),
  total_projected_revenue         numeric(15,2),
  gross_profit                    numeric(15,2),
  net_profit                      numeric(15,2),
  roi_pct                         numeric(8,2),
  irr_pct                         numeric(8,2),
  breakeven_price_per_sqm         numeric(10,2),
  annualized_return_pct           numeric(8,2),

  updated_at                      timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- Scoring inputs (1:1 with plots, manual)
-- ─────────────────────────────────────────
create table scoring_inputs (
  id                    uuid primary key default uuid_generate_v4(),
  plot_id               uuid not null unique references plots(id) on delete cascade,
  location_quality      integer check (location_quality >= 0 and location_quality <= 100),
  infrastructure_score  integer check (infrastructure_score >= 0 and infrastructure_score <= 100),
  price_vs_market_pct   numeric(8,2),
  buildout_potential    integer check (buildout_potential >= 0 and buildout_potential <= 100),
  updated_at            timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- Shared updated_at trigger
-- ─────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger plots_updated_at
  before update on plots
  for each row execute function update_updated_at();

create trigger calculator_snapshots_updated_at
  before update on calculator_snapshots
  for each row execute function update_updated_at();

create trigger scoring_inputs_updated_at
  before update on scoring_inputs
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────
-- Useful indexes
-- ─────────────────────────────────────────
create index plots_stage_id_idx    on plots(stage_id);
create index plots_archived_idx    on plots(archived);
create index plots_created_at_idx  on plots(created_at desc);
create index plots_score_idx       on plots(score desc);
