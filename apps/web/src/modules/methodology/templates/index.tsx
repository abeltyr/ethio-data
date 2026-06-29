import { DomainHero } from "@/modules/common/components/domainHero";
import { Caveats } from "../components/caveats";
import { Sources } from "../components/sources";

export function MethodologyTemplate() {
  return (
    <>
      <DomainHero
        eyebrow="Methodology"
        amharic="ዘዴ"
        title="How this data is collected, and what it can and can't say"
        lead="Everything here is gathered from public and private sources by an open collector, stored in per-domain databases, and shown as-is. This page names every source and states the limits plainly."
        figures={[
          { label: "Domains", value: "5" },
          { label: "Hand-entered figures", value: "0" },
          { label: "Reproducible", value: "Yes", tone: "positive" },
        ]}
      />
      <Sources />
      <Caveats />
    </>
  );
}
