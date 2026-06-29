import type { Metadata } from "next";
import { site } from "@/lib/constants";
import { pricesFindings } from "@/lib/data/warehouse/findings";
import {
  categories,
  coverage,
  firstStapleWithSeries,
  monthlyTrend,
  rawPrices,
} from "@/lib/data/warehouse/prices";
import { breadcrumbLd, datasetLd } from "@/lib/utils/jsonLd";
import { JsonLdScript } from "@/modules/common/components/jsonLdScript";
import { PricesTemplate } from "@/modules/prices/templates";

const title = "Prices — food and commodity prices across markets";
const description =
  "Ethiopian food, commodity, and livestock prices across hundreds of markets over decades, plus global benchmarks — from WFP, FEWS NET, FAOSTAT and the World Bank, raw and analysed.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/prices" },
  openGraph: {
    type: "article",
    title,
    description,
    url: `${site.url}/prices`,
    siteName: site.name,
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function PricesPage() {
  const cov = coverage();
  const name = firstStapleWithSeries([
    "Maize",
    "Wheat",
    "Teff",
    "Sorghum",
    "maize",
    "wheat",
    "teff",
  ]);
  const staple = name ? { name, points: monthlyTrend(name) } : null;
  return (
    <>
      <JsonLdScript
        data={[
          datasetLd({
            name: "Ethiopia food & commodity prices",
            description,
            path: "/prices",
            temporal: `${cov.span?.lo}/${cov.span?.hi}`,
          }),
          breadcrumbLd([
            { name: "Overview", path: "/" },
            { name: "Prices", path: "/prices" },
          ]),
        ]}
      />
      <PricesTemplate
        coverage={cov}
        categories={categories()}
        staple={staple}
        raw={rawPrices(120)}
        findings={pricesFindings(cov.markets, cov.commodities)}
      />
    </>
  );
}
