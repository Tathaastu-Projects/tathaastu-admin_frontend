const { loadEnvConfig } = require("@next/env");
const { spawn } = require("child_process");
const path = require("path");

const projectDir = path.resolve(__dirname, "..");
loadEnvConfig(projectDir);

const command = process.argv[2] || "dev";
const port = process.env.PORT;
if (!port) {
  console.error("PORT is missing. Set PORT in frontend/.env");
  process.exit(1);
}

const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(process.execPath, [nextBin, command, "-p", String(port)], {
  stdio: "inherit",
  cwd: projectDir,
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
