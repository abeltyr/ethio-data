import { RATE_LIMIT_MS, MAX_RETRIES, RETRY_DELAY_MS, FETCH_TIMEOUT_MS, TIMEOUT_MAX_RETRIES } from "./config";

// Several public data hosts (HDX/CKAN, IMF DataMapper, some bank sites) reject
// requests with an empty User-Agent (403). Send a browser-like UA on every request.
export const DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (compatible; ethiopia-data-collector/1.0)",
  "Accept": "*/*",
};

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Thrown when a request exceeds FETCH_TIMEOUT_MS. Named so callers/logs can tell a
// "host is hanging" timeout apart from an HTTP error or a parse failure.
export class TimeoutError extends Error {
  constructor(ms: number, url: string) {
    super(`timeout after ${ms}ms (${url})`);
    this.name = "TimeoutError";
  }
}

type Parser<T> = (res: Response) => Promise<T>;

// Single code path behind fetchWithRetry / fetchTextWithRetry / fetchBufferWithRetry.
// Every attempt is wrapped in an AbortController timer, so a stalled connection (or a
// body that never finishes streaming) is aborted after FETCH_TIMEOUT_MS instead of
// hanging forever. The abort surfaces as a TimeoutError, which still honours the retry
// budget and then propagates a clear message up to the caller / failed_dates.log.
async function requestWithRetry<T>(
  url: string,
  parse: Parser<T>,
  init: RequestInit | undefined,
  defaultInit: RequestInit,
  retryCount = 0,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...defaultInit,
      ...init,
      signal: controller.signal,
      headers: { ...DEFAULT_HEADERS, ...(init?.headers as Record<string, string> | undefined) },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await parse(response); // body read is covered by the same signal
    await sleep(RATE_LIMIT_MS);
    return data;
  } catch (error) {
    // An abort (our timeout) shows up as an AbortError; normalise it to TimeoutError.
    const timedOut = controller.signal.aborted || (error instanceof Error && error.name === "AbortError");
    const normalized = timedOut ? new TimeoutError(FETCH_TIMEOUT_MS, url) : error;
    // Timeouts get a tighter retry budget (a hanging host won't recover mid-run).
    const cap = timedOut ? TIMEOUT_MAX_RETRIES : MAX_RETRIES;
    if (retryCount < cap) {
      await sleep(RETRY_DELAY_MS);
      return requestWithRetry(url, parse, init, defaultInit, retryCount + 1);
    }
    throw normalized;
  } finally {
    clearTimeout(timer);
  }
}

export function fetchWithRetry<T>(url: string, retryCount = 0, init?: RequestInit): Promise<T> {
  return requestWithRetry<T>(url, async (response) => {
    const data = await response.json() as unknown;
    if (typeof data !== "object" || data === null) throw new Error("Invalid response format");
    return data as T;
  }, init, {}, retryCount);
}

// Fetch plain text (CSV / HTML). Follows redirects (HDX 302 -> S3) by default.
export function fetchTextWithRetry(url: string, retryCount = 0, init?: RequestInit): Promise<string> {
  return requestWithRetry<string>(url, async (response) => {
    const text = await response.text();
    if (!text) throw new Error("Empty response");
    return text;
  }, init, { redirect: "follow" }, retryCount);
}

// Fetch binary payloads (Excel / zip).
export function fetchBufferWithRetry(url: string, retryCount = 0, init?: RequestInit): Promise<ArrayBuffer> {
  return requestWithRetry<ArrayBuffer>(url, async (response) => {
    const buf = await response.arrayBuffer();
    if (!buf.byteLength) throw new Error("Empty response");
    return buf;
  }, init, { redirect: "follow" }, retryCount);
}
