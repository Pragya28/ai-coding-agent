import * as fs from "fs";
import * as path from "path";
import { ToolResult } from "./types";
import { WORKSPACE } from "../constants";

export function readFile(filePath: string): ToolResult {
  try {
    const resolved = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(WORKSPACE, filePath);
    const content = fs.readFileSync(resolved, "utf-8");
    return { success: true, output: content };
  } catch (error) {
    return { success: false, output: `Error reading file: ${error}` };
  }
}
