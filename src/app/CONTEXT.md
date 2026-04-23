---
Last updated: 2026-04-22
---

# `src/app/` — Next.js App Router

Entry point for every URL the browser hits. Routes, layouts, auth, API handlers.

## Layout

```
app/
├── layout.tsx          root layout (fonts, providers, toasts)
├── page.tsx            root page
├── globals.css         Tailwind entry
├── (app)/              authed app shell: board, plots, dashboard, settings, archive
├── (auth)/             login, pending-approval, OAuth callback (`auth/`)
├── (public)/           unauthenticated listings
└── api/upload/         file upload endpoint (50MB cap — see next.config.ts)
```

## What happens here

- **Routes & layouts** — each folder is a URL segment; `layout.tsx` wraps nested routes.
- **Server actions** live in `src/actions/` and are imported by page/form components here. Mutations go through actions, not API routes.
- **Auth gating** — `(app)` routes assume an authenticated user; `(auth)` handles sign-in and the pending-approval state (see migration `011_admin_profiles_policy` + `013_viewer_role`); `(public)` is open.
- **Data access** — use `src/lib/supabase/server.ts` in server components / actions, `client.ts` in client components. Do not instantiate Supabase clients ad-hoc.

## Good output looks like

- New route: add folder under the correct group (`(app)` / `(auth)` / `(public)`), add `page.tsx` (+ `layout.tsx` if needed).
- New mutation: add a server action in `src/actions/`, call it from a client component or `<form action={…}>`.
- Uses Next 16 server-component patterns — no `"use client"` unless interaction requires it.
- `npm run typecheck` passes.

## Avoid

- Writing fetch handlers when a server action fits.
- Importing `database.types.ts` types in client components when an action can return a narrower shape.
- Bypassing RLS with the service role — every request should run under the user's session.
- Assuming Next.js / React API shapes from memory. Consult `node_modules/next/dist/docs/` first (see `AGENTS.md`).

## Cross-links

- UI pieces rendered here → `src/components/CONTEXT.md`
- Schema & RLS that these routes depend on → `supabase/CONTEXT.md`
