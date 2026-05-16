import * as fs from "fs";
import * as path from "path";
import { ToolResult } from "../types";
import { WORKSPACE } from "../../constants";

export function writeFile(filePath: string, content: string): ToolResult {
  try {
    const resolved = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(WORKSPACE, filePath);

    // Create directory if it doesn't exist
    const dir = path.dirname(resolved);
    fs.mkdirSync(dir, { recursive: true });

    // Show diff preview before writing
    if (fs.existsSync(resolved)) {
      const existing = fs.readFileSync(resolved, "utf-8");
      if (existing === content) {
        return {
          success: true,
          output: "No changes detected, file unchanged.",
        };
      }
      console.log(`\n[Overwriting existing file: ${resolved}]`);
    } else {
      console.log(`\n[Creating new file: ${resolved}]`);
    }

    fs.writeFileSync(resolved, content, "utf-8");
    return { success: true, output: `File written successfully: ${resolved}` };
  } catch (error) {
    return { success: false, output: `Error writing file: ${error}` };
  }
}
