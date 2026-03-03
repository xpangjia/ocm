import type { ProviderTemplate } from "../types.js";

export const xiaomi: ProviderTemplate = {
  id: "xiaomi",
  name: "Xiaomi MiMo",
  nameZh: "小米 MiMo",
  region: "cn",
  category: "cloud",
  authType: "api-key",
  envVar: "XIAOMI_API_KEY",
  baseUrl: "",
  apiCompat: "anthropic-messages",
  registration: "implicit",
  keyGuide: "去小米开放平台获取 API Key",
  models: [],
};
