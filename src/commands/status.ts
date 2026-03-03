import { pc } from "../utils/ui.js";
import { getCurrentModel, readProviders } from "../core/ocm-config.js";
import { isGatewayRunning, getOpenClawVersion } from "../core/process.js";
import { getProvider } from "../registry/index.js";

export function statusCommand(): void {
  const ocmVersion = "0.1.0";
  const ocVersion = getOpenClawVersion() ?? "未安装";
  const gateway = isGatewayRunning();
  const current = getCurrentModel();
  const providers = readProviders();

  console.log();
  console.log(`  ${pc.bold("OCM")} v${ocmVersion}  |  ${pc.bold("OpenClaw")} ${ocVersion}`);
  console.log();

  // Gateway 状态
  const gwStatus = gateway.running
    ? `${pc.green("运行中")} (PID ${gateway.pid})`
    : pc.red("未运行");
  console.log(`  Gateway:     ${gwStatus}`);

  // 当前模型
  if (current.provider) {
    const prov = getProvider(current.provider);
    console.log(`  模型:        ${current.provider}/${current.model}  ${pc.dim(prov?.nameZh ?? "")}`);
  } else {
    console.log(`  模型:        ${pc.dim("未配置")}`);
  }

  // Fallbacks
  if (providers.fallbacks.length > 0) {
    const fbStr = providers.fallbacks.map((f) => `${f.provider}/${f.model}`).join(" → ");
    console.log(`  Fallbacks:   ${fbStr}`);
  }

  // 已配置的提供商数
  const provCount = Object.keys(providers.providers).length;
  console.log(`  提供商:      ${provCount} 个已配置`);

  console.log();
}
