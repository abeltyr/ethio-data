import type { ProviderTaskConfig } from "@ethiodata/types";
import { fetchFaostat } from "./prices";

export async function executeFaostatTask(task: ProviderTaskConfig): Promise<number> {
  switch (task.id) {
    case "producer":
      return fetchFaostat(task);
    default:
      throw new Error(`Unknown task: ${task.id}`);
  }
}

export { fetchFaostat } from "./prices";
