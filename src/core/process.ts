import { execSync, spawn } from "node:child_process";
import { exec, which } from "../utils/shell.js";

const isWin = process.platform === "win32";

/**
 * 检测 Gateway 是否在运行
 */
export function isGatewayRunning(): { running: boolean; pid?: string } {
  if (isWin) {
    // Windows: wmic 查找 node.exe 参数含 openclaw 和 gateway 的进程
    const result = exec(
      'wmic process where "CommandLine like \'%openclaw%gateway%\' and Name=\'node.exe\'" get ProcessId /value',
    );
    const match = result.match(/ProcessId=(\d+)/);
    if (match) return { running: true, pid: match[1] };

    // 备选：tasklist + findstr
    const fallback = exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV /V 2>nul | findstr /I "openclaw"');
    if (fallback) {
      const pidMatch = fallback.match(/"node\.exe","(\d+)"/);
      if (pidMatch) return { running: true, pid: pidMatch[1] };
    }

    return { running: false };
  }

  // Unix: pgrep
  const result = exec("pgrep -f 'openclaw.*gateway'");
  if (result) {
    return { running: true, pid: result.split("\n")[0] };
  }
  return { running: false };
}

/**
 * 获取 OpenClaw 版本
 */
export function getOpenClawVersion(): string | null {
  if (!which("openclaw")) return null;
  const ver = exec("openclaw --version");
  return ver || null;
}

/**
 * 重启 Gateway
 */
export async function restartGateway(): Promise<boolean> {
  // 先停止
  stopGateway();
  // 等进程退出
  await new Promise((r) => setTimeout(r, 1500));

  // 后台启动
  try {
    if (isWin) {
      const child = spawn("openclaw", ["gateway", "--port", "18789"], {
        detached: true,
        stdio: "ignore",
        shell: true,
      });
      child.unref();
    } else {
      execSync("nohup openclaw gateway --port 18789 > /dev/null 2>&1 &", {
        stdio: "ignore",
        shell: "/bin/bash",
      });
    }

    // 等待启动
    await new Promise((r) => setTimeout(r, 2000));
    return isGatewayRunning().running;
  } catch {
    return false;
  }
}

/**
 * 启动 Gateway（如果未运行）
 */
export async function startGateway(): Promise<boolean> {
  const status = isGatewayRunning();
  if (status.running) return true;
  return restartGateway();
}

/**
 * 停止 Gateway
 */
export function stopGateway(): boolean {
  if (isWin) {
    const { pid } = isGatewayRunning();
    if (pid) {
      exec(`taskkill /F /PID ${pid}`);
      // 同时杀子进程
      exec(`taskkill /F /T /PID ${pid}`);
    }
  } else {
    exec("pkill -f 'openclaw.*gateway'");
  }
  return !isGatewayRunning().running;
}
