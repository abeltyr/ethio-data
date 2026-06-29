import type { ProviderTaskConfig } from "../shared/provider_types";
import { executeNbeTask } from "./nbe";
import { executeCbeTask } from "./cbe";
import { executeBlackmarketTask } from "./blackmarket";
import { executeWfpTask } from "./wfp";
import { executeFewsNetTask } from "./fewsnet";
import { executeWorldBankTask } from "./worldbank";
import { executeImfTask } from "./imf";
import { executeComtradeTask } from "./comtrade";
import { executePinkSheetTask } from "./worldbank_pinksheet";
import { executeFaostatTask } from "./faostat";
import { executeWorldBankRtpTask } from "./worldbank_rtp";
import { executeZemenTask } from "./zemen";
import { executeHibretTask } from "./hibret";
import { executeTwoMerkatoTask } from "./twomerkato";
import { executeRealethioTask, executeRealEstateHistTask } from "./realestate";
import { executeParallelTask } from "./parallel";

// Context passed to every executor. `date` is set for "dated" tasks (one call per
// day); `startDate`/`endDate` are set for "snapshot" tasks (one call total). For
// snapshot tasks these may be years ("2022") or ISO dates depending on the source.
export interface ExecCtx {
  date?: string;
  startDate?: string;
  endDate?: string;
}

// Every executor returns the number of records it saved.
export type Executor = (task: ProviderTaskConfig, ctx: ExecCtx) => Promise<number>;

export const executors: Record<string, Executor> = {
  nbe: async (task, ctx) => (await executeNbeTask(task, ctx.date!)).length,
  cbe: async (task, ctx) => (await executeCbeTask(task, ctx.date!)).length,
  blackmarket: async (task) => {
    const r = await executeBlackmarketTask(task);
    return r?.length ?? 0;
  },
  wfp: (task) => executeWfpTask(task),
  fewsnet: (task, ctx) => executeFewsNetTask(task, ctx),
  worldbank: (task, ctx) => executeWorldBankTask(task, ctx),
  imf: (task, ctx) => executeImfTask(task, ctx),
  comtrade: (task, ctx) => executeComtradeTask(task, ctx),
  worldbank_pinksheet: (task) => executePinkSheetTask(task),
  faostat: (task) => executeFaostatTask(task),
  worldbank_rtp: (task) => executeWorldBankRtpTask(task),
  zemen: async (task, ctx) => (await executeZemenTask(task, ctx.date!)).length,
  hibret: (task) => executeHibretTask(task),
  twomerkato: (task) => executeTwoMerkatoTask(task),
  realethio: (task) => executeRealethioTask(task),
  realestate_hist: (task) => executeRealEstateHistTask(task),
  parallel: (task) => executeParallelTask(task),
};
