import type { ProviderTemplate } from "../types.js";

export const volcengine: ProviderTemplate = {
  id: "volcengine",
  name: "Volcano Engine",
  nameZh: "火山引擎 (豆包)",
  region: "cn",
  category: "cloud",
  authType: "api-key",
  envVar: "VOLCANO_ENGINE_API_KEY",
  baseUrl: "",
  apiCompat: "openai-completions",
  registration: "implicit",
  keyGuide: "去 https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey 获取",
  docs: "https://www.volcengine.com/docs/82379",
  models: [
    { id: "doubao-seed-1-8", name: "豆包 Seed 1.8", contextWindow: 128000, maxTokens: 8192 },
  ],
};
