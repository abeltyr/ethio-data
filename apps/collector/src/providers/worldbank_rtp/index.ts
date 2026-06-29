import type { ProviderTaskConfig } from "@ethiodata/types";
import { fetchWorldBankRtp } from "./prices";

export async function executeWorldBankRtpTask(task: ProviderTaskConfig): Promise<number> {
  switch (task.id) {
    case "prices":
      return fetchWorldBankRtp(task);
    default:
      throw new Error(`Unknown task: ${task.id}`);
  }
}

export { fetchWorldBankRtp } from "./prices";
