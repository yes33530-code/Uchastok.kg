---
Last updated: 2026-04-22
---

# `src/components/` — Feature UI

Reusable React components grouped by feature, rendered from `src/app/` routes.

## Layout

```
components/
├── auth/               sign-in UI, pending-approval screens
├── automations/        automation rule editor
├── calculator/         profit-calculator.tsx
├── dashboard/          charts: score distribution, stage chart
├── kanban/             board, column, draggable-card, card-drawer (dnd-kit)
├── layout/             app shell: nav, sidebars
├── plots/              plot form, table, scoring inputs, file attachments, activity, publish/archive
├── settings/           user/workspace settings
└── ui/                 primitive-like shared pieces (e.g. score-badge)
```

## What happens here

- **Feature components** — one folder per product surface. A folder usually has a few focused files; resist adding a full component library here.
- **Client-heavy** — drag-and-drop (dnd-kit), forms (react-hook-form + zod resolvers), toasts (sonner), charts (recharts), icons (lucide-react).
- **Business logic does NOT live here.** Scoring rules, automation evaluation, profit math → `src/lib/{scoring,automations,calculator}/`. Components import from lib.
- **Server mutations** — components call server actions from `src/actions/` (activity, automations, files, plots, stages, users). Do not duplicate mutation logic client-side.

## Good output looks like

- New UI piece lives in the matching feature folder (or a new folder named after the feature, not the pattern).
- Business rules go to `src/lib/`; the component stays presentational + wiring.
- Forms: `react-hook-form` + `zod` schema + `@hookform/resolvers`.
- Class names merged via `clsx` + `tailwind-merge` (see `src/lib/utils.ts`).
- `npm run typecheck` passes.

## Avoid

- Stand-alone `use client` components that re-fetch data the parent server component already has.
- Re-implementing a supabase client — import from `src/lib/supabase/`.
- Adding a new top-level folder when the feature clearly belongs under an existing one.
- New UI primitives in `ui/` unless reused in 2+ places.

## Cross-links

- Where these components are mounted → `src/app/CONTEXT.md`
- DB shape they consume → `supabase/CONTEXT.md` + `src/types/database.types.ts`
