"use client";

import { useEffect, useState } from "react";
import type { DatasetMeta, ExploreResponse } from "@/lib/data/explore/datasets";
import { cn, num } from "@/lib/utils";
import { ResultTable } from "@/modules/explore/components/resultTable";
import { Button } from "@/modules/ui/components/button";
import { Input } from "@/modules/ui/components/input";

const PAGE_SIZE = 25;

export function DataExplorer({ datasets }: { datasets: DatasetMeta[] }) {
  const [active, setActive] = useState(datasets[0]?.id ?? "");
  const meta = datasets.find((d) => d.id === active) ?? datasets[0];
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [facets, setFacets] = useState<Record<string, string>>({});
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState(meta?.defaultSort.key ?? "");
  const [dir, setDir] = useState<"asc" | "desc">(
    meta?.defaultSort.dir ?? "desc",
  );
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ExploreResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!meta) return;
    const params = new URLSearchParams({
      dataset: active,
      page: String(page),
      pageSize: String(PAGE_SIZE),
      sort,
      dir,
    });
    if (debounced) params.set("search", debounced);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    for (const [k, v] of Object.entries(facets)) if (v) params.set(`f_${k}`, v);
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/explore?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: ExploreResponse) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [active, debounced, facets, from, to, sort, dir, page, meta]);

  if (!meta) return null;

  function switchDataset(id: string) {
    const m = datasets.find((d) => d.id === id);
    if (!m) return;
    setActive(id);
    setSearch("");
    setDebounced("");
    setFacets({});
    setFrom("");
    setTo("");
    setSort(m.defaultSort.key);
    setDir(m.defaultSort.dir);
    setPage(1);
  }

  function onSort(key: string) {
    if (key === sort) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("desc");
    }
    setPage(1);
  }

  const totalPages = data ? Math.max(Math.ceil(data.total / PAGE_SIZE), 1) : 1;
  const s = data?.summary;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {datasets.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => switchDataset(d.id)}
            className={cn(
              "eyebrow animate rounded-md border px-3 py-1.5",
              d.id === active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary",
            )}
          >
            {d.label}
          </button>
        ))}
      </div>
      <p className="text-muted-foreground text-sm">{meta.description}</p>

      <div className="flex flex-wrap items-end gap-3">
        {meta.searchable && (
          <label htmlFor="explore-search" className="flex flex-col gap-1">
            <span className="eyebrow text-muted-foreground">Search</span>
            <Input
              id="explore-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find…"
              className="h-8 w-48"
            />
          </label>
        )}
        {meta.facetKeys.map((key) => {
          const col = meta.columns.find((c) => c.key === key);
          const options = data?.facets[key] ?? [];
          return (
            <label
              key={key}
              htmlFor={`explore-${key}`}
              className="flex flex-col gap-1"
            >
              <span className="eyebrow text-muted-foreground">
                {col?.label}
              </span>
              <select
                id={`explore-${key}`}
                value={facets[key] ?? ""}
                onChange={(e) => {
                  setFacets((f) => ({ ...f, [key]: e.target.value }));
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-card px-2 text-sm"
              >
                <option value="">All</option>
                {options.map((o) => (
                  <option key={String(o)} value={String(o)}>
                    {String(o)}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
        {meta.dateKey && (
          <div className="flex items-end gap-2">
            <label htmlFor="explore-from" className="flex flex-col gap-1">
              <span className="eyebrow text-muted-foreground">From</span>
              <Input
                id="explore-from"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
                placeholder="2020"
                className="h-8 w-28"
              />
            </label>
            <label htmlFor="explore-to" className="flex flex-col gap-1">
              <span className="eyebrow text-muted-foreground">To</span>
              <Input
                id="explore-to"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
                placeholder="2026"
                className="h-8 w-28"
              />
            </label>
          </div>
        )}
      </div>

      {s && meta.measure && (
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 rounded-md border border-border bg-card px-5 py-4 sm:grid-cols-5">
          <Stat label="Rows matched" value={num(data?.total ?? 0)} />
          <Stat
            label={`Average ${meta.measureLabel}`}
            value={num(s.avg ?? 0, 2)}
          />
          <Stat label="Minimum" value={num(s.min ?? 0, 2)} />
          <Stat label="Maximum" value={num(s.max ?? 0, 2)} />
          <Stat label="Sum" value={num(s.sum ?? 0)} />
        </dl>
      )}

      <ResultTable
        columns={meta.columns}
        rows={data?.rows ?? []}
        sort={sort}
        dir={dir}
        onSort={onSort}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {loading
            ? "Loading…"
            : `Page ${data?.page ?? 1} of ${num(totalPages)} · ${num(data?.total ?? 0)} rows`}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="eyebrow text-muted-foreground">{label}</dt>
      <dd className="tnum text-lg tabular-nums">{value}</dd>
    </div>
  );
}
