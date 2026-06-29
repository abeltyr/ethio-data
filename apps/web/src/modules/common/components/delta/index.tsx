import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn, pct } from "@/lib/utils";

export type DeltaProps = {
  value: number | null | undefined;
  /** When true, a positive number is good (green). When false (e.g. depreciation), positive is bad. */
  positiveIsGood?: boolean;
  className?: string;
};

export function Delta({ value, positiveIsGood = true, className }: DeltaProps) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (
      <span className={cn("text-muted-foreground text-sm", className)}>—</span>
    );
  }
  const good = value === 0 ? null : value > 0 === positiveIsGood;
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "tnum inline-flex items-center gap-0.5 text-sm tabular-nums",
        good === null && "text-muted-foreground",
        good === true && "text-positive",
        good === false && "text-negative",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {pct(value)}
    </span>
  );
}
