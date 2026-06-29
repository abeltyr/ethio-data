import type { Metadata } from "next";
import { site } from "@/lib/constants";
import { premiumSeries } from "@/lib/data/warehouse/currency";
import { inflation } from "@/lib/data/warehouse/macro";
import { headline, warehouseSummary } from "@/lib/data/warehouse/overview";
import { balanceSeries } from "@/lib/data/warehouse/trade";
import { organizationLd, webSiteLd } from "@/lib/utils/jsonLd";
import { JsonLdScript } from "@/modules/common/components/jsonLdScript";
import { HomeTemplate } from "@/modules/home/templates";

export const metadata: Metadata = {
  title: `${site.name} — open economic data warehouse`,
  description: site.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const summary = warehouseSummary();
  return (
    <>
      <JsonLdScript data={[organizationLd(), webSiteLd()]} />
      <HomeTemplate
        summary={summary}
        headline={headline()}
        premium={premiumSeries()}
        balance={balanceSeries()}
        cpi={inflation().cpi}
      />
    </>
  );
}
