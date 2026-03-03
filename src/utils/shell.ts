import { execSync, spawn } from "node:child_process";

export function exec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: "pipe" }).trim();
  } catch {
    return "";
  }
}

export function execOrThrow(cmd: string): string {
  return execSync(cmd, { encoding: "utf-8", stdio: "pipe" }).trim();
}

export async function run(
  cmd: string,
  args: string[],
  options?: { silent?: boolean },
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      shell: true,
      stdio: options?.silent ? "pipe" : "inherit",
    });

    let stdout = "";
    let stderr = "";

    if (child.stdout) child.stdout.on("data", (d) => (stdout += d));
    if (child.stderr) child.stderr.on("data", (d) => (stderr += d));

    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

export function which(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}
