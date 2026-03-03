import type { ProviderTemplate } from "../types.js";

export const ollama: ProviderTemplate = {
  id: "ollama",
  name: "Ollama",
  nameZh: "Ollama (本地)",
  region: "cn",
  category: "local",
  authType: "none",
  envVar: "",
  baseUrl: "http://127.0.0.1:11434/v1",
  apiCompat: "ollama",
  registration: "builtin",
  keyGuide: "先安装 Ollama：https://ollama.com/download，然后 ollama pull llama3.3",
  docs: "https://ollama.com/",
  models: [
    { id: "llama3.3", name: "Llama 3.3 (本地)" },
    { id: "qwen2.5-coder", name: "Qwen 2.5 Coder (本地)" },
  ],
};
