import type { ProviderTaskConfig } from "../../shared/provider_types";
import { fetchParallel } from "./exchange";

export async function executeParallelTask(task: ProviderTaskConfig): Promise<number> {
  if (task.id === "rates") return fetchParallel(task);
  throw new Error(`Unknown task: ${task.id}`);
}

export { fetchParallel } from "./exchange";
