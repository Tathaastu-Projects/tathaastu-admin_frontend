/**
 * Streaming API proxy → BACKEND_URL.
 * Large uploads must stream (Next rewrites buffer and often return HTML 413/502).
 * Convert upstream HTML error pages into JSON so the admin UI never crashes.
 */
const http = require("http");
const https = require("https");
const { URL } = require("url");

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
    responseLimit: false,
  },
};

const PROXY_TIMEOUT_MS = 5 * 60 * 1000;

function backendBase() {
  const raw = String(process.env.BACKEND_URL || "").trim().replace(/\/$/, "");
  if (!raw) throw new Error("BACKEND_URL is missing");
  return new URL(raw);
}

function sendJsonError(res, status, message) {
  if (res.headersSent) {
    try {
      res.end();
    } catch (_e) {
      /* ignore */
    }
    return;
  }
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({ success: false, message }));
}

function isHtmlContentType(value) {
  return /text\/html/i.test(String(value || ""));
}

function messageFromHtml(status, body) {
  const text = String(body || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (status === 413 || /entity too large|payload too large|file too large/i.test(text)) {
    return "File too large. Please upload a smaller file.";
  }
  if (status === 504 || /timed? ?out|gateway time-out/i.test(text)) {
    return "API timed out. Wait a few seconds and try again.";
  }
  if (/ECONNREFUSED|not reachable/i.test(text)) {
    return "API server is not reachable. Check BACKEND_URL and that the backend is running.";
  }
  if (/SyntaxError|JSON/i.test(text)) {
    return "Invalid request data was sent to the API. Please refresh and try again.";
  }
  if (status === 404 || /cannot (get|post|put|patch|delete)/i.test(text)) {
    return "API route not found. Redeploy/restart the admin backend, then refresh.";
  }
  if (status === 502 || status === 503) {
    return "API temporarily unavailable. Wait a few seconds and refresh.";
  }
  if (text && text.length < 240) {
    return text;
  }
  return status >= 500
    ? "Something went wrong on the server. Please try again."
    : `Request failed (HTTP ${status}). Please try again.`;
}

function buildProxyHeaders(req, target) {
  const headers = {};
  for (const [key, value] of Object.entries(req.headers || {})) {
    const lower = key.toLowerCase();
    // Drop hop-by-hop / encoding headers that break streamed proxying
    if (
      [
        "host",
        "connection",
        "keep-alive",
        "proxy-authenticate",
        "proxy-authorization",
        "te",
        "trailer",
        "transfer-encoding",
        "upgrade",
        "accept-encoding",
      ].includes(lower)
    ) {
      continue;
    }
    headers[key] = value;
  }
  headers.host = target.host;
  headers.connection = "close";
  return headers;
}

export default function handler(req, res) {
  let target;
  try {
    target = backendBase();
  } catch (err) {
    sendJsonError(res, 500, err.message || "BACKEND_URL missing");
    return;
  }

  const incomingPath = req.url || "/api";
  const proxyPath = incomingPath.startsWith("/api") ? incomingPath : `/api${incomingPath}`;

  const options = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port || (target.protocol === "https:" ? 443 : 80),
    path: proxyPath,
    method: req.method,
    headers: buildProxyHeaders(req, target),
    timeout: PROXY_TIMEOUT_MS,
    // Avoid keep-alive reuse after backend restarts (stale sockets → false 502s)
    agent: false,
  };

  const lib = target.protocol === "https:" ? https : http;
  const proxyReq = lib.request(options, (proxyRes) => {
    const status = proxyRes.statusCode || 502;
    const contentType = proxyRes.headers["content-type"] || "";
    const htmlResponse = isHtmlContentType(contentType);

    // HTML from Express/nginx → JSON for the admin UI
    if (htmlResponse || status === 502 || status === 503 || status === 504) {
      const chunks = [];
      proxyRes.on("data", (chunk) => chunks.push(chunk));
      proxyRes.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        const trimmed = body.trim();
        const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[");
        const looksHtml = htmlResponse || /^</.test(trimmed) || /<html/i.test(trimmed);

        if (looksJson && !looksHtml) {
          if (!res.headersSent) {
            res.statusCode = status;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Cache-Control", "no-store");
            res.end(body);
          }
          return;
        }

        sendJsonError(res, status >= 400 ? status : 502, messageFromHtml(status, body));
      });
      proxyRes.on("error", (err) => {
        console.error("[api-proxy] upstream body", err.message);
        sendJsonError(res, 502, "Proxy failed while reading API response. Please try again.");
      });
      return;
    }

    const outHeaders = { ...proxyRes.headers };
    delete outHeaders["transfer-encoding"];
    delete outHeaders["content-length"];
    try {
      res.writeHead(status, outHeaders);
      proxyRes.pipe(res);
    } catch (err) {
      console.error("[api-proxy] writeHead/pipe", err.message);
      proxyRes.resume();
      sendJsonError(res, 502, "Proxy failed while reading API response. Please try again.");
    }
  });

  proxyReq.on("timeout", () => {
    proxyReq.destroy(new Error("Upload timed out talking to the API server"));
  });

  proxyReq.on("error", (err) => {
    console.error("[api-proxy]", err.message);
    const msg =
      /ECONNRESET|socket hang up/i.test(err.message)
        ? "API connection reset while saving. Wait a few seconds and refresh — the product may already be saved."
        : /ECONNREFUSED/i.test(err.message)
          ? "API server is not reachable. Start the backend and try again."
          : `Backend unreachable (${err.message}). Check BACKEND_URL and that the API is running.`;
    sendJsonError(res, 502, msg);
  });

  req.on("aborted", () => {
    proxyReq.destroy();
  });

  req.on("error", (err) => {
    console.error("[api-proxy] client", err.message);
    proxyReq.destroy();
  });

  req.pipe(proxyReq);
}
