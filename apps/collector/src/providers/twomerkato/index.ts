import type { ProviderTaskConfig } from "@ethiodata/types";
import { fetchTwoMerkato } from "./prices";

export async function executeTwoMerkatoTask(task: ProviderTaskConfig): Promise<number> {
  switch (task.id) {
    case "ecx":
      return fetchTwoMerkato(task);
    default:
      throw new Error(`Unknown task: ${task.id}`);
  }
}

export { fetchTwoMerkato } from "./prices";
