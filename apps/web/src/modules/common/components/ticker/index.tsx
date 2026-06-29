import { cn } from "@/lib/utils";
import { Delta } from "@/modules/common/components/delta";
import type { Tone } from "@/types/warehouse";

export type TickerItem = {
  label: string;
  value: string;
  delta?: number | null;
  deltaPositiveIsGood?: boolean;
  tone?: Tone;
};

const TONE: Record<Tone, string> = {
  primary: "text-foreground",
  gold: "text-gold",
  negative: "text-negative",
  positive: "text-positive",
  neutral: "text-muted-foreground",
};

/** The signature: a ledger strip of headline indicators in tabular monospace. */
export function Ticker({ items }: { items: TickerItem[] }) {
  return (
    <div className="overflow-x-auto border-border border-y bg-card">
      <dl className="flex min-w-max divide-x divide-border">
        {items.map((it) => (
          <div
            key={it.label}
            className="flex min-w-[10rem] flex-col gap-1 px-5 py-3"
          >
            <dt className="eyebrow text-muted-foreground">{it.label}</dt>
            <dd className="flex items-baseline gap-2">
              <span
                className={cn(
                  "tnum text-lg tabular-nums",
                  TONE[it.tone ?? "primary"],
                )}
              >
                {it.value}
              </span>
              {it.delta !== undefined && (
                <Delta
                  value={it.delta}
                  positiveIsGood={it.deltaPositiveIsGood ?? true}
                />
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
