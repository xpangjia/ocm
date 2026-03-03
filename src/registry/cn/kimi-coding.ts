import type { ProviderTemplate } from "../types.js";

export const kimiCoding: ProviderTemplate = {
  id: "kimi-coding",
  name: "Kimi Coding",
  nameZh: "Kimi 编程版",
  region: "cn",
  category: "cloud",
  authType: "api-key",
  envVar: "KIMI_API_KEY",
  baseUrl: "",
  apiCompat: "anthropic-messages",
  registration: "implicit",
  keyGuide: "去 https://platform.moonshot.cn/console/api-keys 获取",
  models: [
    { id: "k2p5", name: "Kimi K2.5 Coding", contextWindow: 131072, maxTokens: 8192 },
  ],
};
