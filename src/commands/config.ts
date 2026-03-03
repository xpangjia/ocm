import { success, error, info, pc } from "../utils/ui.js";
import { readConfig, writeConfig } from "../core/ocm-config.js";
import type { OcmConfig } from "../registry/types.js";

export function configShowCommand(): void {
  const config = readConfig();
  console.log();
  console.log(`  ${pc.bold("OCM 配置")}`);
  console.log();
  console.log(formatConfig(config as unknown as Record<string, unknown>, "  "));
  console.log();
}

export function configGetCommand(key: string): void {
  const config = readConfig();
  const value = getNestedValue(config as unknown as Record<string, unknown>, key);
  if (value === undefined) {
    error(`配置项不存在: ${key}`);
    return;
  }
  if (typeof value === "object" && value !== null) {
    console.log(JSON.stringify(value, null, 2));
  } else {
    console.log(String(value));
  }
}

export function configSetCommand(key: string, value: string): void {
  const config = readConfig();
  const parsed = parseValue(value);
  const updated = setNestedValue(config as unknown as Record<string, unknown>, key, parsed);
  if (!updated) {
    error(`无法设置配置项: ${key}`);
    return;
  }
  writeConfig(config);
  success(`已设置 ${key} = ${value}`);
}

// ── helpers ──

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const k of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[k];
  }
  return current;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): boolean {
  const keys = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (typeof current[k] !== "object" || current[k] === null) {
      return false;
    }
    current = current[k] as Record<string, unknown>;
  }
  const lastKey = keys[keys.length - 1];
  if (!(lastKey in current)) {
    return false;
  }
  current[lastKey] = value;
  return true;
}

function parseValue(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  const num = Number(value);
  if (!Number.isNaN(num) && value.trim() !== "") return num;
  return value;
}

function formatConfig(obj: unknown, indent: string): string {
  if (typeof obj !== "object" || obj === null) {
    return `${indent}${String(obj)}`;
  }
  const lines: string[] = [];
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof val === "object" && val !== null) {
      lines.push(`${indent}${pc.bold(key)}:`);
      lines.push(formatConfig(val, indent + "  "));
    } else {
      lines.push(`${indent}${key}: ${pc.cyan(String(val))}`);
    }
  }
  return lines.join("\n");
}
