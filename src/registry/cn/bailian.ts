import type { ProviderTemplate } from "../types.js";

export const bailian: ProviderTemplate = {
  id: "bailian",
  name: "Bailian Coding Plan",
  nameZh: "百炼 Coding Plan",
  region: "cn",
  category: "cloud",
  authType: "api-key",
  envVar: "DASHSCOPE_API_KEY",
  baseUrl: "https://coding.dashscope.aliyuncs.com/v1",
  apiCompat: "openai-completions",
  registration: "custom",
  keyGuide: "去 https://bailian.console.aliyun.com/ 开通 Coding Plan 并获取 API Key",
  docs: "https://help.aliyun.com/zh/model-studio/",
  models: [
    { id: "qwen3.5-plus", name: "Qwen 3.5 Plus (百炼)", contextWindow: 131072, maxTokens: 16384 },
  ],
};
