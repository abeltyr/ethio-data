import { Figure } from "@/modules/common/components/figure";
import type { Tone } from "@/types/warehouse";

export type HeroFigure = {
  label: string;
  value: string;
  unit?: string;
  tone?: Tone;
};
export type DomainHeroProps = {
  eyebrow: string;
  amharic: string;
  title: string;
  lead: string;
  figures: HeroFigure[];
};

/** The masthead for a domain page: title, answer-first lead, and headline figures. */
export function DomainHero({
  eyebrow,
  amharic,
  title,
  lead,
  figures,
}: DomainHeroProps) {
  return (
    <section className="sp-x border-border border-b py-12 sm:py-16">
      <div className="flex items-baseline gap-3">
        <span className="eyebrow text-primary">{eyebrow}</span>
        <span className="font-display text-muted-foreground italic">
          {amharic}
        </span>
      </div>
      <h1 className="mt-3 max-w-3xl font-display text-4xl text-foreground leading-tight tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
        {lead}
      </p>
      <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 sm:flex sm:flex-wrap sm:gap-x-14">
        {figures.map((f) => (
          <Figure
            key={f.label}
            label={f.label}
            value={f.value}
            unit={f.unit}
            tone={f.tone}
          />
        ))}
      </div>
    </section>
  );
}
