import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: keyof T & string;
  label: string;
  align?: "left" | "right";
  mono?: boolean;
  format?: (value: T[keyof T & string], row: T) => ReactNode;
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  caption?: string;
  source?: string;
  /** Total rows in the underlying table, when only a slice is shown. */
  total?: number;
  className?: string;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  caption,
  source,
  total,
  className,
}: DataTableProps<T>) {
  return (
    <figure className={cn("flex flex-col gap-2", className)}>
      {caption && (
        <figcaption className="eyebrow text-muted-foreground">
          {caption}
        </figcaption>
      )}
      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              {columns.map((c) => (
                <TableHead
                  key={c.key}
                  className={cn(
                    "eyebrow whitespace-nowrap text-muted-foreground",
                    c.align === "right" && "text-right",
                  )}
                >
                  {c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow
                key={columns.map((c) => String(r[c.key] ?? "")).join("§")}
                className="border-border"
              >
                {columns.map((c) => (
                  <TableCell
                    key={c.key}
                    className={cn(
                      "whitespace-nowrap",
                      c.align === "right" && "text-right",
                      c.mono && "tnum tabular-nums",
                    )}
                  >
                    {c.format
                      ? c.format(r[c.key] as T[keyof T & string], r)
                      : String(r[c.key] ?? "—")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {(source || total !== undefined) && (
        <p className="text-muted-foreground text-xs">
          {total !== undefined &&
            `Showing latest ${rows.length.toLocaleString("en-US")} of ${total.toLocaleString("en-US")} rows. `}
          {source && `Source · ${source}`}
        </p>
      )}
    </figure>
  );
}
