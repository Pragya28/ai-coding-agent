import * as fs from "fs";
import * as path from "path";
import { ToolResult } from "../types";
import { WORKSPACE } from "../../constants";

function walkFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

export function searchFiles(pattern: string, searchDir?: string): ToolResult {
  try {
    let baseDir: string;
    if (searchDir) {
      const resolved = path.isAbsolute(searchDir)
        ? searchDir
        : path.resolve(WORKSPACE, searchDir);

      // If directory doesn't exist, fall back to workspace root
      if (!fs.existsSync(resolved)) {
        console.log(
          `[search_files: directory not found, falling back to workspace root]`,
        );
        baseDir = WORKSPACE;
      } else {
        baseDir = resolved;
      }
    } else {
      baseDir = WORKSPACE;
    }

    const allFiles = walkFiles(baseDir);
    const matches: string[] = [];
    const regex = new RegExp(pattern, "gi");

    for (const filePath of allFiles) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");
        const matchingLines: string[] = [];

        lines.forEach((line, index) => {
          if (regex.test(line)) {
            matchingLines.push(`  Line ${index + 1}: ${line.trim()}`);
          }
          regex.lastIndex = 0; // reset regex state
        });

        if (matchingLines.length > 0) {
          matches.push(`\n${filePath}:\n${matchingLines.join("\n")}`);
        }
      } catch {
        // Skip unreadable files (binary, etc.)
      }
    }

    if (matches.length === 0) {
      return { success: true, output: `No matches found for "${pattern}"` };
    }

    return {
      success: true,
      output: `Found matches in ${matches.length} file(s):\n${matches.join("\n")}`,
    };
  } catch (error) {
    return { success: false, output: `Error searching files: ${error}` };
  }
}
