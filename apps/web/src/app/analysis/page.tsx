import type { Metadata } from "next";
import { site } from "@/lib/constants";
import {
  passThrough,
  realPrices,
  regionalSpread,
  seasonality,
} from "@/lib/data/warehouse/analysis";
import { breadcrumbLd, datasetLd } from "@/lib/utils/jsonLd";
import { AnalysisTemplate } from "@/modules/analysis/templates";
import { JsonLdScript } from "@/modules/common/components/jsonLdScript";

const title =
  "Analysis — real prices, pass-through, seasonality, regional gaps";
const description =
  "Cross-domain analysis of Ethiopian economic data: inflation-adjusted prices, exchange-rate pass-through to food, seasonal price cycles, and regional price gaps — with methods and caveats.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/analysis" },
  openGraph: {
    type: "article",
    title,
    description,
    url: `${site.url}/analysis`,
    siteName: site.name,
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function AnalysisPage() {
  return (
    <>
      <JsonLdScript
        data={[
          datasetLd({
            name: "Ethiopia cross-domain economic analysis",
            description,
            path: "/analysis",
          }),
          breadcrumbLd([
            { name: "Overview", path: "/" },
            { name: "Analysis", path: "/analysis" },
          ]),
        ]}
      />
      <AnalysisTemplate
        real={realPrices()}
        pass={passThrough()}
        season={seasonality()}
        region={regionalSpread()}
      />
    </>
  );
}
