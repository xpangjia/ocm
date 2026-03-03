import type { ChannelTemplate } from "./types.js";

export const feishuChannel: ChannelTemplate = {
  id: "feishu",
  name: "Feishu Bot",
  nameZh: "飞书机器人",
  fields: [
    {
      key: "appId",
      label: "App ID",
      hint: "从飞书开放平台获取",
      required: true,
    },
    {
      key: "appSecret",
      label: "App Secret",
      hint: "从飞书开放平台获取",
      required: true,
      secret: true,
    },
  ],

  async validate(config) {
    const { appId, appSecret } = config;
    if (!appId || !appSecret) {
      return { ok: false, error: "未提供 App ID 或 App Secret" };
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const resp = await fetch(
        "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
          signal: controller.signal,
        },
      );

      clearTimeout(timeout);
      const latency = Date.now() - start;

      if (!resp.ok) {
        return { ok: false, error: "飞书 API 请求失败", latency };
      }

      const data = (await resp.json()) as { code?: number; msg?: string };
      if (data.code === 0) {
        return { ok: true, info: "飞书应用验证通过", latency };
      }

      return {
        ok: false,
        error: `验证失败: ${data.msg ?? "未知错误"}`,
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
    return {
      channels: {
        feishu: {
          enabled: true,
          appId: config.appId,
          appSecret: config.appSecret,
        },
      },
    };
  },
};
