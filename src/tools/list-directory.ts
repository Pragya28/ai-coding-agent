import * as fs from "fs";
import * as path from "path";
import { ToolResult } from "./types";
import { WORKSPACE } from "../constants";

export function listDirectory(dirPath: string): ToolResult {
  try {
    const resolved = path.isAbsolute(dirPath)
      ? dirPath
      : path.resolve(WORKSPACE, dirPath);
    const entries = fs.readdirSync(resolved, { withFileTypes: true });
    const output = entries
      .map((e) => `${e.isDirectory() ? "[dir]" : "[file]"} ${e.name}`)
      .join("\n");
    return { success: true, output };
  } catch (error) {
    return { success: false, output: `Error listing directory: ${error}` };
  }
}
