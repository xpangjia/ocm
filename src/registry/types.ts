export interface ProviderTemplate {
  id: string;
  name: string;
  nameZh: string;
  region: "cn" | "global";
  category: "cloud" | "local";
  authType: "api-key" | "oauth" | "none";
  envVar: string;
  baseUrl: string;
  apiCompat: "openai-completions" | "anthropic-messages" | "ollama";
  registration: "builtin" | "implicit" | "custom";
  models: ModelTemplate[];
  keyFormat?: RegExp;
  keyGuide: string;
  testEndpoint?: string;
  docs?: string;
}

export interface ModelTemplate {
  id: string;
  name: string;
  reasoning?: boolean;
  contextWindow?: number;
  maxTokens?: number;
  input?: string[];
}

export interface ProviderConfig {
  apiKey: string;
  defaultModel: string;
  baseUrl?: string;
  addedAt: string;
}

export interface OcmProviders {
  version: string;
  current: {
    provider: string;
    model: string;
  };
  fallbacks: Array<{ provider: string; model: string }>;
  providers: Record<string, ProviderConfig>;
}

export interface OcmConfig {
  version: string;
  network: {
    mirror: "auto" | "cn" | "global";
    npmRegistry?: string;
    githubProxy?: string;
  };
  autoRestart: boolean;
  backupOnUpdate: boolean;
}
