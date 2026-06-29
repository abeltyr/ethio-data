import type { ProviderTaskConfig } from "../../shared/provider_types";
import { fetchHibret } from "./exchange";

export async function executeHibretTask(task: ProviderTaskConfig): Promise<number> {
  switch (task.id) {
    case "daily":
      return fetchHibret(task);
    default:
      throw new Error(`Unknown task: ${task.id}`);
  }
}

export { fetchHibret } from "./exchange";
