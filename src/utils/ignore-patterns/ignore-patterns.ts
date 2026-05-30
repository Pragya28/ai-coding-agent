import * as fs from "fs";
import * as path from "path";
import ignore, { Ignore } from "ignore";

// Always ignored regardless of workspace
export const DEFAULT_IGNORED = [
  ".git",
  ".DS_Store",
  "node_modules",
  "dist",
  "build",
  ".cache",
  ".trash",
  ".obsidian",
  "*.log",
  "*.lock",
  ".env",
  ".env.*",
  "__pycache__",
  "*.pyc",
  "*.png",
  "*.jpg",
  "*.jpeg",
  "*.gif",
  "*.svg",
  "*.pdf",
  "*.zip",
  "*.epub",
];

export function createIgnoreMatcher(workspacePath: string): Ignore {
  const ig = ignore().add(DEFAULT_IGNORED);

  // Read .gitignore if it exists
  const gitignorePath = path.join(workspacePath, ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, "utf-8");
    const lines = content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    ig.add(lines);
  }

  return ig;
}
