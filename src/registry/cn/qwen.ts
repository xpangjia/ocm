import type { ProviderTemplate } from "../types.js";

export const qwen: ProviderTemplate = {
  id: "qwen-portal",
  name: "Qwen Portal",
  nameZh: "阿里通义 Qwen",
  region: "cn",
  category: "cloud",
  authType: "oauth",
  envVar: "",
  baseUrl: "",
  apiCompat: "openai-completions",
  registration: "implicit",
  keyGuide: "使用 OAuth 登录阿里云账号，ocm 会引导你完成认证",
  docs: "https://help.aliyun.com/zh/model-studio/",
  models: [
    { id: "qwen3-max", name: "Qwen3 Max", contextWindow: 262144, maxTokens: 32768 },
  ],
};
