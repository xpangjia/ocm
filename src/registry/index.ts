import type { ProviderTemplate } from "./types.js";

// 国内直连
import { deepseek } from "./cn/deepseek.js";
import { zaiGlm } from "./cn/zai-glm.js";
import { moonshot } from "./cn/moonshot.js";
import { kimiCoding } from "./cn/kimi-coding.js";
import { minimax } from "./cn/minimax.js";
import { qwen } from "./cn/qwen.js";
import { bailian } from "./cn/bailian.js";
import { volcengine } from "./cn/volcengine.js";
import { xiaomi } from "./cn/xiaomi.js";

// 海外
import { anthropic } from "./global/anthropic.js";
import { openai } from "./global/openai.js";
import { google } from "./global/google.js";
import { openrouter } from "./global/openrouter.js";
import { xai } from "./global/xai.js";
import { groq } from "./global/groq.js";
import { mistral } from "./global/mistral.js";

// 本地
import { ollama } from "./local/ollama.js";
import { vllm } from "./local/vllm.js";
import { lmstudio } from "./local/lmstudio.js";

// 自定义
import { customOpenai, customAnthropic } from "./custom.js";

export const CN_PROVIDERS: ProviderTemplate[] = [
  deepseek, zaiGlm, moonshot, kimiCoding, minimax, qwen, bailian, volcengine, xiaomi,
];

export const GLOBAL_PROVIDERS: ProviderTemplate[] = [
  anthropic, openai, google, openrouter, xai, groq, mistral,
];

export const LOCAL_PROVIDERS: ProviderTemplate[] = [
  ollama, vllm, lmstudio,
];

export const CUSTOM_PROVIDERS: ProviderTemplate[] = [
  customOpenai, customAnthropic,
];

export const ALL_PROVIDERS: ProviderTemplate[] = [
  ...CN_PROVIDERS, ...GLOBAL_PROVIDERS, ...LOCAL_PROVIDERS, ...CUSTOM_PROVIDERS,
];

export function getProvider(id: string): ProviderTemplate | undefined {
  return ALL_PROVIDERS.find((p) => p.id === id);
}

export function getProvidersByRegion(region: "cn" | "global"): ProviderTemplate[] {
  return ALL_PROVIDERS.filter((p) => p.region === region && p.category === "cloud");
}

export function getLocalProviders(): ProviderTemplate[] {
  return LOCAL_PROVIDERS;
}

export type { ProviderTemplate, ModelTemplate } from "./types.js";
