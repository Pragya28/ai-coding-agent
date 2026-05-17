#!/usr/bin/env node
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Use tsx to run the TypeScript source directly
const { execFileSync } = require("child_process");
const path = require("path");

const tsxPath = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../node_modules/.bin/tsx",
);

const mainPath = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../src/main.ts",
);

try {
  execFileSync(tsxPath, [mainPath, ...process.argv.slice(2)], {
    stdio: "inherit",
    cwd: process.cwd(),
  });
} catch (e) {
  process.exit(1);
}
