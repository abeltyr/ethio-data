import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type PlateProps = {
  title: string;
  eyebrow?: string;
  figure?: ReactNode;
  source: string;
  children: ReactNode;
  className?: string;
};

/** A "data plate": header (title + optional headline figure), a chart/table, a provenance note. */
export function Plate({
  title,
  eyebrow,
  figure,
  source,
  children,
  className,
}: PlateProps) {
  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden rounded-md border-border bg-card py-0",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-border border-b px-5 py-4">
        <div className="flex flex-col gap-1">
          {eyebrow && <span className="eyebrow text-primary">{eyebrow}</span>}
          <h3 className="font-display text-lg leading-tight">{title}</h3>
        </div>
        {figure && <div className="shrink-0 text-right">{figure}</div>}
      </CardHeader>
      <CardContent className="px-5 py-5">{children}</CardContent>
      <CardFooter className="border-border border-t px-5 py-3">
        <p className="text-muted-foreground text-xs">Source · {source}</p>
      </CardFooter>
    </Card>
  );
}
