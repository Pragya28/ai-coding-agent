import * as fs from "fs";
import * as path from "path";
import { ToolResult } from "./types";
import { WORKSPACE } from "../constants";

export function readFile(filePath: string): ToolResult {
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(WORKSPACE, filePath);
  try {
    // Decode any URL-encoded spaces
    const decoded = decodeURIComponent(resolved);

    const content = fs.readFileSync(decoded, "utf-8");
    return { success: true, output: content };
  } catch (error) {
    // Try with original path if decoded fails
    try {
      const content = fs.readFileSync(resolved, "utf-8");
      return { success: true, output: content };
    } catch {
      return { success: false, output: `Error reading file: ${error}` };
    }
  }
}
