import type { ChannelTemplate } from "./types.js";
import { telegramChannel } from "./telegram.js";
import { discordChannel } from "./discord.js";
import { feishuChannel } from "./feishu.js";

export const ALL_CHANNELS: ChannelTemplate[] = [
  telegramChannel,
  discordChannel,
  feishuChannel,
];

export function getChannel(id: string): ChannelTemplate | undefined {
  return ALL_CHANNELS.find((c) => c.id === id);
}

export { telegramChannel, discordChannel, feishuChannel };
export type { ChannelTemplate, ChannelConfig, ChannelValidationResult } from "./types.js";
