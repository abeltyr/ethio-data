import type { Metadata } from "next";
import { site } from "@/lib/constants";
import { macroFindings } from "@/lib/data/warehouse/findings";
import {
  coverage,
  indicatorSeries,
  inflation,
  latestIndicators,
} from "@/lib/data/warehouse/macro";
import { breadcrumbLd, datasetLd } from "@/lib/utils/jsonLd";
import { JsonLdScript } from "@/modules/common/components/jsonLdScript";
import { MacroTemplate } from "@/modules/macro/templates";

const title = "Macro — inflation, growth, and national indicators";
const description =
  "Ethiopia's macroeconomic indicators from the World Bank and IMF — consumer prices, GDP, and more, back to 1960 — shown raw and analysed.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/macro" },
  openGraph: {
    type: "article",
    title,
    description,
    url: `${site.url}/macro`,
    siteName: site.name,
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function MacroPage() {
  const cov = coverage();
  const inf = inflation();
  return (
    <>
      <JsonLdScript
        data={[
          datasetLd({
            name: "Ethiopia macroeconomic indicators",
            description,
            path: "/macro",
            temporal: `${cov.span?.lo}/${cov.span?.hi}`,
            creator: "World Bank",
          }),
          breadcrumbLd([
            { name: "Overview", path: "/" },
            { name: "Macro", path: "/macro" },
          ]),
        ]}
      />
      <MacroTemplate
        coverage={cov}
        indicators={latestIndicators(40)}
        cpi={inf.cpi}
        gdp={indicatorSeries("NY.GDP.MKTP.CD")}
        inflationYoY={inf.latestYoY}
        inflationPeriod={inf.latestPeriod}
        findings={macroFindings()}
      />
    </>
  );
}
