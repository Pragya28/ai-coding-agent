import { readFile } from "./read-file";
import { writeFile } from "./write-file";
import { listDirectory } from "./list-directory";
import { searchFiles } from "./search-files";
import { runShell } from "./run-shell";

export { ToolResult } from "./types";

export const tools = {
  read_file: readFile,
  write_file: writeFile,
  list_directory: listDirectory,
  search_files: searchFiles,
  run_shell: runShell,
};

export type ToolName = keyof typeof tools;
