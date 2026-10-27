/**
 * Streaming API proxy → BACKEND_URL.
 * Needed for large video/image uploads: Next.js rewrites buffer bodies and often
 * return an HTML error page (413/502), which the admin UI then fails to parse as JSON.
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
    const outHeaders = { ...proxyRes.headers };
    // Let Node recompute framing while piping
    delete outHeaders["transfer-encoding"];
    delete outHeaders["content-length"];
    try {
      res.writeHead(proxyRes.statusCode || 502, outHeaders);
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
