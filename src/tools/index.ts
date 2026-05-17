import { readFile } from "./read-file/read-file";
import { writeFile } from "./write-file/write-file";
import { listDirectory } from "./list-directory/list-directory";
import { searchFiles } from "./search-files/search-files";
import { runShell } from "./run-shell";
import { gitDiff, gitLog, gitAdd, gitCommit, gitStatus } from "./git";

export { ToolResult } from "./types";

export const tools = {
  read_file: (arg: string) => readFile(arg),
  write_file: (arg: string, content: string) => writeFile(arg, content),
  list_directory: (arg: string) => listDirectory(arg),
  search_files: (arg: string, dir?: string) => searchFiles(arg, dir),
  run_shell: (arg: string) => runShell(arg),
  git_status: () => gitStatus(),
  git_diff: (arg?: string) => gitDiff(arg),
  git_log: (arg?: string) => gitLog(arg),
  git_add: (arg?: string) => gitAdd(arg),
  git_commit: (arg: string) => gitCommit(arg),
};

export type ToolName = keyof typeof tools;
