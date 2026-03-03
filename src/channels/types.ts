/**
 * 渠道配置模板类型定义
 */

export interface ChannelTemplate {
  id: string;
  name: string;
  nameZh: string;
  fields: ChannelField[];
  /** 验证渠道配置有效性（如 Token 校验） */
  validate: (config: Record<string, string>) => Promise<ChannelValidationResult>;
  /** 将渠道配置转换为 OpenClaw 配置片段 */
  toOpenClawConfig: (config: Record<string, string>) => Record<string, unknown>;
}

export interface ChannelField {
  key: string;
  label: string;
  hint?: string;
  placeholder?: string;
  required: boolean;
  secret?: boolean;
  validate?: (value: string) => string | undefined;
}

export interface ChannelValidationResult {
  ok: boolean;
  error?: string;
  info?: string;
  latency?: number;
}

export interface ChannelConfig {
  type: string;
  enabled: boolean;
  config: Record<string, string>;
  addedAt: string;
}
