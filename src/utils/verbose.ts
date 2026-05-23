import { VERBOSE } from "../constants";

export function verboseLog(section: string, content: string) {
  if (!VERBOSE) return;

  console.log(`\n${"─".repeat(50)}`);
  console.log(`[VERBOSE] ${section}`);
  console.log("─".repeat(50));
  console.log(content);
  console.log("─".repeat(50));
}
