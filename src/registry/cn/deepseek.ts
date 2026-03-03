import type { ProviderTemplate } from "../types.js";

export const deepseek: ProviderTemplate = {
  id: "deepseek",
  name: "DeepSeek",
  nameZh: "深度求索",
  region: "cn",
  category: "cloud",
  authType: "api-key",
  envVar: "DEEPSEEK_API_KEY",
  baseUrl: "https://api.deepseek.com/v1",
  apiCompat: "openai-completions",
  registration: "custom",
  keyGuide: "去 https://platform.deepseek.com/api_keys 获取",
  docs: "https://platform.deepseek.com/docs",
  models: [
    { id: "deepseek-chat", name: "DeepSeek V3", contextWindow: 128000, maxTokens: 8192 },
    { id: "deepseek-reasoner", name: "DeepSeek R1", reasoning: true, contextWindow: 128000, maxTokens: 65536 },
  ],
};
