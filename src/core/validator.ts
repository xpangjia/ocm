import type { ProviderTemplate } from "../registry/types.js";

/**
 * 验证 API Key 连通性，发送一个简单请求测试。
 */
export async function validateApiKey(
  provider: ProviderTemplate,
  apiKey: string,
  baseUrl?: string,
): Promise<{ ok: boolean; error?: string; latency?: number }> {
  const url = baseUrl || provider.baseUrl;
  if (!url) {
    // 内置提供商无法直接测试 base URL，跳过
    return { ok: true };
  }

  const start = Date.now();

  try {
    const endpoint = provider.apiCompat === "anthropic-messages"
      ? `${url}/messages`
      : `${url}/chat/completions`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (provider.apiCompat === "anthropic-messages") {
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
    } else {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    // 发一个最小请求来验证 key
    const body = provider.apiCompat === "anthropic-messages"
      ? JSON.stringify({
          model: provider.models[0]?.id ?? "test",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        })
      : JSON.stringify({
          model: provider.models[0]?.id ?? "test",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch(endpoint, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latency = Date.now() - start;

    // 401/403 = key 无效，其他状态码（包括 200、429 等）都说明 key 格式正确、服务可达
    if (resp.status === 401 || resp.status === 403) {
      return { ok: false, error: "API Key 无效或已过期", latency };
    }

    return { ok: true, latency };
  } catch (e) {
    const latency = Date.now() - start;
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("abort")) {
      return { ok: false, error: "连接超时（10秒）", latency };
    }
    return { ok: false, error: `连接失败: ${msg}`, latency };
  }
}
