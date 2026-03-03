import type { ProviderTemplate } from "../types.js";

export const openai: ProviderTemplate = {
  id: "openai",
  name: "OpenAI",
  nameZh: "OpenAI",
  region: "global",
  category: "cloud",
  authType: "api-key",
  envVar: "OPENAI_API_KEY",
  baseUrl: "",
  apiCompat: "openai-completions",
  registration: "builtin",
  keyGuide: "去 https://platform.openai.com/api-keys 获取",
  docs: "https://platform.openai.com/docs",
  models: [
    { id: "gpt-5.2", name: "GPT-5.2", contextWindow: 128000, maxTokens: 16384 },
    { id: "gpt-5.1-codex", name: "GPT-5.1 Codex", contextWindow: 200000, maxTokens: 16384 },
  ],
};
