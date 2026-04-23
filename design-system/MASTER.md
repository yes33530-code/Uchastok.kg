---
Last updated: 2026-04-23
Generated-from: ui-ux-pro-max v2.5 (category 36 — Real Estate / Property)
---

# Uchastok.kg — Design System

Source: `ui-ux-pro-max-skill-main/src/ui-ux-pro-max/data/` — category **36, Real Estate/Property**.
Applied here so future pages can be built coherently without regenerating.

## Pattern

**Hero-Centric + Feature-Rich Showcase**

Section order for the public surface:
1. Hero (value prop + primary CTA)
2. Filters / entry points
3. Results grid / feature grid
4. Social proof (future: reviews, past sales)
5. Contact CTA

CTA strategy: brand primary on hero, contrasting accent on secondary CTAs, sticky phone/WhatsApp on detail pages.

## Style

**Minimalism & Swiss + subtle Glassmorphism accents**

- Generous whitespace, clear grid, no decoration for its own sake
- Frosted/translucent surfaces reserved for overlays and sticky bars only — never critical content (accessibility)
- 150–300ms transitions on hover states; subtle card lift (scale 1.01, shadow)
- Sharp hierarchy through type weight + size, not color alone

## Tokens

All tokens live in [src/app/globals.css](../src/app/globals.css). Use **Tailwind utilities that map to them** — not raw hex — so theme overrides flow through.

| Token | Light (OKLCH → hex) | Role |
|---|---|---|
| `--background` | `oklch(0.984 0.014 180.72)` ≈ `#F0FDFA` | page bg (teal-50) |
| `--foreground` | `oklch(0.348 0.049 188.99)` ≈ `#134E4A` | body text (teal-900) |
| `--card` | `oklch(1 0 0)` = `#FFFFFF` | card bg |
| `--primary` | `oklch(0.511 0.096 186.39)` ≈ `#0F766E` | trust teal (CTA, brand) |
| `--secondary` | `oklch(0.704 0.14 182.51)` ≈ `#14B8A6` | mid-teal highlights |
| `--accent` | `oklch(0.500 0.134 242.75)` ≈ `#0369A1` | professional blue (links, infra icons) |
| `--muted` | `oklch(0.96 0.008 210)` | inactive pills, disabled fields |
| `--muted-foreground` | `oklch(0.551 0.027 264.36)` ≈ slate-500 | secondary text |
| `--border` | `oklch(0.910 0.025 185)` | soft teal-tinted hairline |
| `--destructive` | `oklch(0.577 0.245 27.33)` ≈ `#DC2626` | errors, missing legal |
| `--radius` | `0.75rem` | card/button base radius |

Tailwind: `bg-background`, `text-foreground`, `bg-card`, `bg-primary text-primary-foreground`, `bg-accent text-accent-foreground`, `bg-muted`, `border-border`, `text-muted-foreground`, `text-destructive`.

## Typography

**Geist** (already bundled via `next/font/google`) — full Cyrillic coverage, single family with weight variations (ultimate minimal-swiss pairing). Loaded as `--font-sans`.

- Headings: weight 600, `letter-spacing: -0.02em` (tight)
- Body: weight 400 (or 500 for emphasis)
- Numbers/prices: weight 700, tabular where possible

## Zone color mapping

Kept consistent with the kanban board palette (don't break the app-shell UI):
| Zone | Hex | Usage |
|---|---|---|
| Residential (Жилая) | `#4BCE97` | green |
| Commercial (Коммерческая) | `#FEA362` | orange |
| Agricultural (С/х) | `#F5CD47` | yellow |
| Mixed-use (Смешанная) | `#9F8FEF` | violet |

These are feature semantics, not brand tokens — keep them as literal values. Use `style={{ backgroundColor: ... + '1F' }}` for 12% tint backgrounds.

## Key effects

- Card hover: `hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`
- Pill hover: `hover:bg-muted transition-colors duration-150`
- Glass header (sticky): `bg-background/70 backdrop-blur-lg border-b border-border`
- Focus ring: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

## Anti-patterns (avoid)

Per the ui-reasoning rule for category 36:
- **Poor photos** — listings without imagery look abandoned
- **No virtual tours** — add map integration; text-only is cold
- Also avoid: AI purple/pink gradients (wrong mood for land sales), neon colors, dark-mode-only (older buyers)

## Pre-delivery checklist

- [ ] No emojis as icons (use lucide SVG)
- [ ] `cursor-pointer` on clickable elements
- [ ] Hover transitions 150–300ms
- [ ] Text contrast ≥ 4.5:1 against its background
- [ ] Focus ring visible via keyboard
- [ ] `prefers-reduced-motion` respected (Tailwind `motion-reduce:` or avoid motion entirely for critical UI)
- [ ] Responsive at 375 / 768 / 1024 / 1440

## Cross-links

- Tokens live in: [src/app/globals.css](../src/app/globals.css)
- Primitive components: [src/components/ui/](../src/components/ui/)
- Per-page overrides (future): `design-system/pages/<page>.md`
