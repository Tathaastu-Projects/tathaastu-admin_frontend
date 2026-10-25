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
  if (status === 502 || status === 503) {
    return "Server is busy or restarting. Please try again in a moment.";
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

export async function parseApiJson<T = Record<string, unknown>>(response: Response): Promise<T> {
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
      // Most common cause in production: oversized video hitting proxy limit
      throw new Error(`File too large. Please upload a file under ${MAX_UPLOAD_MB} MB.`);
    }

    throw new Error("Save failed. Please try again.");
  }
}

export async function fetchApiJson<T = Record<string, unknown>>(
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
