import * as p from "@clack/prompts";
import { success, error } from "../utils/ui.js";
import { restartGateway, stopGateway, isGatewayRunning } from "../core/process.js";

export async function restartCommand(): Promise<void> {
  const s = p.spinner();
  s.start("正在重启 Gateway...");
  const ok = await restartGateway();
  if (ok) {
    s.stop("Gateway 已重启");
    success("重启完成");
  } else {
    s.stop("重启失败");
    error("请检查 OpenClaw 是否正确安装: openclaw doctor");
  }
}

export function stopCommand(): void {
  const status = isGatewayRunning();
  if (!status.running) {
    error("Gateway 没有在运行");
    return;
  }
  stopGateway();
  success("Gateway 已停止");
}
