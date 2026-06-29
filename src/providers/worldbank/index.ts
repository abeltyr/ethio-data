import type { ProviderTaskConfig } from "../../shared/provider_types";
import type { ExecCtx } from "../dispatch";
import { fetchWorldBank } from "./indicators";

export async function executeWorldBankTask(task: ProviderTaskConfig, ctx: ExecCtx): Promise<number> {
  switch (task.id) {
    case "macro":
      return fetchWorldBank(task, ctx);
    default:
      throw new Error(`Unknown task: ${task.id}`);
  }
}

export { fetchWorldBank } from "./indicators";
