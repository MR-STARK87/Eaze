/**
 * Dev runner: boots the Vite dev server (if not already running),
 * waits for it to respond, then launches Electron pointing at it.
 *
 * Usage: node scripts/dev-desktop.mjs
 */
import { spawn } from "node:child_process";
import http from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

const APP_ROOT = fileURLToPath(new URL("..", import.meta.url));
const VITE_URL = "http://localhost:5173/";

function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume(); // drain
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
        } else {
          setTimeout(attempt, 300);
        }
      });
    };
    attempt();
  });
}

async function main() {
  // If Vite is already up (e.g. started separately), reuse it.
  const alreadyRunning = await new Promise((resolve) => {
    const req = http.get(VITE_URL, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
  });

  let vite = null;
  if (!alreadyRunning) {
    vite = spawn("npm", ["run", "dev"], {
      cwd: APP_ROOT,
      stdio: "inherit",
      shell: true,
    });
    vite.on("exit", (code) => {
      if (code !== 0) console.error(`[dev-desktop] vite exited with ${code}`);
    });
  } else {
    console.log("[dev-desktop] Reusing Vite already running at", VITE_URL);
  }

  try {
    await waitForServer(VITE_URL);
  } catch (err) {
    console.error("[dev-desktop]", err.message);
    vite?.kill();
    process.exit(1);
  }

  const electron = spawn("npx", ["electron", "."], {
    cwd: APP_ROOT,
    stdio: "inherit",
    shell: true,
  });

  const shutdown = () => {
    electron.kill();
    if (!alreadyRunning) vite?.kill();
    process.exit(0);
  };

  electron.on("exit", () => {
    if (!alreadyRunning) vite?.kill();
    process.exit(0);
  });

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
