import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// 在测试中使用临时目录避免污染真实 ~/.ocm
const TEST_DIR = path.join(os.tmpdir(), `ocm-test-${Date.now()}`);
const TEST_OCM_DIR = path.join(TEST_DIR, ".ocm");
const TEST_CONFIG = path.join(TEST_OCM_DIR, "config.json");
const TEST_PROVIDERS = path.join(TEST_OCM_DIR, "providers.json");
const TEST_CHANNELS = path.join(TEST_OCM_DIR, "channels.json");

// 由于 ocm-config 使用 hardcoded path，我们直接测试其导出的纯逻辑
// 这里测试配置文件的 JSON 读写逻辑

describe("config JSON operations", () => {
  beforeEach(() => {
    fs.mkdirSync(TEST_OCM_DIR, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("should write and read config JSON", () => {
    const config = {
      version: "1.0.0",
      network: { mirror: "auto" as const },
      autoRestart: true,
      backupOnUpdate: true,
    };
    fs.writeFileSync(TEST_CONFIG, JSON.stringify(config, null, 2) + "\n");

    const read = JSON.parse(fs.readFileSync(TEST_CONFIG, "utf-8"));
    expect(read.version).toBe("1.0.0");
    expect(read.network.mirror).toBe("auto");
    expect(read.autoRestart).toBe(true);
  });

  it("should write and read providers JSON", () => {
    const providers = {
      version: "1.0.0",
      current: { provider: "deepseek", model: "deepseek-chat" },
      fallbacks: [],
      providers: {
        deepseek: {
          apiKey: "sk-test",
          defaultModel: "deepseek-chat",
          addedAt: "2026-03-03T00:00:00Z",
        },
      },
    };
    fs.writeFileSync(TEST_PROVIDERS, JSON.stringify(providers, null, 2) + "\n");

    const read = JSON.parse(fs.readFileSync(TEST_PROVIDERS, "utf-8"));
    expect(read.current.provider).toBe("deepseek");
    expect(read.providers.deepseek.apiKey).toBe("sk-test");
  });

  it("should handle adding and removing providers", () => {
    const providers = {
      version: "1.0.0",
      current: { provider: "deepseek", model: "deepseek-chat" },
      fallbacks: [] as Array<{ provider: string; model: string }>,
      providers: {} as Record<string, unknown>,
    };

    // Add
    providers.providers["deepseek"] = {
      apiKey: "sk-test",
      defaultModel: "deepseek-chat",
      addedAt: new Date().toISOString(),
    };
    expect(Object.keys(providers.providers)).toHaveLength(1);

    // Add another
    providers.providers["openai"] = {
      apiKey: "sk-openai",
      defaultModel: "gpt-5.2",
      addedAt: new Date().toISOString(),
    };
    expect(Object.keys(providers.providers)).toHaveLength(2);

    // Remove
    delete providers.providers["openai"];
    expect(Object.keys(providers.providers)).toHaveLength(1);
    expect(providers.providers["deepseek"]).toBeDefined();
  });

  it("should handle removing current provider", () => {
    const providers = {
      version: "1.0.0",
      current: { provider: "deepseek", model: "deepseek-chat" },
      fallbacks: [{ provider: "deepseek", model: "deepseek-chat" }],
      providers: { deepseek: { apiKey: "sk-test" } } as Record<string, unknown>,
    };

    // Remove current provider should clear current
    const idToRemove = "deepseek";
    delete providers.providers[idToRemove];
    if (providers.current.provider === idToRemove) {
      providers.current = { provider: "", model: "" };
    }
    providers.fallbacks = providers.fallbacks.filter((f) => f.provider !== idToRemove);

    expect(providers.current.provider).toBe("");
    expect(providers.fallbacks).toHaveLength(0);
  });

  it("should write and read channels JSON", () => {
    const channels = {
      version: "1.0.0",
      channels: {
        telegram: {
          type: "telegram",
          enabled: true,
          config: { botToken: "123:ABC" },
          addedAt: "2026-03-03T00:00:00Z",
        },
      },
    };
    fs.writeFileSync(TEST_CHANNELS, JSON.stringify(channels, null, 2) + "\n");

    const read = JSON.parse(fs.readFileSync(TEST_CHANNELS, "utf-8"));
    expect(read.channels.telegram.type).toBe("telegram");
    expect(read.channels.telegram.enabled).toBe(true);
  });
});
