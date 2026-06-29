import type { Metadata } from "next";
import { site } from "@/lib/constants";
import {
  coverage,
  listingTypes,
  monthlyTrend,
  rawListings,
  summaryByBedroom,
} from "@/lib/data/warehouse/property";
import { breadcrumbLd, datasetLd } from "@/lib/utils/jsonLd";
import { JsonLdScript } from "@/modules/common/components/jsonLdScript";
import { HousingTemplate } from "@/modules/housing/templates";

const title = "Housing — Addis Ababa house and rent prices";
const description =
  "Addis Ababa housing and rent listings by size, area, and price — a view of urban affordability from a historical dataset plus ongoing snapshots, raw and analysed.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/housing" },
  openGraph: {
    type: "article",
    title,
    description,
    url: `${site.url}/housing`,
    siteName: site.name,
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function HousingPage() {
  const cov = coverage();
  const trends = listingTypes()
    .slice(0, 2)
    .map((t) => ({
      type: t.listing_type,
      points: monthlyTrend(t.listing_type),
    }))
    .filter((t) => t.points.length > 1);
  return (
    <>
      <JsonLdScript
        data={[
          datasetLd({
            name: "Addis Ababa housing & rent listings",
            description,
            path: "/housing",
            spatial: "Addis Ababa, Ethiopia",
            temporal: `${cov.span?.lo}/${cov.span?.hi}`,
          }),
          breadcrumbLd([
            { name: "Overview", path: "/" },
            { name: "Housing", path: "/housing" },
          ]),
        ]}
      />
      <HousingTemplate
        coverage={cov}
        byBedroom={summaryByBedroom()}
        trends={trends}
        raw={rawListings(40)}
      />
    </>
  );
}
