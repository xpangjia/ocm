import type { ProviderTemplate } from "../types.js";

export const anthropic: ProviderTemplate = {
  id: "anthropic",
  name: "Anthropic",
  nameZh: "Anthropic Claude",
  region: "global",
  category: "cloud",
  authType: "api-key",
  envVar: "ANTHROPIC_API_KEY",
  baseUrl: "",
  apiCompat: "anthropic-messages",
  registration: "builtin",
  keyGuide: "去 https://console.anthropic.com/settings/keys 获取",
  docs: "https://docs.anthropic.com/",
  models: [
    { id: "claude-opus-4-6", name: "Claude Opus 4.6", contextWindow: 200000, maxTokens: 32000 },
    { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", contextWindow: 200000, maxTokens: 16384 },
  ],
};
