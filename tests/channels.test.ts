import { describe, it, expect } from "vitest";
import { ALL_CHANNELS, getChannel } from "../src/channels/index.js";

describe("channels", () => {
  it("should have 3 channels", () => {
    expect(ALL_CHANNELS.length).toBe(3);
  });

  it("should have unique channel IDs", () => {
    const ids = ALL_CHANNELS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every channel should have required fields", () => {
    for (const ch of ALL_CHANNELS) {
      expect(ch.id).toBeTruthy();
      expect(ch.name).toBeTruthy();
      expect(ch.nameZh).toBeTruthy();
      expect(ch.fields.length).toBeGreaterThan(0);
      expect(typeof ch.validate).toBe("function");
      expect(typeof ch.toOpenClawConfig).toBe("function");
    }
  });

  it("every channel field should have key and label", () => {
    for (const ch of ALL_CHANNELS) {
      for (const f of ch.fields) {
        expect(f.key).toBeTruthy();
        expect(f.label).toBeTruthy();
        expect(typeof f.required).toBe("boolean");
      }
    }
  });

  it("getChannel should find existing channels", () => {
    expect(getChannel("telegram")).toBeDefined();
    expect(getChannel("telegram")!.nameZh).toBeTruthy();
    expect(getChannel("discord")).toBeDefined();
    expect(getChannel("feishu")).toBeDefined();
  });

  it("getChannel should return undefined for unknown", () => {
    expect(getChannel("slack")).toBeUndefined();
  });

  it("telegram channel should have botToken field", () => {
    const tg = getChannel("telegram")!;
    const tokenField = tg.fields.find((f) => f.key === "botToken");
    expect(tokenField).toBeDefined();
    expect(tokenField!.required).toBe(true);
    expect(tokenField!.secret).toBe(true);
  });

  it("discord channel should have botToken field", () => {
    const dc = getChannel("discord")!;
    const tokenField = dc.fields.find((f) => f.key === "botToken");
    expect(tokenField).toBeDefined();
    expect(tokenField!.required).toBe(true);
    expect(tokenField!.secret).toBe(true);
  });

  it("feishu channel should have appId and appSecret", () => {
    const fs = getChannel("feishu")!;
    expect(fs.fields.find((f) => f.key === "appId")).toBeDefined();
    expect(fs.fields.find((f) => f.key === "appSecret")).toBeDefined();
  });

  it("toOpenClawConfig should return valid config", () => {
    const tg = getChannel("telegram")!;
    const config = tg.toOpenClawConfig({ botToken: "123:ABC", allowFrom: "111,222" });
    expect(config).toBeDefined();
    expect(typeof config).toBe("object");
  });
});
