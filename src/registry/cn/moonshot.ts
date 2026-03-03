import type { ProviderTemplate } from "../types.js";

export const moonshot: ProviderTemplate = {
  id: "moonshot",
  name: "Moonshot (Kimi)",
  nameZh: "月之暗面 Kimi",
  region: "cn",
  category: "cloud",
  authType: "api-key",
  envVar: "MOONSHOT_API_KEY",
  baseUrl: "https://api.moonshot.ai/v1",
  apiCompat: "openai-completions",
  registration: "implicit",
  keyGuide: "去 https://platform.moonshot.cn/console/api-keys 获取",
  docs: "https://platform.moonshot.cn/docs",
  models: [
    { id: "kimi-k2.5", name: "Kimi K2.5", contextWindow: 131072, maxTokens: 8192 },
    { id: "kimi-k2-thinking", name: "Kimi K2 Thinking", reasoning: true, contextWindow: 131072, maxTokens: 16384 },
  ],
};
