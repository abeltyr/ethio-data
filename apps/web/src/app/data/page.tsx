import type { Metadata } from "next";
import { site } from "@/lib/constants";
import { DATASETS, datasetMeta } from "@/lib/data/explore/datasets";
import { breadcrumbLd } from "@/lib/utils/jsonLd";
import { JsonLdScript } from "@/modules/common/components/jsonLdScript";
import { ExploreTemplate } from "@/modules/explore/templates";

const title = "Explore — search and filter every dataset";
const description =
  "Browse the Ethiopia Economic Data warehouse directly: filter, search, sort, and summarise exchange rates, prices, macro indicators, trade flows, and housing listings.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/data" },
  openGraph: {
    type: "website",
    title,
    description,
    url: `${site.url}/data`,
    siteName: site.name,
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function DataPage() {
  return (
    <>
      <JsonLdScript
        data={[
          breadcrumbLd([
            { name: "Overview", path: "/" },
            { name: "Explore", path: "/data" },
          ]),
        ]}
      />
      <ExploreTemplate datasets={DATASETS.map(datasetMeta)} />
    </>
  );
}
