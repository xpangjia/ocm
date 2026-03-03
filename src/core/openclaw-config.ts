import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const OPENCLAW_DIR = path.join(os.homedir(), ".openclaw");
const CONFIG_PATH = path.join(OPENCLAW_DIR, "openclaw.json");

export function ensureOpenClawDir(): void {
  fs.mkdirSync(OPENCLAW_DIR, { recursive: true });
}

export function readOpenClawConfig(): Record<string, unknown> {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return {};
  }
}

export function writeOpenClawConfig(config: Record<string, unknown>): void {
  ensureOpenClawDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
}

/**
 * 安全更新 OpenClaw 配置：深度合并，不丢失未修改的字段。
 * 这是 OCM 的核心价值之一，解决 openclaw configure 覆盖 bug。
 */
export function safeConfigUpdate(patch: Record<string, unknown>): void {
  const current = readOpenClawConfig();
  const merged = deepMerge(current, patch);
  writeOpenClawConfig(merged);
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];
    if (
      isPlainObject(sourceVal) &&
      isPlainObject(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      );
    } else {
      result[key] = sourceVal;
    }
  }
  return result;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

/**
 * 为内置/隐式提供商设置环境变量（写入 shell profile）。
 */
export function setEnvVar(name: string, value: string): void {
  const envFile = path.join(OPENCLAW_DIR, ".env");
  let content = "";
  if (fs.existsSync(envFile)) {
    content = fs.readFileSync(envFile, "utf-8");
  }

  const regex = new RegExp(`^${name}=.*$`, "m");
  const line = `${name}=${value}`;

  if (regex.test(content)) {
    content = content.replace(regex, line);
  } else {
    content = content.trimEnd() + (content ? "\n" : "") + line + "\n";
  }

  ensureOpenClawDir();
  fs.writeFileSync(envFile, content);
}

/**
 * 设置 agents.defaults.model 为指定的 provider/model。
 */
export function setActiveModel(
  providerPrefix: string,
  modelId: string,
): void {
  safeConfigUpdate({
    agents: {
      defaults: {
        model: {
          primary: `${providerPrefix}/${modelId}`,
        },
      },
    },
  });
}

/**
 * 为自定义提供商添加 models.providers 配置段。
 */
export function addCustomProvider(
  id: string,
  config: {
    baseUrl: string;
    apiKey: string;
    api: string;
    models: Array<{ id: string; name: string; reasoning?: boolean; contextWindow?: number; maxTokens?: number }>;
  },
): void {
  const current = readOpenClawConfig();
  const models = (current.models ?? {}) as Record<string, unknown>;
  const providers = (models.providers ?? {}) as Record<string, unknown>;

  providers[id] = {
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    api: config.api,
    models: config.models,
  };

  safeConfigUpdate({
    models: {
      providers,
    },
  });
}

export { CONFIG_PATH as OPENCLAW_CONFIG_PATH, OPENCLAW_DIR };
