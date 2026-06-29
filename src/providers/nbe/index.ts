import type { ExchangeRate, GoldRate } from "../../shared/types";
import type { ProviderTaskConfig } from "../../shared/provider_types";
import { fetchNbeDaily } from "./exchange";
import { fetchNbeGold } from "./gold";

export async function executeNbeTask(
  task: ProviderTaskConfig,
  date: string
): Promise<ExchangeRate[] | GoldRate[]> {
  switch (task.id) {
    case "daily":
    case "monthly":
      return fetchNbeDaily(task, date);
    case "gold":
      return fetchNbeGold(task, date);
    case "gagerotr":
      throw new Error("Gagerotr task not implemented");
    default:
      throw new Error(`Unknown task: ${task.id}`);
  }
}

export { fetchNbeDaily } from "./exchange";
export { fetchNbeGold } from "./gold";
