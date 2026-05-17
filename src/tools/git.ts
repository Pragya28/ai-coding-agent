import { execSync } from "child_process";
import { ToolResult } from "./types";
import { WORKSPACE } from "../constants";

function runGit(command: string): ToolResult {
  try {
    const output = execSync(`git ${command}`, {
      encoding: "utf-8",
      cwd: WORKSPACE,
      timeout: 10000,
    });
    return { success: true, output: output || "(no output)" };
  } catch (error: any) {
    // Git often writes useful info to stderr
    const stderr = error.stderr?.toString() ?? "";
    const stdout = error.stdout?.toString() ?? "";
    const message = stderr || stdout || error.message;
    return { success: false, output: `Git error: ${message}` };
  }
}

export function gitStatus(): ToolResult {
  return runGit("status");
}

export function gitDiff(filePath?: string): ToolResult {
  return runGit(filePath ? `diff ${filePath}` : "diff");
}

export function gitLog(args?: string): ToolResult {
  // Default to compact 10-line log — full log is too large for context
  return runGit(args ? `log ${args}` : "log --oneline -10");
}

export function gitAdd(filePath?: string): ToolResult {
  return runGit(filePath ? `add ${filePath}` : "add .");
}

export function gitCommit(message: string): ToolResult {
  if (!message || message.trim() === "") {
    return {
      success: false,
      output: "Git error: commit message cannot be empty.",
    };
  }
  // Strip backticks and other shell-breaking characters
  const sanitized = message
    .replace(/`/g, "")
    .replace(/\$/g, "")
    .replace(/\\/g, "")
    .trim();

  return runGit(`commit -m "${sanitized}"`);
}
