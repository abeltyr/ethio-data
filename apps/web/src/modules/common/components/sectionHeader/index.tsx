import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SectionHeaderProps = {
  eyebrow: string;
  amharic?: string;
  title: string;
  note?: ReactNode;
  as?: "h2" | "h3";
  className?: string;
};

export function SectionHeader({
  eyebrow,
  amharic,
  title,
  note,
  as = "h2",
  className,
}: SectionHeaderProps) {
  const Heading = as;
  return (
    <header
      className={cn(
        "flex flex-col gap-2 border-border border-b pb-4",
        className,
      )}
    >
      <div className="flex items-baseline gap-3">
        <span className="eyebrow text-primary">{eyebrow}</span>
        {amharic && (
          <span className="font-display text-muted-foreground text-sm italic">
            {amharic}
          </span>
        )}
      </div>
      <Heading className="font-display text-2xl text-foreground leading-tight tracking-tight sm:text-3xl">
        {title}
      </Heading>
      {note && (
        <p className="max-w-prose text-muted-foreground leading-relaxed">
          {note}
        </p>
      )}
    </header>
  );
}
