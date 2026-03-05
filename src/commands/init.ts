import * as p from "@clack/prompts";
import { header, success, error, info, cancelled, isCancel, pc } from "../utils/ui.js";
import { CN_PROVIDERS, GLOBAL_PROVIDERS, LOCAL_PROVIDERS, CUSTOM_PROVIDERS, getProvider } from "../registry/index.js";
import { validateApiKey } from "../core/validator.js";
import { addProvider, setCurrentModel, writeConfig, ensureOcmDir } from "../core/ocm-config.js";
import { setEnvVar, setActiveModel, addCustomProvider } from "../core/openclaw-config.js";
import { run, which, exec } from "../utils/shell.js";
import { startGateway, getOpenClawVersion } from "../core/process.js";
import { debug } from "../utils/logger.js";
import type { ProviderTemplate } from "../registry/types.js";

export async function initCommand(): Promise<void> {
  header();

  // 1. 环境检测
  info(`系统: ${process.platform} ${process.arch}`);
  info(`Node.js: ${process.version}`);

  const ocVer = getOpenClawVersion();
  if (ocVer) {
    info(`OpenClaw: ${ocVer} (已安装)`);
  }

  // 2. 安装 OpenClaw（如果没有）
  if (!which("openclaw")) {
    // 打印安装环境信息（便于诊断）
    const npmRegistry = exec("npm config get registry").trim();
    const npmPrefix = exec("npm prefix -g").trim();
    debug(`npm registry: ${npmRegistry}`);
    debug(`npm prefix -g: ${npmPrefix}`);
    debug(`PATH: ${process.env.PATH ?? ""}`);
    info(`npm 镜像源: ${npmRegistry}`);
    info(`npm 全局目录: ${npmPrefix}`);

    const s = p.spinner();
    s.start("正在安装 OpenClaw...");

    const result = await run("npm", ["install", "-g", "openclaw@latest"], { silent: true });
    if (result.code !== 0) {
      s.stop("OpenClaw 安装失败");
      error("安装失败，请检查网络连接");
      error("你可以手动运行: npm install -g openclaw@latest");
      if (result.stderr) error(result.stderr);
      process.exit(1);
    }

    const ver = getOpenClawVersion();
    s.stop(`OpenClaw ${ver ?? ""} 安装完成`);
  }

  // 3. 选择模型提供商
  const cnOptions = CN_PROVIDERS.filter((p) => p.models.length > 0 || p.authType === "api-key").map((p) => ({
    value: p.id,
    label: `${p.nameZh} (${p.name})`,
    hint: p.models.map((m) => m.id).join(", ") || undefined,
  }));

  const globalOptions = GLOBAL_PROVIDERS.map((p) => ({
    value: p.id,
    label: `${p.nameZh} (${p.name})`,
    hint: p.models.map((m) => m.id).join(", ") || undefined,
  }));

  const localOptions = LOCAL_PROVIDERS.filter((p) => p.models.length > 0).map((p) => ({
    value: p.id,
    label: p.nameZh,
    hint: p.models.map((m) => m.id).join(", ") || undefined,
  }));

  const customOptions = CUSTOM_PROVIDERS.map((p) => ({
    value: p.id,
    label: `${p.nameZh} (${p.name})`,
    hint: "自定义 Base URL + API Key",
  }));

  const providerId = await p.select({
    message: "选择 AI 模型提供商",
    options: [
      { value: "_cn_header", label: pc.bold("── 国内直连（推荐）──") },
      ...cnOptions,
      { value: "_global_header", label: pc.bold("── 海外 ──") },
      ...globalOptions,
      { value: "_local_header", label: pc.bold("── 本地 ──") },
      ...localOptions,
      { value: "_custom_header", label: pc.bold("── 自定义/中转站 ──") },
      ...customOptions,
    ],
  });

  if (isCancel(providerId)) return cancelled();
  if (typeof providerId === "string" && providerId.startsWith("_")) {
    error("请选择一个具体的提供商，而不是分类标题");
    process.exit(1);
  }

  const provider = getProvider(providerId as string);
  if (!provider) {
    error("未知的提供商");
    process.exit(1);
  }

  await configureProvider(provider);

  // 3.5 确认配置，不满意可以重新选择
  const confirmOk = await p.confirm({
    message: `已配置 ${provider.nameZh}，确认继续？（选 No 可重新选择提供商）`,
    initialValue: true,
  });

  if (isCancel(confirmOk)) return cancelled();
  if (!confirmOk) {
    info("重新选择提供商...");
    // 递归调用 init，重来一遍
    return initCommand();
  }

  // 4. 启动 Gateway
  const sg = p.spinner();
  sg.start("正在启动 Gateway...");
  const started = await startGateway();
  if (started) {
    sg.stop("Gateway 已启动");
  } else {
    sg.stop("Gateway 启动失败（可稍后手动启动: openclaw gateway）");
  }

  // 5. 完成
  p.note(
    [
      `${pc.bold("常用命令：")}`,
      `  ocm model switch   切换 AI 模型`,
      `  ocm model add      添加更多模型`,
      `  ocm channel add    添加聊天渠道`,
      `  ocm status         查看运行状态`,
      `  ocm doctor         诊断问题`,
    ].join("\n"),
    "安装完成！",
  );
}

export async function configureProvider(provider: ProviderTemplate): Promise<void> {
  let apiKey = "";

  // 自定义提供商（中转站）：需要额外输入 baseUrl 和模型名
  if (provider.id.startsWith("custom-")) {
    const baseUrlInput = await p.text({
      message: "请输入 API Base URL",
      placeholder: "例如: https://your-relay.example.com/v1",
      validate: (val) => {
        if (!val.trim()) return "Base URL 不能为空";
        if (!val.startsWith("http")) return "请输入完整 URL（以 http:// 或 https:// 开头）";
      },
    });
    if (isCancel(baseUrlInput)) return cancelled();
    provider = { ...provider, baseUrl: (baseUrlInput as string).replace(/\/+$/, "") };

    const modelInput = await p.text({
      message: "请输入模型名称",
      placeholder: "例如: gpt-4o, claude-sonnet-4-20250514",
      validate: (val) => {
        if (!val.trim()) return "模型名称不能为空";
      },
    });
    if (isCancel(modelInput)) return cancelled();
    const modelName = (modelInput as string).trim();
    provider = {
      ...provider,
      models: [{ id: modelName, name: modelName, reasoning: false }],
    };
  }

  // 获取 API Key（除非是 OAuth 或无需认证）
  if (provider.authType === "api-key") {
    const keyInput = await p.text({
      message: `请输入 ${provider.id.startsWith("custom-") ? "API Key" : `${provider.name} API Key`}`,
      placeholder: provider.keyGuide,
      validate: (val) => {
        if (!val.trim()) return "API Key 不能为空";
      },
    });

    if (isCancel(keyInput)) return cancelled();
    apiKey = keyInput as string;

    // 验证连通性
    if (provider.baseUrl) {
      const sv = p.spinner();
      sv.start("验证 API Key...");
      const result = await validateApiKey(provider, apiKey);
      if (result.ok) {
        sv.stop(`连接成功！${result.latency ? `(延迟 ${result.latency}ms)` : ""}`);
      } else {
        sv.stop(`验证失败: ${result.error}`);
        const continueAnyway = await p.confirm({
          message: "API Key 验证失败，是否继续配置？",
          initialValue: false,
        });
        if (isCancel(continueAnyway) || !continueAnyway) return cancelled();
      }
    }
  } else if (provider.authType === "oauth") {
    info(`${provider.name} 使用 OAuth 认证，OpenClaw 会在首次使用时引导你登录`);
  }

  // 选择默认模型
  let defaultModel = provider.models[0]?.id ?? "";
  if (provider.models.length > 1) {
    const modelChoice = await p.select({
      message: "选择默认模型",
      options: provider.models.map((m) => ({
        value: m.id,
        label: m.name,
        hint: m.reasoning ? "推理模型" : undefined,
      })),
    });
    if (isCancel(modelChoice)) return cancelled();
    defaultModel = modelChoice as string;
  }

  // 保存到 OCM 配置
  addProvider(provider.id, {
    apiKey,
    defaultModel,
    baseUrl: provider.baseUrl || undefined,
    addedAt: new Date().toISOString(),
  });
  setCurrentModel(provider.id, defaultModel);

  // 写入 OpenClaw 配置
  if (provider.registration === "builtin" || provider.registration === "implicit") {
    // 内置/隐式提供商：设环境变量 + model reference
    if (provider.envVar && apiKey) {
      setEnvVar(provider.envVar, apiKey);
    }
    setActiveModel(provider.id, defaultModel);
  } else {
    // 自定义提供商：写 models.providers
    if (provider.baseUrl && apiKey) {
      addCustomProvider(provider.id, {
        baseUrl: provider.baseUrl,
        apiKey: `\${${provider.envVar || provider.id.toUpperCase() + "_API_KEY"}}`,
        api: provider.apiCompat,
        models: provider.models,
      });
      if (provider.envVar) {
        setEnvVar(provider.envVar, apiKey);
      } else {
        setEnvVar(`${provider.id.toUpperCase()}_API_KEY`, apiKey);
      }
      setActiveModel(provider.id, defaultModel);
    }
  }

  success(`${provider.nameZh} 已配置！当前模型: ${provider.id}/${defaultModel}`);
}
