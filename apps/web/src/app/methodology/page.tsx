import type { Metadata } from "next";
import { site } from "@/lib/constants";
import { breadcrumbLd } from "@/lib/utils/jsonLd";
import { JsonLdScript } from "@/modules/common/components/jsonLdScript";
import { FAQ } from "@/modules/methodology/components/caveats/data";
import { MethodologyTemplate } from "@/modules/methodology/templates";

const title = "Methodology — sources, cadence, and limits";
const description =
  "How the Ethiopia Economic Data warehouse is collected: the sources behind each domain, how often they update, and the honest limits of the data.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/methodology" },
  openGraph: {
    type: "article",
    title,
    description,
    url: `${site.url}/methodology`,
    siteName: site.name,
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function MethodologyPage() {
  return (
    <>
      <JsonLdScript
        data={[
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
          breadcrumbLd([
            { name: "Overview", path: "/" },
            { name: "Methodology", path: "/methodology" },
          ]),
        ]}
      />
      <MethodologyTemplate />
    </>
  );
}
