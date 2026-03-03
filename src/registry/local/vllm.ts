import type { ProviderTemplate } from "../types.js";

export const vllm: ProviderTemplate = {
  id: "vllm",
  name: "vLLM",
  nameZh: "vLLM (本地)",
  region: "cn",
  category: "local",
  authType: "none",
  envVar: "",
  baseUrl: "http://127.0.0.1:8000/v1",
  apiCompat: "openai-completions",
  registration: "custom",
  keyGuide: "先安装 vLLM：pip install vllm，然后启动服务",
  docs: "https://docs.vllm.ai/",
  models: [],
};
