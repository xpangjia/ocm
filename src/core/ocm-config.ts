import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { OcmConfig, OcmProviders, ProviderConfig } from "../registry/types.js";
import type { ChannelConfig } from "../channels/types.js";

const OCM_DIR = path.join(os.homedir(), ".ocm");
const CONFIG_PATH = path.join(OCM_DIR, "config.json");
const PROVIDERS_PATH = path.join(OCM_DIR, "providers.json");
const CHANNELS_PATH = path.join(OCM_DIR, "channels.json");
const BACKUPS_DIR = path.join(OCM_DIR, "backups");

export function ensureOcmDir(): void {
  fs.mkdirSync(OCM_DIR, { recursive: true });
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// ── OCM config ──

function defaultConfig(): OcmConfig {
  return {
    version: "1.0.0",
    network: { mirror: "auto" },
    autoRestart: true,
    backupOnUpdate: true,
  };
}

export function readConfig(): OcmConfig {
  if (!fs.existsSync(CONFIG_PATH)) return defaultConfig();
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return defaultConfig();
  }
}

export function writeConfig(config: OcmConfig): void {
  ensureOcmDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
}

// ── Providers ──

function defaultProviders(): OcmProviders {
  return {
    version: "1.0.0",
    current: { provider: "", model: "" },
    fallbacks: [],
    providers: {},
  };
}

export function readProviders(): OcmProviders {
  if (!fs.existsSync(PROVIDERS_PATH)) return defaultProviders();
  try {
    return JSON.parse(fs.readFileSync(PROVIDERS_PATH, "utf-8"));
  } catch {
    return defaultProviders();
  }
}

export function writeProviders(providers: OcmProviders): void {
  ensureOcmDir();
  fs.writeFileSync(PROVIDERS_PATH, JSON.stringify(providers, null, 2) + "\n");
}

export function addProvider(
  id: string,
  config: ProviderConfig,
): void {
  const providers = readProviders();
  providers.providers[id] = config;
  writeProviders(providers);
}

export function removeProvider(id: string): void {
  const providers = readProviders();
  delete providers.providers[id];
  if (providers.current.provider === id) {
    providers.current = { provider: "", model: "" };
  }
  providers.fallbacks = providers.fallbacks.filter((f) => f.provider !== id);
  writeProviders(providers);
}

export function setCurrentModel(provider: string, model: string): void {
  const providers = readProviders();
  providers.current = { provider, model };
  writeProviders(providers);
}

export function getCurrentModel(): { provider: string; model: string } {
  return readProviders().current;
}

// ── Channels ──

export interface OcmChannels {
  version: string;
  channels: Record<string, ChannelConfig>;
}

function defaultChannels(): OcmChannels {
  return {
    version: "1.0.0",
    channels: {},
  };
}

export function readChannels(): OcmChannels {
  if (!fs.existsSync(CHANNELS_PATH)) return defaultChannels();
  try {
    return JSON.parse(fs.readFileSync(CHANNELS_PATH, "utf-8"));
  } catch {
    return defaultChannels();
  }
}

export function writeChannels(channels: OcmChannels): void {
  ensureOcmDir();
  fs.writeFileSync(CHANNELS_PATH, JSON.stringify(channels, null, 2) + "\n");
}

export function addChannel(id: string, config: ChannelConfig): void {
  const channels = readChannels();
  channels.channels[id] = config;
  writeChannels(channels);
}

export function removeChannel(id: string): void {
  const channels = readChannels();
  delete channels.channels[id];
  writeChannels(channels);
}

export function getConfiguredChannels(): Record<string, ChannelConfig> {
  return readChannels().channels;
}

// ── Backup ──

export function backupConfig(): string {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(BACKUPS_DIR, `${ts}.json`);

  const snapshot: Record<string, unknown> = {};
  if (fs.existsSync(CONFIG_PATH)) {
    snapshot.config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  }
  if (fs.existsSync(PROVIDERS_PATH)) {
    snapshot.providers = JSON.parse(fs.readFileSync(PROVIDERS_PATH, "utf-8"));
  }

  const openclawConfig = getOpenClawConfigPath();
  if (fs.existsSync(openclawConfig)) {
    snapshot.openclaw = JSON.parse(fs.readFileSync(openclawConfig, "utf-8"));
  }

  fs.writeFileSync(backupPath, JSON.stringify(snapshot, null, 2) + "\n");
  return backupPath;
}

export function getOpenClawConfigPath(): string {
  return path.join(os.homedir(), ".openclaw", "openclaw.json");
}

export { OCM_DIR, CONFIG_PATH, PROVIDERS_PATH, CHANNELS_PATH, BACKUPS_DIR };
