import type { ProviderTaskConfig } from "@ethiodata/types";
import { fetchWfp } from "./prices";

export async function executeWfpTask(task: ProviderTaskConfig): Promise<number> {
  switch (task.id) {
    case "prices":
      return fetchWfp(task);
    default:
      throw new Error(`Unknown task: ${task.id}`);
  }
}

export { fetchWfp } from "./prices";
