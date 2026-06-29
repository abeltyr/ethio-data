import type { Metadata } from "next";
import { site } from "@/lib/constants";
import { tradeFindings } from "@/lib/data/warehouse/findings";
import {
  balanceSeries,
  coverage,
  latestYear,
  rawFlows,
  signatureExports,
  topExports,
  topImports,
  topPartners,
} from "@/lib/data/warehouse/trade";
import { breadcrumbLd, datasetLd } from "@/lib/utils/jsonLd";
import { JsonLdScript } from "@/modules/common/components/jsonLdScript";
import { TradeTemplate } from "@/modules/trade/templates";

const title = "Trade — exports, imports, the deficit, and partners";
const description =
  "Ethiopia's annual exports and imports, the structural trade deficit, signature exports like coffee, and bilateral trading partners — from UN Comtrade, raw and analysed.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/trade" },
  openGraph: {
    type: "article",
    title,
    description,
    url: `${site.url}/trade`,
    siteName: site.name,
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function TradePage() {
  const cov = coverage();
  const year = latestYear();
  return (
    <>
      <JsonLdScript
        data={[
          datasetLd({
            name: "Ethiopia trade flows",
            description,
            path: "/trade",
            temporal: `${cov.span?.lo}/${cov.span?.hi}`,
            creator: "UN Comtrade",
          }),
          breadcrumbLd([
            { name: "Overview", path: "/" },
            { name: "Trade", path: "/trade" },
          ]),
        ]}
      />
      <TradeTemplate
        coverage={cov}
        year={year}
        balance={balanceSeries()}
        exports={topExports(year)}
        imports={topImports(year)}
        partners={topPartners(year)}
        coffee={signatureExports().coffee}
        raw={rawFlows(120)}
        findings={tradeFindings()}
      />
    </>
  );
}
