/**
 * Read fetch response as JSON. On proxy/size/timeout failures, show a short
 * plain message (e.g. file size limit) — never raw HTML / JSON parse errors.
 */

const MAX_UPLOAD_MB = 120;

function friendlyError(status: number, body: string): string | null {
  if (
    status === 413 ||
    /entity too large|request entity|payload too large|file too large|file size/i.test(body)
  ) {
    return `File too large. Please upload a file under ${MAX_UPLOAD_MB} MB.`;
  }
  if (status === 504 || /gateway time-out|timed? ?out/i.test(body)) {
    return `Upload timed out. Please use a smaller file (under ${MAX_UPLOAD_MB} MB) and try again.`;
  }
  if (/econnreset|backend unreachable|socket hang up|ECONNREFUSED/i.test(body)) {
    return "Could not reach the API. Wait a few seconds and try again (do not refresh repeatedly).";
  }
  if (status === 409 || /another device|database is busy|db_busy/i.test(body)) {
    return "Another device is saving right now. Wait 2 seconds and upload again.";
  }
  if (status === 502 || status === 503) {
    return "API temporarily unavailable. Your last save may still have worked — refresh once after a few seconds.";
  }
  if (status === 401 || status === 403) {
    return "Please log in again and try.";
  }
  if (status === 404) {
    return "Request failed. Please refresh the page and try again.";
  }
  if (status >= 500) {
    return "Something went wrong on the server. Please try again.";
  }
  return null;
}

export type ApiJson = {
  success?: boolean;
  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export function asErrorMessage(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export async function parseApiJson<T = ApiJson>(response: Response): Promise<T> {
  const text = await response.text();
  const trimmed = text.trim();

  if (!trimmed) {
    const hint = friendlyError(response.status, "");
    throw new Error(hint || `Request failed (HTTP ${response.status}). Please try again.`);
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const hint = friendlyError(response.status, trimmed);
    if (hint) throw new Error(hint);

    const looksHtml = /^</.test(trimmed) || /<html/i.test(trimmed);
    if (looksHtml) {
      if (response.status === 502 || response.status === 503) {
        throw new Error(
          "API temporarily unavailable. Your last save may still have worked — refresh once after a few seconds."
        );
      }
      throw new Error(`File too large. Please upload a file under ${MAX_UPLOAD_MB} MB.`);
    }

    throw new Error("Save failed. Please try again.");
  }
}

export async function fetchApiJson<T = ApiJson>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ response: Response; data: T }> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch {
    throw new Error("Could not connect. Check your internet and try again.");
  }
  const data = await parseApiJson<T>(response);
  return { response, data };
}

/** Automatic retry for transient proxy / multi-device lock blips. */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 1
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(input, init);
      const retryable =
        response.status === 409 ||
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504;
      if (attempt < retries && retryable) {
        // Body must be consumed or next attempt can hang on some browsers if we clone — skip body
        try {
          await response.arrayBuffer();
        } catch {
          /* ignore */
        }
        await new Promise((r) => setTimeout(r, 700 + attempt * 500));
        continue;
      }
      return response;
    } catch (err) {
      lastErr = err;
      if (attempt >= retries) break;
      await new Promise((r) => setTimeout(r, 700 + attempt * 500));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Could not connect. Please try again.");
}
