#!/usr/bin/env node
const { execFileSync } = require("child_process");
const path = require("path");

const tsxPath = path.resolve(__dirname, "../node_modules/.bin/tsx");
const mainPath = path.resolve(__dirname, "../src/main.ts");

try {
  execFileSync(tsxPath, [mainPath, ...process.argv.slice(2)], {
    stdio: "inherit",
    cwd: process.cwd(),
  });
} catch (e) {
  process.exit(1);
}
