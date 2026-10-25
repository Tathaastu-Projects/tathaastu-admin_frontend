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

function backendBase() {
  const raw = String(process.env.BACKEND_URL || "").trim().replace(/\/$/, "");
  if (!raw) throw new Error("BACKEND_URL is missing");
  return new URL(raw);
}

export default function handler(req, res) {
  let target;
  try {
    target = backendBase();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "BACKEND_URL missing" });
    return;
  }

  const incomingPath = req.url || "/api";
  const proxyPath = incomingPath.startsWith("/api") ? incomingPath : `/api${incomingPath}`;

  const headers = { ...req.headers, host: target.host };
  delete headers["accept-encoding"];

  const options = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port || (target.protocol === "https:" ? 443 : 80),
    path: proxyPath,
    method: req.method,
    headers,
    timeout: PROXY_TIMEOUT_MS,
  };

  const lib = target.protocol === "https:" ? https : http;
  const proxyReq = lib.request(options, (proxyRes) => {
    const outHeaders = { ...proxyRes.headers };
    // Avoid double-compression / length mismatches when piping
    delete outHeaders["transfer-encoding"];
    res.writeHead(proxyRes.statusCode || 502, outHeaders);
    proxyRes.pipe(res);
  });

  proxyReq.on("timeout", () => {
    proxyReq.destroy(new Error("Upload timed out talking to the API server"));
  });

  proxyReq.on("error", (err) => {
    console.error("[api-proxy]", err.message);
    if (res.headersSent) {
      res.end();
      return;
    }
    res.status(502).json({
      success: false,
      message: `Backend unreachable (${err.message}). Check BACKEND_URL and that the API is running.`,
    });
  });

  req.on("aborted", () => {
    proxyReq.destroy();
  });

  req.pipe(proxyReq);
}
