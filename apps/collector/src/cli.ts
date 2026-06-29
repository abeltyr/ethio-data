import { closeDatabase } from "@ethiodata/database";
import { getStartDate, getEndDate, PROVIDER_ID, PROVIDER_TASK, logFailed } from "./shared/config";
import { generateDateRange, isValidDate } from "./shared/date_utils";
import { getProviderConfig, listProviders } from "./providers/registry";
import { executors } from "./providers/dispatch";

function printUsage(): void {
  console.log(`
Usage: bun start [provider] [task] [start_date] [end_date]

Providers:
${listProviders().map(p => `  ${p.id.padEnd(20)} ${Object.keys(p.tasks).join(", ")}`).join("\n")}

Environment: PROVIDER_ID=${PROVIDER_ID} PROVIDER_TASK=${PROVIDER_TASK}
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) { printUsage(); process.exit(0); }

  const providerId = args[0] || PROVIDER_ID;
  const taskId = args[1] || PROVIDER_TASK;
  const startDate = args[2] || getStartDate();
  const endDate = args[3] || getEndDate();

  const provider = getProviderConfig(providerId);
  if (!provider) { console.error(`Unknown provider: ${providerId}`); printUsage(); process.exit(1); }

  const task = provider.tasks[taskId];
  if (!task) { console.error(`Unknown task: ${taskId} for ${providerId}`); process.exit(1); }

  const executor = executors[providerId];
  if (!executor) { console.error(`No executor registered for: ${providerId}`); process.exit(1); }

  const kind = task.kind ?? "dated";
  // No upfront DB init: each executor opens its own domain DB via getDb().

  // import / snapshot tasks: a single call pulls a whole dataset.
  if (kind === "import" || kind === "snapshot") {
    console.log(`Provider: ${providerId} | Task: ${task.name}${kind === "snapshot" && (startDate || endDate) ? ` | ${startDate || "*"} to ${endDate || "*"}` : ""}\n`);
    try {
      const count = await executor(task, { startDate, endDate });
      console.log(`\nComplete: ${count} records saved`);
    } catch (error) {
      logFailed(providerId, startDate || "*", error instanceof Error ? error.message : "Unknown error");
      console.error(`\nFailed: ${error instanceof Error ? error.message : error}`);
    }
    closeDatabase();
    return;
  }

  // dated tasks: one call per day across the range.
  if (!startDate || !isValidDate(startDate) || !isValidDate(endDate)) {
    console.error("Invalid date. Use YYYY-MM-DD"); process.exit(1);
  }

  console.log(`Provider: ${providerId} | Task: ${task.name} | ${startDate} to ${endDate}\n`);

  const dates = generateDateRange(startDate, endDate);
  let success = 0, failed = 0, cached = 0;

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    if (!date) continue;
    process.stdout.write(`[${i + 1}/${dates.length}] ${date}... `);

    try {
      const count = await executor(task, { date });
      if (count === 0) { cached++; console.log("⊘ cached/empty"); }
      else { success++; console.log(`✓ ${count} records`); }
    } catch (error) {
      failed++;
      logFailed(providerId, date, error instanceof Error ? error.message : "Unknown error");
      console.log("✗ failed");
    }
  }

  console.log(`\nComplete: ${success} fetched, ${cached} cached, ${failed} failed`);
  closeDatabase();
}

main();
