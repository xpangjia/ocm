import fs from "node:fs";
import { pc } from "../utils/ui.js";
import { exec, which } from "../utils/shell.js";
import { isGatewayRunning, getOpenClawVersion } from "../core/process.js";
import { getCurrentModel, readProviders, getOpenClawConfigPath } from "../core/ocm-config.js";
import { getProvider } from "../registry/index.js";
import { validateApiKey } from "../core/validator.js";

export async function doctorCommand(): Promise<void> {
  console.log();
  console.log(pc.bold("  环境诊断"));
  console.log();

  let hasIssue = false;

  // 系统
  check("系统", `${process.platform} ${process.arch}`, true);

  // Node.js
  const nodeVer = process.version;
  const nodeMajor = parseInt(nodeVer.slice(1));
  if (nodeMajor >= 22) {
    check("Node.js", nodeVer, true);
  } else {
    check("Node.js", `${nodeVer} (需要 ≥ 22)`, false);
    suggest("运行: fnm install 22 && fnm use 22");
    hasIssue = true;
  }

  // npm
  const npmVer = exec("npm --version");
  check("npm", npmVer || "未找到", !!npmVer);

  // OpenClaw
  const ocVer = getOpenClawVersion();
  if (ocVer) {
    check("OpenClaw", ocVer, true);
  } else {
    check("OpenClaw", "未安装", false);
    suggest("运行: npm install -g openclaw@latest");
    hasIssue = true;
  }

  // Gateway
  const gw = isGatewayRunning();
  if (gw.running) {
    check("Gateway", `运行中 (PID ${gw.pid})`, true);
  } else {
    check("Gateway", "未运行", false);
    suggest("运行: openclaw gateway 或 ocm restart");
    hasIssue = true;
  }

  // 配置文件
  const configPath = getOpenClawConfigPath();
  if (fs.existsSync(configPath)) {
    try {
      JSON.parse(fs.readFileSync(configPath, "utf-8"));
      check("openclaw.json", "语法正确", true);
    } catch {
      check("openclaw.json", "语法错误", false);
      suggest("运行: ocm config edit 修复配置文件");
      hasIssue = true;
    }
  } else {
    check("openclaw.json", "不存在", false);
    suggest("运行: ocm init 初始化配置");
    hasIssue = true;
  }

  // 当前模型连通性
  const current = getCurrentModel();
  const providers = readProviders();
  if (current.provider && providers.providers[current.provider]) {
    const provider = getProvider(current.provider);
    const config = providers.providers[current.provider];
    if (provider && config.apiKey && provider.baseUrl) {
      const result = await validateApiKey(provider, config.apiKey);
      if (result.ok) {
        check(`${current.provider} API`, `连通 ${result.latency ? `(${result.latency}ms)` : ""}`, true);
      } else {
        check(`${current.provider} API`, result.error ?? "连接失败", false);
        hasIssue = true;
      }
    }
  }

  // npm 镜像
  const registry = exec("npm config get registry");
  check("npm registry", registry || "默认", true);

  console.log();
  if (hasIssue) {
    console.log(`  ${pc.yellow("发现一些问题，请按上方建议修复")}`);
  } else {
    console.log(`  ${pc.green("一切正常！")}`);
  }
  console.log();
}

function check(label: string, value: string, ok: boolean): void {
  const icon = ok ? pc.green("✔") : pc.red("✘");
  const pad = label.padEnd(16);
  console.log(`  ${icon} ${pad}${value}`);
}

function suggest(msg: string): void {
  console.log(`    ${pc.dim("→")} ${pc.yellow(msg)}`);
}
