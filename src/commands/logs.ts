import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { error, info, pc } from "../utils/ui.js";
import { isGatewayRunning } from "../core/process.js";

const OPENCLAW_LOG_DIR = path.join(os.homedir(), ".openclaw", "logs");

export function logsCommand(options: { tail?: string }): void {
  const tailCount = options.tail ? parseInt(options.tail, 10) : 50;

  // 检查 Gateway 状态
  const gateway = isGatewayRunning();
  if (gateway.running) {
    info(`Gateway 运行中 (PID ${gateway.pid})`);
  } else {
    info(pc.dim("Gateway 未运行"));
  }

  // 查找日志文件
  if (!fs.existsSync(OPENCLAW_LOG_DIR)) {
    error("未找到日志目录: ~/.openclaw/logs/");
    info("Gateway 可能尚未启动过，或日志目录不在默认位置");
    return;
  }

  const logFiles = fs
    .readdirSync(OPENCLAW_LOG_DIR)
    .filter((f) => f.endsWith(".log"))
    .sort()
    .reverse();

  if (logFiles.length === 0) {
    info("日志目录为空");
    return;
  }

  // 读取最新的日志文件
  const latestLog = path.join(OPENCLAW_LOG_DIR, logFiles[0]);
  info(`日志文件: ${pc.dim(latestLog)}`);
  console.log();

  const content = fs.readFileSync(latestLog, "utf-8");
  const lines = content.split("\n");
  const start = Math.max(0, lines.length - tailCount);
  const tail = lines.slice(start);

  for (const line of tail) {
    if (!line) continue;
    // 简单高亮 error/warn
    if (/error/i.test(line)) {
      console.log(`  ${pc.red(line)}`);
    } else if (/warn/i.test(line)) {
      console.log(`  ${pc.yellow(line)}`);
    } else {
      console.log(`  ${line}`);
    }
  }
  console.log();
}
