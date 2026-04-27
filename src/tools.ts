import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { WORKSPACE } from "./constants";

export interface ToolResult {
  success: boolean;
  output: string;
}

export const tools = {
  read_file: (filePath: string): ToolResult => {
    try {
      const resolved = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(WORKSPACE, filePath);
      const content = fs.readFileSync(resolved, "utf-8");
      return { success: true, output: content };
    } catch (error) {
      return { success: false, output: `Error reading file: ${error}` };
    }
  },

  list_directory: (dirPath: string): ToolResult => {
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
  },

  run_shell: (command: string): ToolResult => {
    try {
      const output = execSync(command, {
        encoding: "utf-8",
        timeout: 10000,
      });
      return { success: true, output };
    } catch (error) {
      return { success: false, output: `Error running command: ${error}` };
    }
  },
};

export type ToolName = keyof typeof tools;
