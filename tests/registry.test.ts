import { describe, it, expect } from "vitest";
import {
  ALL_PROVIDERS,
  CN_PROVIDERS,
  GLOBAL_PROVIDERS,
  LOCAL_PROVIDERS,
  CUSTOM_PROVIDERS,
  getProvider,
  getProvidersByRegion,
  getLocalProviders,
} from "../src/registry/index.js";

describe("registry", () => {
  it("should have all provider groups", () => {
    expect(CN_PROVIDERS.length).toBe(9);
    expect(GLOBAL_PROVIDERS.length).toBe(7);
    expect(LOCAL_PROVIDERS.length).toBe(3);
    expect(CUSTOM_PROVIDERS.length).toBe(2);
    expect(ALL_PROVIDERS.length).toBe(21);
  });

  it("should have unique provider IDs", () => {
    const ids = ALL_PROVIDERS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every provider should have required fields", () => {
    for (const p of ALL_PROVIDERS) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.nameZh).toBeTruthy();
      expect(["cn", "global"]).toContain(p.region);
      expect(["cloud", "local"]).toContain(p.category);
      expect(["api-key", "oauth", "none"]).toContain(p.authType);
      expect(["openai-completions", "anthropic-messages", "ollama"]).toContain(p.apiCompat);
      expect(["builtin", "implicit", "custom"]).toContain(p.registration);
      expect(p.keyGuide).toBeTruthy();
    }
  });

  it("cloud providers should have models", () => {
    const cloudProviders = ALL_PROVIDERS.filter(
      (p) => p.category === "cloud" && !p.id.startsWith("custom-"),
    );
    for (const p of cloudProviders) {
      // 有些提供商如小米还没有列出具体模型
      if (p.id === "xiaomi") continue;
      expect(p.models.length).toBeGreaterThan(0);
    }
  });

  it("every model should have id and name", () => {
    for (const p of ALL_PROVIDERS) {
      for (const m of p.models) {
        expect(m.id).toBeTruthy();
        expect(m.name).toBeTruthy();
      }
    }
  });

  it("getProvider should find existing providers", () => {
    expect(getProvider("deepseek")).toBeDefined();
    expect(getProvider("deepseek")!.nameZh).toBe("深度求索");
    expect(getProvider("anthropic")).toBeDefined();
    expect(getProvider("ollama")).toBeDefined();
  });

  it("getProvider should return undefined for unknown", () => {
    expect(getProvider("nonexistent")).toBeUndefined();
  });

  it("getProvidersByRegion should filter correctly", () => {
    const cn = getProvidersByRegion("cn");
    expect(cn.length).toBeGreaterThanOrEqual(CN_PROVIDERS.length);
    for (const p of cn) {
      expect(p.region).toBe("cn");
      expect(p.category).toBe("cloud");
    }

    const global = getProvidersByRegion("global");
    // includes GLOBAL_PROVIDERS + CUSTOM_PROVIDERS with region "global"
    expect(global.length).toBeGreaterThanOrEqual(GLOBAL_PROVIDERS.length);
    for (const p of global) {
      expect(p.region).toBe("global");
      expect(p.category).toBe("cloud");
    }
  });

  it("getLocalProviders should return local providers", () => {
    const local = getLocalProviders();
    expect(local.length).toBe(3);
    for (const p of local) {
      expect(p.category).toBe("local");
    }
  });

  it("local providers should have baseUrl", () => {
    for (const p of LOCAL_PROVIDERS) {
      expect(p.baseUrl).toBeTruthy();
      expect(p.baseUrl).toMatch(/^http/);
    }
  });

  it("CN providers should have region cn", () => {
    for (const p of CN_PROVIDERS) {
      expect(p.region).toBe("cn");
    }
  });

  it("GLOBAL providers should have region global", () => {
    for (const p of GLOBAL_PROVIDERS) {
      expect(p.region).toBe("global");
    }
  });
});
