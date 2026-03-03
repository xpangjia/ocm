import type { ProviderTemplate } from "../types.js";

export const groq: ProviderTemplate = {
  id: "groq",
  name: "Groq",
  nameZh: "Groq",
  region: "global",
  category: "cloud",
  authType: "api-key",
  envVar: "GROQ_API_KEY",
  baseUrl: "",
  apiCompat: "openai-completions",
  registration: "builtin",
  keyGuide: "去 https://console.groq.com/keys 获取",
  models: [
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B (Groq)", contextWindow: 131072, maxTokens: 8192 },
  ],
};
