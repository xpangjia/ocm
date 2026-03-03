import { describe, it, expect } from "vitest";

/**
 * 测试 deepMerge 逻辑（OCM 的核心价值之一）
 * 直接复制 openclaw-config.ts 中的 deepMerge 和 isPlainObject 进行单测，
 * 避免依赖真实文件系统路径。
 */

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];
    if (isPlainObject(sourceVal) && isPlainObject(targetVal)) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      );
    } else {
      result[key] = sourceVal;
    }
  }
  return result;
}

describe("deepMerge", () => {
  it("should merge flat objects", () => {
    const result = deepMerge({ a: 1, b: 2 }, { b: 3, c: 4 });
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it("should deep merge nested objects", () => {
    const result = deepMerge(
      { agents: { defaults: { model: "old", timeout: 30 } } },
      { agents: { defaults: { model: "new" } } },
    );
    expect(result).toEqual({
      agents: { defaults: { model: "new", timeout: 30 } },
    });
  });

  it("should not lose existing fields", () => {
    const existing = {
      agents: {
        defaults: { model: "deepseek/deepseek-chat" },
        heartbeat: { enabled: true },
      },
      channels: { telegram: { enabled: true } },
    };

    const patch = {
      agents: {
        defaults: { model: "anthropic/claude-sonnet-4-5" },
      },
    };

    const result = deepMerge(existing, patch);

    // model 应该被更新
    expect((result.agents as Record<string, unknown>)).toBeDefined();
    const agents = result.agents as Record<string, unknown>;
    const defaults = agents.defaults as Record<string, unknown>;
    expect(defaults.model).toBe("anthropic/claude-sonnet-4-5");

    // heartbeat 不应该被丢失
    const heartbeat = agents.heartbeat as Record<string, unknown>;
    expect(heartbeat.enabled).toBe(true);

    // channels 不应该被丢失
    expect(result.channels).toBeDefined();
  });

  it("should overwrite arrays (not merge them)", () => {
    const result = deepMerge(
      { items: [1, 2, 3] },
      { items: [4, 5] },
    );
    expect(result.items).toEqual([4, 5]);
  });

  it("should handle empty source", () => {
    const target = { a: 1, b: { c: 2 } };
    const result = deepMerge(target, {});
    expect(result).toEqual(target);
  });

  it("should handle empty target", () => {
    const source = { a: 1, b: { c: 2 } };
    const result = deepMerge({}, source);
    expect(result).toEqual(source);
  });

  it("should handle null values in source", () => {
    const result = deepMerge({ a: 1, b: 2 }, { a: null } as Record<string, unknown>);
    expect(result.a).toBeNull();
    expect(result.b).toBe(2);
  });

  it("should handle deeply nested merge (3+ levels)", () => {
    const result = deepMerge(
      { a: { b: { c: { d: 1, e: 2 }, f: 3 } } },
      { a: { b: { c: { d: 10 } } } },
    );
    const a = result.a as Record<string, unknown>;
    const b = a.b as Record<string, unknown>;
    const c = b.c as Record<string, unknown>;
    expect(c.d).toBe(10);
    expect(c.e).toBe(2);
    expect(b.f).toBe(3);
  });
});

describe("isPlainObject", () => {
  it("should return true for plain objects", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it("should return false for arrays", () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject([1, 2])).toBe(false);
  });

  it("should return false for primitives", () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
    expect(isPlainObject(42)).toBe(false);
    expect(isPlainObject("string")).toBe(false);
    expect(isPlainObject(true)).toBe(false);
  });
});
