import type { ProviderTemplate } from "../types.js";

export const openrouter: ProviderTemplate = {
  id: "openrouter",
  name: "OpenRouter",
  nameZh: "OpenRouter",
  region: "global",
  category: "cloud",
  authType: "api-key",
  envVar: "OPENROUTER_API_KEY",
  baseUrl: "https://openrouter.ai/api/v1",
  apiCompat: "openai-completions",
  registration: "builtin",
  keyGuide: "去 https://openrouter.ai/keys 获取",
  docs: "https://openrouter.ai/docs",
  models: [
    { id: "anthropic/claude-sonnet-4-5", name: "Claude Sonnet 4.5 (via OpenRouter)", contextWindow: 200000, maxTokens: 16384 },
  ],
};
