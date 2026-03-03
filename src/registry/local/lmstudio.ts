import type { ProviderTemplate } from "../types.js";

export const lmstudio: ProviderTemplate = {
  id: "lmstudio",
  name: "LM Studio",
  nameZh: "LM Studio (本地)",
  region: "cn",
  category: "local",
  authType: "none",
  envVar: "",
  baseUrl: "http://localhost:1234/v1",
  apiCompat: "openai-completions",
  registration: "custom",
  keyGuide: "下载 LM Studio：https://lmstudio.ai/，加载模型后启动本地服务器",
  docs: "https://lmstudio.ai/docs",
  models: [],
};
