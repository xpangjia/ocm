import * as p from "@clack/prompts";
import { header, success, error, info, cancelled, isCancel, pc } from "../utils/ui.js";
import { addChannel, removeChannel, getConfiguredChannels } from "../core/ocm-config.js";
import { safeConfigUpdate, readOpenClawConfig } from "../core/openclaw-config.js";
import { restartGateway } from "../core/process.js";
import { ALL_CHANNELS, getChannel } from "../channels/index.js";
import type { ChannelTemplate } from "../channels/types.js";

/**
 * ocm channel add — 交互式添加渠道
 */
export async function channelAdd(): Promise<void> {
  header();

  const channelId = await p.select({
    message: "选择渠道类型",
    options: ALL_CHANNELS.map((ch) => ({
      value: ch.id,
      label: ch.nameZh,
      hint: ch.name,
    })),
  });

  if (isCancel(channelId)) return cancelled();

  const channel = getChannel(channelId as string);
  if (!channel) {
    error("未知的渠道类型");
    process.exit(1);
  }

  // 检查是否已配置
  const existing = getConfiguredChannels();
  if (existing[channel.id]) {
    const overwrite = await p.confirm({
      message: `${channel.nameZh} 已配置，是否覆盖？`,
    });
    if (isCancel(overwrite) || !overwrite) return cancelled();
  }

  await configureChannel(channel);
}

/**
 * 交互式配置一个渠道（收集字段、验证、写入配置）
 */
export async function configureChannel(channel: ChannelTemplate): Promise<void> {
  const config: Record<string, string> = {};

  // 收集所有字段
  for (const field of channel.fields) {
    if (field.secret) {
      const value = await p.password({
        message: field.label,
        ...(field.hint ? { message: `${field.label}\n${pc.dim(`  ${field.hint}`)}` } : {}),
        validate: (val) => {
          if (field.required && !val) return "此项必填";
          if (val && field.validate) return field.validate(val);
          return undefined;
        },
      });

      if (isCancel(value)) return cancelled();
      config[field.key] = value;
    } else {
      const value = await p.text({
        message: field.label,
        ...(field.hint ? { message: `${field.label}\n${pc.dim(`  ${field.hint}`)}` } : {}),
        placeholder: field.placeholder,
        validate: (val) => {
          if (field.required && !val) return "此项必填";
          if (val && field.validate) return field.validate(val);
          return undefined;
        },
      });

      if (isCancel(value)) return cancelled();
      config[field.key] = value;
    }
  }

  // 验证配置
  const s = p.spinner();
  s.start(`验证 ${channel.nameZh} 配置...`);

  const result = await channel.validate(config);

  if (!result.ok) {
    s.stop(`验证失败: ${result.error}`);
    error(result.error ?? "验证失败");
    process.exit(1);
  }

  s.stop(result.info ?? `${channel.nameZh} 验证通过`);

  // 写入 OpenClaw 配置
  const openclawPatch = channel.toOpenClawConfig(config);
  safeConfigUpdate(openclawPatch);

  // 写入 OCM 渠道记录
  addChannel(channel.id, {
    type: channel.id,
    enabled: true,
    config,
    addedAt: new Date().toISOString(),
  });

  // 重启 Gateway
  const restartSpinner = p.spinner();
  restartSpinner.start("Gateway 重启中...");
  const ok = await restartGateway();
  if (ok) {
    restartSpinner.stop("Gateway 已重启");
  } else {
    restartSpinner.stop("Gateway 重启失败（配置已更新，请手动重启: openclaw gateway）");
  }

  success(`${channel.nameZh} 渠道已添加`);
}

/**
 * ocm channel remove — 移除渠道
 */
export async function channelRemove(targetType?: string): Promise<void> {
  const configured = getConfiguredChannels();
  const channelIds = Object.keys(configured);

  if (channelIds.length === 0) {
    info("没有已配置的渠道");
    return;
  }

  let channelId = targetType;

  if (!channelId) {
    header();
    const choice = await p.select({
      message: "选择要移除的渠道",
      options: channelIds.map((id) => {
        const ch = getChannel(id);
        return { value: id, label: ch?.nameZh ?? id };
      }),
    });
    if (isCancel(choice)) return cancelled();
    channelId = choice as string;
  }

  if (!configured[channelId]) {
    error(`未找到已配置的渠道: ${channelId}`);
    info(`已配置: ${channelIds.join(", ")}`);
    return;
  }

  const confirm = await p.confirm({
    message: `确认移除 ${getChannel(channelId)?.nameZh ?? channelId}？`,
  });
  if (isCancel(confirm) || !confirm) return;

  // 从 OCM 记录中移除
  removeChannel(channelId);

  // 从 OpenClaw 配置中禁用
  safeConfigUpdate({
    channels: {
      [channelId]: { enabled: false },
    },
  });

  // 重启 Gateway
  const s = p.spinner();
  s.start("Gateway 重启中...");
  const ok = await restartGateway();
  if (ok) {
    s.stop("Gateway 已重启");
  } else {
    s.stop("Gateway 重启失败（请手动重启: openclaw gateway）");
  }

  success(`${getChannel(channelId)?.nameZh ?? channelId} 已移除`);
}

/**
 * ocm channel list — 列出已配置的渠道
 */
export function channelList(): void {
  const configured = getConfiguredChannels();
  const channelIds = Object.entries(configured);

  if (channelIds.length === 0) {
    info("还没有配置任何渠道");
    info("运行 ocm channel add 添加第一个渠道");
    return;
  }

  console.log();
  console.log(pc.bold("  已配置的渠道:"));
  console.log();

  for (const [id, config] of channelIds) {
    const ch = getChannel(id);
    const marker = config.enabled ? pc.green("●") : pc.red("○");
    const status = config.enabled ? pc.green("已启用") : pc.red("已禁用");
    const name = ch?.nameZh ?? id;

    console.log(`  ${marker} ${name}  ${pc.dim(status)}`);
  }

  console.log();
  console.log(pc.dim(`  共 ${channelIds.length} 个渠道`));
  console.log();
}
