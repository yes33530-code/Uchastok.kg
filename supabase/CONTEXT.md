---
Last updated: 2026-04-22
---

# `supabase/` — Database schema, RLS, migrations

Single source of truth for Postgres schema, row-level security, and data model evolution.

## Layout

```
supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_rls_policies.sql
    ├── 003_automations.sql
    ├── 004_custom_fields.sql
    ├── 005_seed_stages.sql
    ├── 006_plot_files_and_labels.sql
    ├── 007_published_column.sql
    ├── 008_location_details.sql
    ├── 009_comments_and_activity.sql
    ├── 010_rename_infra_road_to_sewer.sql
    ├── 011_admin_profiles_policy.sql
    ├── 012_approved_column.sql
    ├── 013_viewer_role.sql
    ├── 014_enable_realtime.sql
    ├── 015_viewer_activity_lockdown.sql
    └── 016_infrastructure_fields.sql
```

Current head: `016`. Next migration is `017_…`.

## What happens here

- **Forward-only migrations.** Each change is a new numbered file; never edit a merged migration.
- **Roles** — `admin`, `viewer` (read-only), plus unauthenticated (public listings). RLS is enforced at the DB level; the app does not have an escape hatch.
- **Realtime** — enabled per-table in `014_enable_realtime.sql`. Add new tables to the publication explicitly if they need live updates.
- **Domain model** (inferred from migrations) — plots with stages/custom fields/location/infrastructure, labels, files, automations, comments, activity log, profiles with approval flag.

## Good output looks like

- New migration: `017_description.sql`, written in plain SQL, idempotent where reasonable (`create table if not exists`, `drop policy if exists` before `create policy`).
- Any new table comes with RLS policies in the same migration — never leave a table with RLS enabled but no policies.
- After a schema change, regenerate `src/types/database.types.ts` so the app stays type-safe.
- Confirm viewer-role behavior if touching any of: `plots`, `plot_activity`, `plot_comments`, `plot_files` — the viewer lockdown (migrations `013`, `015`) is load-bearing.

## Avoid

- Renumbering or editing existing migrations.
- Shipping a new table without an RLS policy.
- Using the service-role key from the app. RLS is the security boundary.
- Hand-writing DB types — regenerate them.

## Cross-links

- Where data is queried/mutated → `src/actions/` and `src/lib/supabase/`
- Type shapes consumed by UI → `src/types/database.types.ts`
