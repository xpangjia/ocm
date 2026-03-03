import * as p from "@clack/prompts";
import pc from "picocolors";

export function header(): void {
  p.intro(pc.bgCyan(pc.black(" OCM — OpenClaw Manager ")));
}

export function success(msg: string): void {
  p.log.success(pc.green(msg));
}

export function error(msg: string): void {
  p.log.error(pc.red(msg));
}

export function warn(msg: string): void {
  p.log.warn(pc.yellow(msg));
}

export function info(msg: string): void {
  p.log.info(msg);
}

export function step(msg: string): void {
  p.log.step(msg);
}

export function done(msg: string): void {
  p.outro(msg);
}

export function cancelled(): void {
  p.cancel("操作已取消");
  process.exit(0);
}

export function isCancel(value: unknown): value is symbol {
  return p.isCancel(value);
}

export { p, pc };
