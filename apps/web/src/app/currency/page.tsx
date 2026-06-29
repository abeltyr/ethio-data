import type { Metadata } from "next";
import { site } from "@/lib/constants";
import {
  coverage,
  goldSeries,
  latestFx,
  premiumSeries,
  rawRates,
} from "@/lib/data/warehouse/currency";
import { breadcrumbLd, datasetLd } from "@/lib/utils/jsonLd";
import { JsonLdScript } from "@/modules/common/components/jsonLdScript";
import { CurrencyTemplate } from "@/modules/currency/templates";

const title =
  "Currency & FX — exchange rates, the black-market premium, and gold";
const description =
  "Official and parallel (black-market) US-dollar exchange rates for Ethiopia, the premium between them, and gold prices — shown raw and analysed.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/currency" },
  openGraph: {
    type: "article",
    title,
    description,
    url: `${site.url}/currency`,
    siteName: site.name,
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function CurrencyPage() {
  const cov = coverage();
  return (
    <>
      <JsonLdScript
        data={[
          datasetLd({
            name: "Ethiopia exchange rates & gold",
            description,
            path: "/currency",
            temporal: `${cov.span?.lo}/${cov.span?.hi}`,
          }),
          breadcrumbLd([
            { name: "Overview", path: "/" },
            { name: "Currency & FX", path: "/currency" },
          ]),
        ]}
      />
      <CurrencyTemplate
        coverage={cov}
        latest={latestFx()}
        premium={premiumSeries()}
        gold={goldSeries()}
        raw={rawRates(40)}
      />
    </>
  );
}
