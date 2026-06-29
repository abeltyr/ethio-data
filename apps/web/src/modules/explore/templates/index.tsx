import type { DatasetMeta } from "@/lib/data/explore/datasets";
import { DomainHero } from "@/modules/common/components/domainHero";
import { DataExplorer } from "@/modules/explore/components/dataExplorer";

export function ExploreTemplate({ datasets }: { datasets: DatasetMeta[] }) {
  return (
    <>
      <DomainHero
        eyebrow="Explore"
        amharic="ፈልግ"
        title="Go through the data yourself"
        lead="Every figure on this site comes from these tables. Pick a dataset, filter and search it, sort any column, and read the live summary — exchange rates, prices, indicators, trade flows, and listings, queried directly against the warehouse."
        figures={[
          { label: "Datasets", value: String(datasets.length) },
          { label: "Queries", value: "live", tone: "gold" },
          { label: "Filters", value: "search · facet · range" },
        ]}
      />
      <section className="sp-x py-14">
        <DataExplorer datasets={datasets} />
      </section>
    </>
  );
}
