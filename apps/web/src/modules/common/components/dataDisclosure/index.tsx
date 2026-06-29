"use client";

import { ChevronDown } from "lucide-react";
import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import type { Column } from "@/modules/common/components/dataTable";

/** A table column that also documents what it means (used by RawDataSection). */
export type GlossColumn<T> = Column<T> & { help?: string };

export type Gloss = { label: string; help: string };

export type DataDisclosureProps = {
  title: string;
  description: string;
  glossary: Gloss[];
  total: number;
  /** The server-rendered table (kept server-side so its format functions never cross to the client). */
  children: ReactNode;
};

/** Raw data, on demand: collapsed by default, opening to a glossary of every column plus the
 *  table itself. The table is rendered on the server and passed in as children. */
export function DataDisclosure({
  title,
  description,
  glossary,
  total,
  children,
}: DataDisclosureProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="animate flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-accent/30"
      >
        <span className="flex flex-col gap-0.5">
          <span className="font-display text-foreground text-lg">{title}</span>
          <span className="text-muted-foreground text-sm">{description}</span>
        </span>
        <span className="eyebrow flex shrink-0 items-center gap-1 text-primary">
          {open ? "Hide" : `Show ${total.toLocaleString("en-US")} rows`}
          <ChevronDown
            className={cn("size-4 transition-transform", open && "rotate-180")}
          />
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-5 border-border border-t px-5 py-5">
          {glossary.length > 0 && (
            <div>
              <p className="eyebrow mb-2 text-muted-foreground">
                What each column means
              </p>
              <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                {glossary.map((g) => (
                  <div key={g.label} className="flex gap-2">
                    <dt className="shrink-0 font-medium text-foreground">
                      {g.label}
                    </dt>
                    <dd className="text-muted-foreground">{g.help}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
