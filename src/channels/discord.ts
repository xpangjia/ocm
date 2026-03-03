import type { ChannelTemplate } from "./types.js";

export const discordChannel: ChannelTemplate = {
  id: "discord",
  name: "Discord Bot",
  nameZh: "Discord Bot",
  fields: [
    {
      key: "botToken",
      label: "Bot Token",
      hint: "从 Discord Developer Portal 获取",
      required: true,
      secret: true,
    },
    {
      key: "guildId",
      label: "服务器 ID (Guild ID)",
      hint: "右键服务器 → 复制服务器 ID（需开启开发者模式）",
      placeholder: "123456789012345678",
      required: false,
      validate: (value) => {
        if (value && !/^\d{17,20}$/.test(value)) {
          return "Guild ID 应为 17-20 位数字";
        }
        return undefined;
      },
    },
  ],

  async validate(config) {
    const token = config.botToken;
    if (!token) return { ok: false, error: "未提供 Bot Token" };

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const resp = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bot ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latency = Date.now() - start;

      if (!resp.ok) {
        return { ok: false, error: "Bot Token 无效或已过期", latency };
      }

      const data = (await resp.json()) as { username?: string; id?: string };
      const botName = data.username ?? "Unknown";
      return {
        ok: true,
        info: `Bot 验证通过：${botName} (${data.id ?? ""})`,
        latency,
      };
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
      discord: {
        enabled: true,
        botToken: config.botToken,
      },
    };

    if (config.guildId) {
      (channelConfig.discord as Record<string, unknown>).guildId = config.guildId;
    }

    return { channels: channelConfig };
  },
};
