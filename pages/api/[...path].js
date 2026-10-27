/**
 * Streaming API proxy → BACKEND_URL.
 * Needed for large video/image uploads: Next.js rewrites buffer bodies and often
 * return an HTML error page (413/502), which the admin UI then fails to parse as JSON.
 *
 * Always prefer JSON error bodies so parseApiJson never sees raw HTML gateways.
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

const PROXY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes (video compress + upload)

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 32 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 32 });

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

  const headers = { ...req.headers, host: target.host };
  delete headers["accept-encoding"];
  // Avoid stale keep-alive confusion through Next → backend
  headers.connection = "keep-alive";

  const options = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port || (target.protocol === "https:" ? 443 : 80),
    path: proxyPath,
    method: req.method,
    headers,
    timeout: PROXY_TIMEOUT_MS,
    agent: target.protocol === "https:" ? httpsAgent : httpAgent,
  };

  const lib = target.protocol === "https:" ? https : http;
  const proxyReq = lib.request(options, (proxyRes) => {
    const status = proxyRes.statusCode || 502;
    const contentType = proxyRes.headers["content-type"] || "";

    // Upstream nginx/hosting HTML error pages → convert to JSON for the admin UI
    const maybeHtmlGateway =
      isHtmlContentType(contentType) || status === 502 || status === 503 || status === 504;
    if (maybeHtmlGateway) {
      const chunks = [];
      proxyRes.on("data", (chunk) => chunks.push(chunk));
      proxyRes.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        const trimmed = body.trim();
        const looksHtml =
          isHtmlContentType(contentType) || /^</.test(trimmed) || /<html/i.test(trimmed);
        const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[");

        // Backend already returned JSON — pass it through unchanged
        if (looksJson && !looksHtml) {
          if (!res.headersSent) {
            res.statusCode = status;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Cache-Control", "no-store");
            res.end(body);
          }
          return;
        }

        const message =
          status === 504
            ? "API timed out. Wait a few seconds and try again."
            : status === 413 || /entity too large|payload too large/i.test(body)
              ? "File too large. Please upload a smaller file."
              : /ECONNREFUSED|not reachable/i.test(body)
                ? "API server is not reachable. Check BACKEND_URL and that the backend is running."
                : "API temporarily unavailable. Your last save may still have worked — refresh once after a few seconds.";
        sendJsonError(res, status >= 400 ? status : 502, message);
      });
      proxyRes.on("error", (err) => {
        console.error("[api-proxy] upstream body", err.message);
        sendJsonError(res, 502, "Proxy failed while reading API response. Please try again.");
      });
      return;
    }

    const outHeaders = { ...proxyRes.headers };
    // Let Node recompute framing while piping
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
