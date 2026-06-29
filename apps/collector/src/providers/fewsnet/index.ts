import type { ProviderTaskConfig } from "@ethiodata/types";
import type { ExecCtx } from "../dispatch";
import { fetchFewsNet } from "./prices";

export async function executeFewsNetTask(task: ProviderTaskConfig, ctx: ExecCtx): Promise<number> {
  switch (task.id) {
    case "prices":
      return fetchFewsNet(task, ctx);
    default:
      throw new Error(`Unknown task: ${task.id}`);
  }
}

export { fetchFewsNet } from "./prices";
