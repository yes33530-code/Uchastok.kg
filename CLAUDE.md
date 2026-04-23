# uchastok.kg

Next.js 16 + Supabase web app for managing land plots (kanban pipeline, scoring, public listings, role-based access).

## Workspaces
- `src/app/` — Next.js App Router: routes, layouts, auth flows, `/api`
- `src/components/` — feature UI (kanban, plots, dashboard, calculator, settings)
- `supabase/` — Postgres schema, RLS policies, migrations

## Routing
| Task | Go to | Read |
|------|-------|------|
| Add/modify a page or route | `src/app/` | `src/app/CONTEXT.md` |
| Auth flow / login / OAuth callback | `src/app/(auth)/` | `src/app/CONTEXT.md` |
| Public listings page | `src/app/(public)/` | `src/app/CONTEXT.md` |
| Build/tweak a UI feature | `src/components/` | `src/components/CONTEXT.md` |
| DB schema, RLS, new migration | `supabase/` | `supabase/CONTEXT.md` |
| Server action (mutate data) | `src/actions/` | `src/app/CONTEXT.md` |
| Business logic (scoring, automations, calculator) | `src/lib/` | `src/components/CONTEXT.md` |
| Supabase client/server factories | `src/lib/supabase/` | `src/app/CONTEXT.md` |
| Generated DB types | `src/types/database.types.ts` | — |

## Stack
- Next.js 16.2 (App Router, Server Actions, experimental proxy) — `react@19.2`
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Tailwind 4, dnd-kit, react-hook-form + zod, recharts, sonner, lucide

## Conventions
- **Read the local Next.js docs before writing Next-specific code.** This Next.js has breaking changes from training-data versions — see `AGENTS.md` and `node_modules/next/dist/docs/`.
- Migrations are numbered `NNN_description.sql` (currently at 016). Never renumber; add the next number.
- Route groups: `(app)` = authed app shell, `(auth)` = login/pending, `(public)` = unauthenticated listings.
- Run `npm run typecheck` before declaring work done.
