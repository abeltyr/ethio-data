# Monorepo Guide

This repo is a **Turborepo** managed with **Bun workspaces**.

```
ethiodata/
├── turbo.json                  Turbo task pipeline
├── package.json                workspace root (scripts delegate to apps/packages)
├── tsconfig.base.json          shared TypeScript config (each workspace extends it)
├── apps/
│   ├── collector/   @ethiodata/collector  — the data pipeline (was ./src)
│   └── web/         @ethiodata/web         — Astro site rendering showcase/ + data
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
| `@ethiodata/web` | `apps/web` | Astro static site; reads `showcase/*.md` via a content collection and can read `data/db/*.db` via `@ethiodata/database`. |

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
`rollup`, `esbuild`, and `turbo` need (a known Bun limitation with transitive
`optionalDependencies`). So the root `package.json` pins the **macOS arm64** binaries
explicitly under `devDependencies`:

```json
"@rollup/rollup-darwin-arm64", "@esbuild/darwin-arm64", "turbo-darwin-arm64"
```

Also note: `turbo` is pinned to `2.8.17` (not `latest`/`2.10.0`) because, at time of writing,
turbo's platform-binary packages on npm lag the main package — `2.10.0` has no matching
`turbo-darwin-arm64`. And `esbuild` is pinned via `overrides` to a single version so the one
native binary resolves.

**On Linux / Intel Mac / CI**, replace those three pins with your platform's equivalents,
e.g. for Linux x64:

```json
"@rollup/rollup-linux-x64-gnu", "@esbuild/linux-x64", "turbo-linux-64"
```

(Keep the `esbuild` override and the `turbo@2.8.17` pin.) When Bun fixes optional-dependency
installation, these explicit pins can be dropped entirely.

The web app uses Astro's **passthrough image service** (`astro.config.mjs`) so it does **not**
require the heavy native `sharp` dependency.
