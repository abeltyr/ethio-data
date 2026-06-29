// Lightweight progress/heartbeat helper. Long-running collectors (the forex day-loops
// and the snapshot pulls) used to print nothing for minutes, so a slow run looked
// identical to a hung one. A Heartbeat ticks on a timer and reprints a status line, so
// you always see the current date / elapsed time advancing.
//
// On a TTY the line updates in place (\r). In CI / piped logs (no TTY) it prints a fresh
// line every `ciTickMs` so the log shows life without thousands of lines of spam.

const isTty = Boolean(process.stdout.isTTY);

export function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m${String(s % 60).padStart(2, "0")}s`;
}

export interface Heartbeat {
  /** Stop the timer, clear the in-place line, and optionally print a final line. */
  stop(final?: string): void;
}

export function startHeartbeat(
  status: () => string,
  opts: { ttyTickMs?: number; ciTickMs?: number } = {},
): Heartbeat {
  const tickMs = isTty ? (opts.ttyTickMs ?? 1000) : (opts.ciTickMs ?? 15000);
  let lastLen = 0;

  const render = () => {
    const line = status();
    if (isTty) {
      // Overwrite the previous line, padding out any leftover characters.
      process.stdout.write("\r" + line + " ".repeat(Math.max(0, lastLen - line.length)));
      lastLen = line.length;
    } else {
      process.stdout.write(line + "\n");
    }
  };

  render();
  const timer = setInterval(render, tickMs);
  if (typeof timer.unref === "function") timer.unref(); // never keep the process alive

  return {
    stop(final?: string) {
      clearInterval(timer);
      if (isTty && lastLen > 0) process.stdout.write("\r" + " ".repeat(lastLen) + "\r");
      if (final !== undefined) process.stdout.write(final + "\n");
    },
  };
}
