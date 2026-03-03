import type { ProviderTemplate } from "./types.js";

export const customOpenai: ProviderTemplate = {
  id: "custom-openai",
  name: "Custom (OpenAI Compatible)",
  nameZh: "自定义 OpenAI 兼容",
  region: "global",
  category: "cloud",
  authType: "api-key",
  envVar: "",
  baseUrl: "",
  apiCompat: "openai-completions",
  registration: "custom",
  keyGuide: "填写你的自定义 OpenAI 兼容服务地址和 API Key",
  models: [],
};

export const customAnthropic: ProviderTemplate = {
  id: "custom-anthropic",
  name: "Custom (Anthropic Compatible)",
  nameZh: "自定义 Anthropic 兼容",
  region: "global",
  category: "cloud",
  authType: "api-key",
  envVar: "",
  baseUrl: "",
  apiCompat: "anthropic-messages",
  registration: "custom",
  keyGuide: "填写你的自定义 Anthropic 兼容服务地址和 API Key",
  models: [],
};
