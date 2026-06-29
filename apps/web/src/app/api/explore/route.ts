import { datasetById, datasetMeta } from "@/lib/data/explore/datasets";
import { runExplore } from "@/lib/data/explore/query";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const dataset = datasetById(q.get("dataset") ?? "");
  if (!dataset) {
    return Response.json({ error: "Unknown dataset." }, { status: 400 });
  }

  const facets: Record<string, string> = {};
  for (const col of dataset.columns) {
    if (!col.facet) continue;
    const value = q.get(`f_${col.key}`);
    if (value) facets[col.key] = value;
  }

  const dir = q.get("dir");
  const result = runExplore(dataset, {
    page: Number(q.get("page") ?? "1"),
    pageSize: Number(q.get("pageSize") ?? "25"),
    sort: q.get("sort") ?? undefined,
    dir: dir === "asc" || dir === "desc" ? dir : undefined,
    search: q.get("search")?.trim() || undefined,
    from: q.get("from")?.trim() || undefined,
    to: q.get("to")?.trim() || undefined,
    facets,
  });

  return Response.json({ meta: datasetMeta(dataset), ...result });
}
