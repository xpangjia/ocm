import { exec, which } from "../utils/shell.js";

export function isGatewayRunning(): { running: boolean; pid?: string } {
  const result = exec("pgrep -f 'openclaw.*gateway'");
  if (result) {
    return { running: true, pid: result.split("\n")[0] };
  }
  return { running: false };
}

export function getOpenClawVersion(): string | null {
  if (!which("openclaw")) return null;
  const ver = exec("openclaw --version");
  return ver || null;
}

export async function restartGateway(): Promise<boolean> {
  // Stop existing
  exec("pkill -f 'openclaw.*gateway'");
  // Wait a moment
  await new Promise((r) => setTimeout(r, 1000));
  // Start in background
  try {
    const { execSync } = await import("node:child_process");
    execSync("nohup openclaw gateway --port 18789 > /dev/null 2>&1 &", {
      stdio: "ignore",
      shell: "/bin/bash",
    });
    // Wait for startup
    await new Promise((r) => setTimeout(r, 2000));
    return isGatewayRunning().running;
  } catch {
    return false;
  }
}

export async function startGateway(): Promise<boolean> {
  const status = isGatewayRunning();
  if (status.running) return true;
  return restartGateway();
}

export function stopGateway(): boolean {
  exec("pkill -f 'openclaw.*gateway'");
  return !isGatewayRunning().running;
}
