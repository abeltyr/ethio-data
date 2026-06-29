import { SectionHeader } from "@/modules/common/components/sectionHeader";
import { FAQ } from "./data";

export function Caveats() {
  return (
    <section className="sp-x py-14">
      <SectionHeader
        eyebrow="What to know"
        amharic="ማስታወሻ"
        title="Honest limits"
        note="Good analysis is candid about its data. Read these before you cite a figure."
      />
      <dl className="mt-8 max-w-3xl divide-y divide-border border-border border-t">
        {FAQ.map((f) => (
          <div key={f.q} className="py-5">
            <dt className="font-display text-foreground text-lg">{f.q}</dt>
            <dd className="mt-2 text-muted-foreground leading-relaxed">
              {f.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
