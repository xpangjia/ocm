import type { ProviderTemplate } from "../types.js";

export const google: ProviderTemplate = {
  id: "google",
  name: "Google Gemini",
  nameZh: "Google Gemini",
  region: "global",
  category: "cloud",
  authType: "api-key",
  envVar: "GEMINI_API_KEY",
  baseUrl: "",
  apiCompat: "openai-completions",
  registration: "builtin",
  keyGuide: "去 https://aistudio.google.com/apikey 获取",
  docs: "https://ai.google.dev/docs",
  models: [
    { id: "gemini-3-pro-preview", name: "Gemini 3 Pro", contextWindow: 1000000, maxTokens: 8192 },
  ],
};
