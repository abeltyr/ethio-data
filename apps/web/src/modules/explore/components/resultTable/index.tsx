import { ArrowDown, ArrowUp } from "lucide-react";
import type { DatasetMeta } from "@/lib/data/explore/datasets";
import { cn, num } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/modules/ui/components/table";

type Col = DatasetMeta["columns"][number];

export type ResultTableProps = {
  columns: Col[];
  rows: Record<string, unknown>[];
  sort: string;
  dir: "asc" | "desc";
  onSort: (key: string) => void;
};

function format(value: unknown, col: Col): string {
  if (value === null || value === undefined) return "—";
  if (col.type === "number" && typeof value === "number") {
    return num(value, Number.isInteger(value) ? 0 : 2);
  }
  return String(value);
}

export function ResultTable({
  columns,
  rows,
  sort,
  dir,
  onSort,
}: ResultTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            {columns.map((c) => (
              <TableHead
                key={c.key}
                className={cn(
                  "eyebrow whitespace-nowrap text-muted-foreground",
                  c.type === "number" && "text-right",
                )}
              >
                {c.sortable ? (
                  <button
                    type="button"
                    onClick={() => onSort(c.key)}
                    className="animate inline-flex items-center gap-1 uppercase hover:text-primary"
                  >
                    {c.label}
                    {sort === c.key &&
                      (dir === "asc" ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      ))}
                  </button>
                ) : (
                  c.label
                )}
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
                    c.type === "number" && "text-right",
                    c.mono && "tnum tabular-nums",
                  )}
                >
                  {format(r[c.key], c)}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-10 text-center text-muted-foreground"
              >
                No rows match these filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
