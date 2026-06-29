import type { ProviderTaskConfig } from "@ethiodata/types";
import { fetchPinkSheet } from "./prices";

export async function executePinkSheetTask(task: ProviderTaskConfig): Promise<number> {
  switch (task.id) {
    case "prices":
      return fetchPinkSheet(task);
    default:
      throw new Error(`Unknown task: ${task.id}`);
  }
}

export { fetchPinkSheet } from "./prices";
