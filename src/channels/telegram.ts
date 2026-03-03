import type { ChannelTemplate } from "./types.js";

export const telegramChannel: ChannelTemplate = {
  id: "telegram",
  name: "Telegram Bot",
  nameZh: "Telegram Bot",
  fields: [
    {
      key: "botToken",
      label: "Bot Token",
      hint: "从 @BotFather 获取，格式：123456:ABC-DEF...",
      required: true,
      secret: true,
      validate: (value) => {
        if (!/^\d+:[A-Za-z0-9_-]{35,}$/.test(value)) {
          return "Token 格式不正确，应为 数字:字母数字 格式";
        }
        return undefined;
      },
    },
    {
      key: "allowFrom",
      label: "允许的用户 ID",
      hint: "Telegram 数字 ID，多个用逗号分隔（给 @userinfobot 发消息可获取）",
      placeholder: "123456789",
      required: false,
    },
  ],

  async validate(config) {
    const token = config.botToken;
    if (!token) return { ok: false, error: "未提供 Bot Token" };

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const resp = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latency = Date.now() - start;

      if (!resp.ok) {
        return { ok: false, error: "Bot Token 无效或已过期", latency };
      }

      const data = (await resp.json()) as {
        ok: boolean;
        result?: { username?: string; first_name?: string };
      };

      if (data.ok && data.result) {
        const botName = data.result.username
          ? `@${data.result.username}`
          : data.result.first_name ?? "Unknown";
        return {
          ok: true,
          info: `Bot 验证通过：${botName}`,
          latency,
        };
      }

      return { ok: false, error: "Bot Token 验证失败", latency };
    } catch (e) {
      const latency = Date.now() - start;
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("abort")) {
        return { ok: false, error: "连接超时（10秒）", latency };
      }
      return { ok: false, error: `连接失败: ${msg}`, latency };
    }
  },

  toOpenClawConfig(config) {
    const channelConfig: Record<string, unknown> = {
      telegram: {
        enabled: true,
        botToken: config.botToken,
      },
    };

    if (config.allowFrom) {
      const ids = config.allowFrom
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      (channelConfig.telegram as Record<string, unknown>).allowedUsers = ids;
    }

    return { channels: channelConfig };
  },
};
