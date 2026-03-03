import fs from "node:fs";
import path from "node:path";
import { success, error, info, pc } from "../utils/ui.js";
import {
  backupConfig,
  BACKUPS_DIR,
  ensureOcmDir,
  CONFIG_PATH,
  PROVIDERS_PATH,
  getOpenClawConfigPath,
} from "../core/ocm-config.js";

export function backupCommand(): void {
  const backupPath = backupConfig();
  success(`备份完成: ${pc.dim(backupPath)}`);
}

export function backupListCommand(): void {
  ensureOcmDir();
  if (!fs.existsSync(BACKUPS_DIR)) {
    info("暂无备份记录");
    return;
  }

  const files = fs
    .readdirSync(BACKUPS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) {
    info("暂无备份记录");
    return;
  }

  console.log();
  console.log(`  ${pc.bold("备份列表")} (${files.length} 个)`);
  console.log();
  for (let i = 0; i < files.length; i++) {
    const name = files[i];
    const filePath = path.join(BACKUPS_DIR, name);
    const stat = fs.statSync(filePath);
    const size = (stat.size / 1024).toFixed(1);
    const ts = name.replace(".json", "").replace(/T/, " ").replace(/-/g, (m, offset) => offset > 9 ? ":" : "-");
    console.log(`  ${pc.dim(`[${i}]`)} ${ts}  ${pc.dim(`${size} KB`)}`);
  }
  console.log();
}

export function backupRestoreCommand(id: string): void {
  ensureOcmDir();
  if (!fs.existsSync(BACKUPS_DIR)) {
    error("暂无备份记录");
    return;
  }

  const files = fs
    .readdirSync(BACKUPS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();

  const index = parseInt(id, 10);
  const targetFile = Number.isNaN(index) ? files.find((f) => f.includes(id)) : files[index];

  if (!targetFile) {
    error(`找不到备份: ${id}`);
    info("使用 ocm backup list 查看可用的备份");
    return;
  }

  const backupPath = path.join(BACKUPS_DIR, targetFile);
  let snapshot: Record<string, unknown>;
  try {
    snapshot = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
  } catch {
    error("备份文件损坏，无法恢复");
    return;
  }

  // 恢复前先做一次当前状态的备份
  const safeBackup = backupConfig();
  info(`已备份当前配置: ${pc.dim(safeBackup)}`);

  // 恢复 OCM config
  if (snapshot.config) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(snapshot.config, null, 2) + "\n");
  }

  // 恢复 providers
  if (snapshot.providers) {
    fs.writeFileSync(PROVIDERS_PATH, JSON.stringify(snapshot.providers, null, 2) + "\n");
  }

  // 恢复 openclaw.json
  if (snapshot.openclaw) {
    const ocPath = getOpenClawConfigPath();
    const ocDir = path.dirname(ocPath);
    fs.mkdirSync(ocDir, { recursive: true });
    fs.writeFileSync(ocPath, JSON.stringify(snapshot.openclaw, null, 2) + "\n");
  }

  success(`已从备份恢复: ${targetFile}`);
}
