import pc from "picocolors";

let verbose = false;

export function setVerbose(v: boolean): void {
  verbose = v;
}

export function debug(msg: string): void {
  if (verbose) {
    console.log(pc.dim(`  [debug] ${msg}`));
  }
}

export function log(msg: string): void {
  console.log(`  ${msg}`);
}
