import { execSync } from "child_process";
import { ToolResult } from "./types";
import { WORKSPACE } from "../constants";

export function runShell(command: string): ToolResult {
  try {
    const output = execSync(command, {
      encoding: "utf-8",
      timeout: 10000,
      cwd: WORKSPACE,
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, output: `Error running command: ${error}` };
  }
}
