---
description: Audit (and fix) code against the project conventions — page→template→component flow, component size/hooks, shadcn-first, token-only styling, SEO & AEO
argument-hint: "[path or route to audit, e.g. src/modules/home or /contact] [--fix]"
---

Audit the code at `$ARGUMENTS` (default: the files changed on this branch; if none, the whole `src/` tree) against the conventions in AGENTS.md. If `--fix` is passed, apply the fixes; otherwise report findings grouped by file with a recommended fix for each.

Check, in this order:

## 1. Flow: page → template → components
- `src/app/**/page.tsx` must ONLY call a template plus high-level functions (data fetch, metadata). Flag any layout markup, business logic, or UI composition in a page.
- Templates (`src/modules/{domain}/templates/*`) must ONLY orchestrate section components and hold logic shared across sections. Flag any section JSX written inline in a template.
- Every visual section must be its own component under `src/modules/{domain}/components/`.
- This is a landing-page project: flag overengineering (needless abstraction, premature data plumbing) as well.

## 2. Component data
- Reused or version-varied content: data lives in the module's `data/` files and the template passes it as a typed prop.
- Hardcoded copy inside a component is ACCEPTABLE only when the component is truly one-off and non-reusable — do not flag those; do flag duplicated copy that should be lifted to data.
- Props and data exports must be typed (component `{Name}Props`, shared shapes in `src/types/{domain}.ts`).

## 3. Component size
- Component files should stay under ~150 lines. For oversized files: if the bulk is logic (state, listeners, carousel/form wiring), extract a hook (`hook.ts` co-located or `src/hooks/use{Name}.ts`); if the bulk is markup, subdivide into sibling files with typed props.

## 4. shadcn-first
- Flag hand-rolled primitives (buttons, inputs, selects, textareas, cards, dialogs, accordions, carousels, labels, badges) that have a shadcn/ui equivalent; replace with `bunx shadcn@latest add <component>` + composition when fixing.

## 5. Styling (hard rules)
- NO `style={{...}}` inline styles — use CSS variables/classes from `globals.css`.
- NO raw colors in classNames or CSS: no hex, `rgb()`, `oklch()` literals, no arbitrary color classes like `bg-[#0c111d]`. Only token classes (`bg-background`, `text-muted-foreground`, ...). Missing colors get a new variable in `globals.css` (`:root` + `@theme inline`).
- NO raw px values: no `w-[450px]`, `text-[11px]` etc. Use the rem-based Tailwind scale or a named token/utility in `globals.css`.
- When fixing legacy files, migrate the values you touch to tokens; keep the rendered result visually identical.

## 6. SEO & AEO (per page)
- Every `page.tsx` exports `metadata`/`generateMetadata` with title, description, canonical, openGraph, twitter — built from env vars, domain never hardcoded.
- JSON-LD structured data present and correct for the page type (Organization/WebSite on home, Article on posts, BreadcrumbList on nested routes, FAQPage for Q&A, ContactPage/LocalBusiness on contact).
- Semantic HTML: one `<h1>`, ordered headings, landmarks, `alt` on all images.
- `src/app/sitemap.ts` and `src/app/robots.ts` exist and include every route; dynamic routes use `generateStaticParams` where possible.
- Copy is answer-first and facts are in machine-readable text.

## Output / verification
- Without `--fix`: a findings report grouped by rule, each with file:line and the concrete fix.
- With `--fix`: apply fixes, then run `bunx tsc --noEmit`, `bun lint`, and `bun run build` and report results. Rendered output must stay visually identical unless the finding is explicitly about markup/SEO additions.
