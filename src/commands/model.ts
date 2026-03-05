import * as p from "@clack/prompts";
import { header, success, error, info, cancelled, isCancel, pc } from "../utils/ui.js";
import { readProviders, setCurrentModel, getCurrentModel, removeProvider as removeProviderConfig } from "../core/ocm-config.js";
import { setActiveModel, setEnvVar, addCustomProvider } from "../core/openclaw-config.js";
import { restartGateway } from "../core/process.js";
import { getProvider, CN_PROVIDERS, GLOBAL_PROVIDERS, LOCAL_PROVIDERS } from "../registry/index.js";
import { validateApiKey } from "../core/validator.js";
import { configureProvider, selectProvider } from "./init.js";
import type { ProviderTemplate } from "../registry/types.js";

export async function modelSwitch(targetProvider?: string): Promise<void> {
  const providers = readProviders();
  const configured = Object.keys(providers.providers);

  if (configured.length === 0) {
    error("还没有配置任何模型，请先运行 ocm model add");
    process.exit(1);
  }

  const current = getCurrentModel();

  // 快捷切换（非交互）
  if (targetProvider) {
    const providerKey = configured.find((k) => k === targetProvider || k.startsWith(targetProvider));
    if (!providerKey) {
      error(`未找到已配置的提供商: ${targetProvider}`);
      info(`已配置: ${configured.join(", ")}`);
      process.exit(1);
    }
    const config = providers.providers[providerKey];
    await doSwitch(providerKey, config.defaultModel, current);
    return;
  }

  // 交互式切换
  header();
  if (current.provider) {
    info(`当前模型: ${current.provider}/${current.model}`);
  }

  // 按国内/海外/本地分组
  const options: Array<{ value: string; label: string; hint?: string }> = [];

  const cnConfigured = configured.filter((id) => CN_PROVIDERS.some((p) => p.id === id));
  const globalConfigured = configured.filter((id) => GLOBAL_PROVIDERS.some((p) => p.id === id));
  const localConfigured = configured.filter((id) => LOCAL_PROVIDERS.some((p) => p.id === id));
  const otherConfigured = configured.filter(
    (id) => !cnConfigured.includes(id) && !globalConfigured.includes(id) && !localConfigured.includes(id),
  );

  if (cnConfigured.length > 0) {
    options.push({ value: "_cn", label: pc.bold("── 国内直连 ──") });
    for (const id of cnConfigured) {
      const prov = getProvider(id);
      const config = providers.providers[id];
      const isCurrent = current.provider === id;
      options.push({
        value: `${id}/${config.defaultModel}`,
        label: `${id}/${config.defaultModel}`,
        hint: `${prov?.nameZh ?? id}${isCurrent ? " (当前)" : ""}`,
      });
    }
  }

  if (globalConfigured.length > 0) {
    options.push({ value: "_global", label: pc.bold("── 海外 ──") });
    for (const id of globalConfigured) {
      const prov = getProvider(id);
      const config = providers.providers[id];
      const isCurrent = current.provider === id;
      options.push({
        value: `${id}/${config.defaultModel}`,
        label: `${id}/${config.defaultModel}`,
        hint: `${prov?.nameZh ?? id}${isCurrent ? " (当前)" : ""}`,
      });
    }
  }

  if (localConfigured.length > 0) {
    options.push({ value: "_local", label: pc.bold("── 本地 ──") });
    for (const id of localConfigured) {
      const prov = getProvider(id);
      const config = providers.providers[id];
      const isCurrent = current.provider === id;
      options.push({
        value: `${id}/${config.defaultModel}`,
        label: `${id}/${config.defaultModel}`,
        hint: `${prov?.nameZh ?? id}${isCurrent ? " (当前)" : ""}`,
      });
    }
  }

  for (const id of otherConfigured) {
    const config = providers.providers[id];
    const isCurrent = current.provider === id;
    options.push({
      value: `${id}/${config.defaultModel}`,
      label: `${id}/${config.defaultModel}`,
      hint: isCurrent ? "(当前)" : undefined,
    });
  }

  const choice = await p.select({
    message: "选择目标模型",
    options,
  });

  if (isCancel(choice)) return cancelled();
  const choiceStr = choice as string;
  if (choiceStr.startsWith("_")) {
    error("请选择一个具体的模型");
    process.exit(1);
  }

  const [providerId, modelId] = choiceStr.split("/");
  await doSwitch(providerId, modelId, current);
}

async function doSwitch(
  providerId: string,
  modelId: string,
  current: { provider: string; model: string },
): Promise<void> {
  if (current.provider === providerId && current.model === modelId) {
    info(`已经在使用 ${providerId}/${modelId}，无需切换`);
    return;
  }

  // 更新 OCM 配置
  setCurrentModel(providerId, modelId);

  // 更新 OpenClaw 配置
  setActiveModel(providerId, modelId);

  // 重启 Gateway
  const s = p.spinner();
  s.start("Gateway 重启中...");
  const ok = await restartGateway();
  if (ok) {
    s.stop("Gateway 已重启");
  } else {
    s.stop("Gateway 重启失败（配置已更新，请手动重启: openclaw gateway）");
  }

  success(`已切换到 ${providerId}/${modelId}`);
}

export async function modelAdd(): Promise<void> {
  header();

  const provider = await selectProvider("选择要添加的模型提供商");
  await configureProvider(provider);
}

export function modelList(): void {
  const providers = readProviders();
  const current = getCurrentModel();
  const configured = Object.entries(providers.providers);

  if (configured.length === 0) {
    info("还没有配置任何模型");
    info("运行 ocm model add 添加第一个模型");
    return;
  }

  console.log();
  console.log(pc.bold("  已配置的模型提供商:"));
  console.log();

  for (const [id, config] of configured) {
    const prov = getProvider(id);
    const isCurrent = current.provider === id;
    const marker = isCurrent ? pc.green("●") : pc.dim("○");
    const name = prov?.nameZh ?? id;
    const tag = isCurrent ? pc.green(" (当前)") : "";

    console.log(`  ${marker} ${id}/${config.defaultModel}  ${pc.dim(name)}${tag}`);
  }

  console.log();
  console.log(pc.dim(`  共 ${configured.length} 个提供商`));
  console.log();
}

export async function modelRemove(targetProvider?: string): Promise<void> {
  const providers = readProviders();
  const configured = Object.keys(providers.providers);

  if (configured.length === 0) {
    info("没有已配置的提供商");
    return;
  }

  let providerId = targetProvider;

  if (!providerId) {
    const choice = await p.select({
      message: "选择要移除的提供商",
      options: configured.map((id) => {
        const prov = getProvider(id);
        return { value: id, label: `${id} (${prov?.nameZh ?? ""})` };
      }),
    });
    if (isCancel(choice)) return cancelled();
    providerId = choice as string;
  }

  if (!configured.includes(providerId)) {
    error(`未找到: ${providerId}`);
    return;
  }

  const confirm = await p.confirm({
    message: `确认移除 ${providerId}？`,
  });
  if (isCancel(confirm) || !confirm) return;

  removeProviderConfig(providerId);
  success(`${providerId} 已移除`);
}

export function modelCurrent(): void {
  const current = getCurrentModel();
  if (!current.provider) {
    info("尚未配置模型，运行 ocm init 开始");
    return;
  }
  const prov = getProvider(current.provider);
  console.log(`  ${current.provider}/${current.model}  ${pc.dim(prov?.nameZh ?? "")}`);
}
