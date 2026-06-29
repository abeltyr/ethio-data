import type { ProviderTaskConfig } from "@ethiodata/types";
import type { ExecCtx } from "../dispatch";
import { fetchImf } from "./indicators";

export async function executeImfTask(task: ProviderTaskConfig, ctx: ExecCtx): Promise<number> {
  switch (task.id) {
    case "macro":
      return fetchImf(task, ctx);
    default:
      throw new Error(`Unknown task: ${task.id}`);
  }
}

export { fetchImf } from "./indicators";
