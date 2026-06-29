# Monorepo Guide

This repo is a **Turborepo** managed with **Bun workspaces**.

```
ethiodata/
├── turbo.json                  Turbo task pipeline
├── package.json                workspace root (scripts delegate to apps/packages)
├── tsconfig.base.json          shared TypeScript config (each workspace extends it)
├── apps/
│   ├── collector/   @ethiodata/collector  — the data pipeline (was ./src)
│   └── web/         @ethiodata/web         — Next.js research site reading the domain DBs
├── packages/
│   ├── database/    @ethiodata/database    — getDb, schema, save, seed, fetch ledger
│   └── types/       @ethiodata/types       — shared row + provider types
├── data/db/                    the per-domain SQLite files (+ their .md docs)
├── showcase/                   editorial content (rendered by apps/web)
├── analysis/                   ready-made SQL packs
└── docs/                       specs
```

## Workspaces

| Package | Path | What it is |
|---------|------|-----------|
| `@ethiodata/types` | `packages/types` | Pure TypeScript types (no runtime). |
| `@ethiodata/database` | `packages/database` | Provider-agnostic data layer: `getDb(domain)`, the schema modules, idempotent `save*`, `seed*`, and the `fetch_log` ledger. Reusable by any app. |
| `@ethiodata/collector` | `apps/collector` | The collection pipeline (providers, orchestrator, report, migration). Maps each provider to its domain DB. |
| `@ethiodata/web` | `apps/web` | Next.js 16 research site (App Router, React 19, Tailwind v4, shadcn). Reads the domain databases directly with `better-sqlite3` (Node-compatible; `bun:sqlite` is Bun-only) and renders raw tables + research charts per domain. |

The data layer is **domain-aware, not provider-aware**: `@ethiodata/database` exposes
`getDb(domain)`; the collector resolves a provider id → its domain (via the registry) and
calls `getDb(...)`. DB paths are anchored to the repo root (the folder with `turbo.json`), so
commands work from any directory.

## Commands

From the repo root:

```bash
bun install                 # link workspaces + install deps

# Turbo pipelines (run across all workspaces)
bun run typecheck           # turbo run typecheck  (tsc + astro check)
bun run test                # turbo run test       (bun test)
bun run build               # turbo run build      (astro build)

# Data pipeline (delegates to @ethiodata/collector, runs from repo root)
bun run collect:daily       # forex + ECX; skips already-fetched units
bun run collect:all         # every provider, incremental; still skips the ledger
bun run report              # regenerate data/db/*.md + DATA_PROFILE.md
bun run split               # one-time: split legacy exchange_rates.db

# Web app
bun run web:dev             # astro dev server
bun run web:build           # astro build (static)
```

You can also work inside a single workspace, e.g. `cd apps/collector && bun run collect:daily`
or `cd apps/web && bun run dev`.

> **Note on paths:** anything `ARCHITECTURE.md` / `DATA_SOURCES.md` describe under `src/…`
> now lives under `apps/collector/src/…`; the database/schema/ledger files moved to
> `packages/database/src/…`. The behaviour is unchanged.

## ⚠️ Native binaries (important for CI / non-macOS)

Bun in this environment does **not** auto-install the platform-specific native binaries that
several tools need (a known Bun limitation with transitive `optionalDependencies`). So the
**macOS arm64** binaries are pinned explicitly under `devDependencies`:

- root (Turbo): `turbo-darwin-arm64`
- `apps/web` (Next.js / Tailwind / Biome toolchain): `lightningcss-darwin-arm64`,
  `@tailwindcss/oxide-darwin-arm64`, `@biomejs/cli-darwin-arm64`

(`better-sqlite3` ships its own prebuilt binaries and needs no pin.)

Also note: `turbo` is pinned to `2.8.17` (not `latest`/`2.10.0`) because, at time of writing,
turbo's platform-binary packages on npm lag the main package — `2.10.0` has no matching
`turbo-darwin-arm64`.

**On Linux / Intel Mac / CI**, swap each pin for your platform's equivalent — e.g. for Linux
x64: `turbo-linux-64`, `lightningcss-linux-x64-gnu`, `@tailwindcss/oxide-linux-x64-gnu`,
`@biomejs/cli-linux-x64`. When Bun fixes optional-dependency installation, the explicit pins
can be dropped entirely.
