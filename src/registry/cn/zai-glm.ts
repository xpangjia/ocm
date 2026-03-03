import type { ProviderTemplate } from "../types.js";

export const zaiGlm: ProviderTemplate = {
  id: "zai",
  name: "Z.AI (GLM)",
  nameZh: "智谱 GLM",
  region: "cn",
  category: "cloud",
  authType: "api-key",
  envVar: "ZAI_API_KEY",
  baseUrl: "",
  apiCompat: "openai-completions",
  registration: "builtin",
  keyGuide: "去 https://open.bigmodel.cn/usercenter/apikeys 获取",
  docs: "https://open.bigmodel.cn/dev/api",
  models: [
    { id: "glm-5", name: "GLM-5", contextWindow: 128000, maxTokens: 4096 },
  ],
};
