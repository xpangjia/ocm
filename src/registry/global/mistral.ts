import type { ProviderTemplate } from "../types.js";

export const mistral: ProviderTemplate = {
  id: "mistral",
  name: "Mistral",
  nameZh: "Mistral AI",
  region: "global",
  category: "cloud",
  authType: "api-key",
  envVar: "MISTRAL_API_KEY",
  baseUrl: "",
  apiCompat: "openai-completions",
  registration: "builtin",
  keyGuide: "去 https://console.mistral.ai/api-keys 获取",
  models: [
    { id: "mistral-large-latest", name: "Mistral Large", contextWindow: 128000, maxTokens: 8192 },
  ],
};
