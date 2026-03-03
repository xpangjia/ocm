import * as p from "@clack/prompts";
import { success, error, warn, info, pc } from "../utils/ui.js";
import { exec, run } from "../utils/shell.js";
import { getOpenClawVersion, restartGateway, isGatewayRunning } from "../core/process.js";
import { backupConfig, readConfig } from "../core/ocm-config.js";

export async function updateCommand(): Promise<void> {
  const currentVersion = getOpenClawVersion();
  if (!currentVersion) {
    error("OpenClaw 尚未安装，请先运行 ocm init");
    return;
  }

  info(`当前版本: ${pc.bold(currentVersion)}`);

  // 检查最新版本
  const s = p.spinner();
  s.start("正在检查最新版本...");
  const latest = exec("npm view openclaw version");
  if (!latest) {
    s.stop("检查失败");
    error("无法获取最新版本信息，请检查网络连接");
    return;
  }
  s.stop(`最新版本: ${pc.bold(latest)}`);

  if (currentVersion.includes(latest)) {
    success("已经是最新版本，无需更新");
    return;
  }

  // 更新前备份
  const config = readConfig();
  if (config.backupOnUpdate) {
    info("更新前自动备份配置...");
    const backupPath = backupConfig();
    info(`备份已保存: ${pc.dim(backupPath)}`);
  }

  // 执行更新
  s.start(`正在更新 OpenClaw ${currentVersion} → ${latest}...`);
  const result = await run("npm", ["install", "-g", "openclaw@latest"], { silent: true });
  if (result.code !== 0) {
    s.stop("更新失败");
    error(`更新失败: ${result.stderr}`);
    return;
  }
  s.stop("更新完成");

  // 重启 Gateway
  const gateway = isGatewayRunning();
  if (gateway.running) {
    if (config.autoRestart) {
      s.start("正在重启 Gateway...");
      const ok = await restartGateway();
      if (ok) {
        s.stop("Gateway 已重启");
      } else {
        s.stop("Gateway 重启失败");
        warn("请手动运行 ocm restart");
      }
    } else {
      warn("Gateway 正在运行，建议手动重启: ocm restart");
    }
  }

  success(`OpenClaw 已更新到 ${latest}`);
}
