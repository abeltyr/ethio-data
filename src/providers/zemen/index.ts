import type { ProviderTaskConfig } from "../../shared/provider_types";
import type { ExchangeRate } from "../../shared/types";
import { fetchZemenDaily } from "./exchange";

export async function executeZemenTask(task: ProviderTaskConfig, date: string): Promise<ExchangeRate[]> {
  switch (task.id) {
    case "daily":
      return fetchZemenDaily(task, date);
    default:
      throw new Error(`Unknown task: ${task.id}`);
  }
}

export { fetchZemenDaily } from "./exchange";
