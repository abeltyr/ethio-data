import { site } from "@/lib/constants";

export type MastheadProps = {
  observations: string;
  span: string;
  sources: number;
};

/** Home hero — the bulletin masthead. One-off; copy lives here. */
export function Masthead({ observations, span, sources }: MastheadProps) {
  return (
    <section className="sp-x border-border border-b py-14 sm:py-20">
      <p className="eyebrow text-primary">
        Open economic data bulletin · Addis Ababa
      </p>
      <p className="mt-6 font-display text-muted-foreground text-lg italic">
        {site.amharic}
      </p>
      <h1 className="mt-2 max-w-4xl font-display text-4xl text-foreground leading-[1.05] tracking-tight sm:text-6xl">
        The Ethiopian economy, in figures you can check.
      </h1>
      <p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground leading-relaxed">
        A continuously updated warehouse of Ethiopian economic time-series —
        exchange rates, food and commodity prices, macro indicators, trade
        flows, and housing — presented both as raw records and as research-grade
        analysis. Every number is sourced and reproducible.
      </p>
      <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-4">
        <div>
          <dt className="eyebrow text-muted-foreground">Observations</dt>
          <dd className="tnum mt-1 text-2xl tabular-nums">{observations}</dd>
        </div>
        <div>
          <dt className="eyebrow text-muted-foreground">Coverage</dt>
          <dd className="tnum mt-1 text-2xl tabular-nums">{span}</dd>
        </div>
        <div>
          <dt className="eyebrow text-muted-foreground">Sources</dt>
          <dd className="tnum mt-1 text-2xl tabular-nums">{sources}</dd>
        </div>
      </dl>
    </section>
  );
}
