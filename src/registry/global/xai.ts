import type { ProviderTemplate } from "../types.js";

export const xai: ProviderTemplate = {
  id: "xai",
  name: "xAI",
  nameZh: "xAI Grok",
  region: "global",
  category: "cloud",
  authType: "api-key",
  envVar: "XAI_API_KEY",
  baseUrl: "https://api.x.ai/v1",
  apiCompat: "openai-completions",
  registration: "builtin",
  keyGuide: "去 https://console.x.ai/ 获取",
  models: [
    { id: "grok-3", name: "Grok 3", contextWindow: 131072, maxTokens: 8192 },
  ],
};
