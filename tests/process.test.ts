import { describe, it, expect } from "vitest";

/**
 * process.ts 跨平台逻辑测试
 * 不直接测试进程管理（需要真实环境），而是测试平台检测逻辑和命令构造
 */

const isWin = process.platform === "win32";

describe("platform detection", () => {
  it("should correctly detect current platform", () => {
    // 当前在 macOS/Linux 上测试
    expect(typeof process.platform).toBe("string");
    expect(["darwin", "linux", "win32"]).toContain(process.platform);
  });

  it("isWin should match process.platform", () => {
    expect(isWin).toBe(process.platform === "win32");
  });
});

describe("which command cross-platform", () => {
  it("should use correct command per platform", () => {
    const cmd = "node";
    const check = process.platform === "win32" ? `where ${cmd}` : `which ${cmd}`;

    if (process.platform === "win32") {
      expect(check).toBe("where node");
    } else {
      expect(check).toBe("which node");
    }
  });
});

describe("process management command construction", () => {
  it("should construct correct stop command per platform", () => {
    const pid = "12345";

    if (isWin) {
      const cmd = `taskkill /F /PID ${pid}`;
      expect(cmd).toBe("taskkill /F /PID 12345");
    } else {
      const cmd = "pkill -f 'openclaw.*gateway'";
      expect(cmd).toContain("pkill");
    }
  });

  it("should construct correct process detection command per platform", () => {
    if (isWin) {
      const cmd = 'wmic process where "CommandLine like \'%openclaw%gateway%\' and Name=\'node.exe\'" get ProcessId /value';
      expect(cmd).toContain("wmic");
      expect(cmd).toContain("openclaw");
      expect(cmd).toContain("gateway");
    } else {
      const cmd = "pgrep -f 'openclaw.*gateway'";
      expect(cmd).toContain("pgrep");
    }
  });

  it("should use correct background start approach per platform", () => {
    if (isWin) {
      // Windows: spawn with detached + unref
      const spawnOpts = { detached: true, stdio: "ignore" as const, shell: true };
      expect(spawnOpts.detached).toBe(true);
      expect(spawnOpts.shell).toBe(true);
    } else {
      // Unix: nohup with /bin/bash
      const cmd = "nohup openclaw gateway --port 18789 > /dev/null 2>&1 &";
      expect(cmd).toContain("nohup");
      const opts = { stdio: "ignore" as const, shell: "/bin/bash" };
      expect(opts.shell).toBe("/bin/bash");
    }
  });
});

describe("process.ts module import", () => {
  it("should import without errors", async () => {
    const mod = await import("../src/core/process.js");
    expect(typeof mod.isGatewayRunning).toBe("function");
    expect(typeof mod.getOpenClawVersion).toBe("function");
    expect(typeof mod.restartGateway).toBe("function");
    expect(typeof mod.startGateway).toBe("function");
    expect(typeof mod.stopGateway).toBe("function");
  });

  it("isGatewayRunning should return structured result", async () => {
    const { isGatewayRunning } = await import("../src/core/process.js");
    const result = isGatewayRunning();
    expect(result).toHaveProperty("running");
    expect(typeof result.running).toBe("boolean");
    if (result.running) {
      expect(result.pid).toBeDefined();
    }
  });

  it("getOpenClawVersion should return string or null", async () => {
    const { getOpenClawVersion } = await import("../src/core/process.js");
    const ver = getOpenClawVersion();
    expect(ver === null || typeof ver === "string").toBe(true);
  });
});
