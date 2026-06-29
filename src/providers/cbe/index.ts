import type { ExchangeRate } from "../../shared/types";
import type { ProviderTaskConfig } from "../../shared/provider_types";
import { fetchCbeDaily } from "./exchange";

export async function executeCbeTask(
  task: ProviderTaskConfig,
  date: string
): Promise<ExchangeRate[]> {
  switch (task.id) {
    case "daily":
      return fetchCbeDaily(task, date);
    default:
      throw new Error(`Unknown task: ${task.id}`);
  }
}

export { fetchCbeDaily } from "./exchange";
