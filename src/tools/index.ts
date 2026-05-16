import { readFile } from "./read-file/read-file";
import { writeFile } from "./write-file/write-file";
import { listDirectory } from "./list-directory";
import { searchFiles } from "./search-files/search-files";
import { runShell } from "./run-shell";

export { ToolResult } from "./types";

export const tools = {
  read_file: (arg: string) => readFile(arg),
  write_file: (arg: string, content: string) => writeFile(arg, content),
  list_directory: (arg: string) => listDirectory(arg),
  search_files: (arg: string, dir?: string) => searchFiles(arg, dir),
  run_shell: (arg: string) => runShell(arg),
};

export type ToolName = keyof typeof tools;
