import type { ProviderTemplate } from "../types.js";

export const minimax: ProviderTemplate = {
  id: "minimax",
  name: "MiniMax",
  nameZh: "MiniMax",
  region: "cn",
  category: "cloud",
  authType: "api-key",
  envVar: "MINIMAX_API_KEY",
  baseUrl: "",
  apiCompat: "anthropic-messages",
  registration: "implicit",
  keyGuide: "去 https://platform.minimaxi.com/user-center/basic-information/interface-key 获取",
  docs: "https://platform.minimaxi.com/document",
  models: [
    { id: "abab6.5s-chat", name: "MiniMax ABAB 6.5s", contextWindow: 245760, maxTokens: 8192 },
  ],
};
