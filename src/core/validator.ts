import type { ProviderTemplate } from "../registry/types.js";
import { debug } from "../utils/logger.js";

/**
 * 验证 API Key 连通性，发送一个简单请求测试。
 */
export async function validateApiKey(
  provider: ProviderTemplate,
  apiKey: string,
  baseUrl?: string,
): Promise<{ ok: boolean; error?: string; latency?: number }> {
  const url = (baseUrl || provider.baseUrl || "").trim();
  if (!url) {
    // 内置提供商无法直接测试 base URL，跳过
    return { ok: true };
  }

  const start = Date.now();

  // 拼接完整请求 URL
  const endpoint = provider.apiCompat === "anthropic-messages"
    ? `${url}/messages`
    : `${url}/chat/completions`;

  const model = provider.models[0]?.id ?? "test";

  debug(`验证请求: POST ${endpoint}`);
  debug(`模型: ${model}`);
  debug(`API 兼容: ${provider.apiCompat}`);

  // 第一步：先测试基本连通性（简单 GET/HEAD）
  try {
    const connController = new AbortController();
    const connTimeout = setTimeout(() => connController.abort(), 5000);

    debug(`连通性测试: GET ${url}/models`);
    const connResp = await fetch(`${url}/models`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: connController.signal,
    });
    clearTimeout(connTimeout);

    debug(`连通性测试: HTTP ${connResp.status}`);
  } catch (e) {
    const latency = Date.now() - start;
    const msg = e instanceof Error ? e.message : String(e);
    debug(`连通性测试失败: ${msg}`);

    if (msg.includes("abort")) {
      return { ok: false, error: `无法连接到 ${url}（5秒超时）`, latency };
    }
    // 连接被拒绝等网络错误
    return { ok: false, error: `无法连接到 ${url}: ${msg}`, latency };
  }

  // 第二步：发真实 API 请求验证 Key
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (provider.apiCompat === "anthropic-messages") {
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
    } else {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const body = JSON.stringify({
      model,
      max_tokens: 1,
      messages: [{ role: "user", content: "hi" }],
    });

    debug(`发送验证请求: POST ${endpoint}`);

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

    debug(`验证响应: HTTP ${resp.status}`);

    // 401/403 = key 无效，其他状态码（包括 200、429 等）都说明 key 格式正确、服务可达
    if (resp.status === 401 || resp.status === 403) {
      return { ok: false, error: "API Key 无效或已过期", latency };
    }

    return { ok: true, latency };
  } catch (e) {
    const latency = Date.now() - start;
    const msg = e instanceof Error ? e.message : String(e);
    debug(`验证请求失败: ${msg}`);

    if (msg.includes("abort")) {
      return { ok: false, error: "连接超时（10秒）", latency };
    }
    return { ok: false, error: `连接失败: ${msg}`, latency };
  }
}
