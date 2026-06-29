import type { ProviderTaskConfig } from "@ethiodata/types";
import type { ExecCtx } from "../dispatch";
import { fetchComtrade } from "./trade";
import { fetchComtradeBasket } from "./basket";
import { fetchComtradePartners } from "./partners";

export async function executeComtradeTask(task: ProviderTaskConfig, ctx: ExecCtx): Promise<number> {
  switch (task.id) {
    case "trade":
      return fetchComtrade(task, ctx);
    case "basket":
      return fetchComtradeBasket(task, ctx);
    case "partners":
      return fetchComtradePartners(task, ctx);
    default:
      throw new Error(`Unknown task: ${task.id}`);
  }
}

export { fetchComtrade } from "./trade";
export { fetchComtradeBasket } from "./basket";
export { fetchComtradePartners } from "./partners";
