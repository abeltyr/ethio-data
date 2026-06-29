import type { ProviderTaskConfig } from "@ethiodata/types";
import { fetchRealethio } from "./realethio";
import { fetchZenodoRealEstate } from "./zenodo";

export async function executeRealethioTask(task: ProviderTaskConfig): Promise<number> {
  if (task.id === "listings") return fetchRealethio(task);
  throw new Error(`Unknown task: ${task.id}`);
}

export async function executeRealEstateHistTask(task: ProviderTaskConfig): Promise<number> {
  if (task.id === "historical") return fetchZenodoRealEstate(task);
  throw new Error(`Unknown task: ${task.id}`);
}

export { fetchRealethio } from "./realethio";
export { fetchZenodoRealEstate } from "./zenodo";
