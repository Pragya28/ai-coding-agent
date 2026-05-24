import { PLAN_MODE, VERBOSE, WORKSPACE } from "../constants";
import { WorkspaceIndex } from "./workspace-indexer";

interface SessionInfo {
  loggerPath: string;
  index: WorkspaceIndex;
  cacheStatus: string;
}

export function printSessionInfo({
  loggerPath,
  index,
  cacheStatus,
}: SessionInfo) {
  console.log("─────────────────────────────────────────");
  console.log("  AI Coding Agent");
  console.log("─────────────────────────────────────────");
  console.log(`  Router    : lfm2.5-thinking:1.2b`);
  console.log(`  Models    : qwen2.5-coder:3b (local)`);
  console.log(`  Workspace : ${WORKSPACE}`);
  console.log(
    `  Indexed   : ${index.fileCount} files, ${index.folderCount} folders`,
  );
  console.log(`  Cache     : ${cacheStatus}`);
  console.log(`  Ignored   : ${index.ignored.length} patterns`);
  if (VERBOSE) {
    console.log(`  Ignored   : ${index.ignored.join(", ")}`);
  }
  console.log(`  Plan Mode : ${PLAN_MODE ? "on" : "off"}`);
  console.log(`  Verbose   : ${VERBOSE ? "on" : "off"}`);
  console.log(`  Tools     : fs · shell · git`);
  console.log(`  Log       : ${loggerPath}`);
  console.log("─────────────────────────────────────────");
  console.log('  Type "exit" to quit\n');
}
