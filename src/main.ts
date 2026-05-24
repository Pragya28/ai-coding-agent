import * as readline from "readline";
import { WORKSPACE, PLAN_MODE, VERBOSE, REINDEX } from "./constants";
import { runAgentLoop } from "./agent/loop";
import { getContextStats } from "./utils/context-manager/context-manager";
import { messages } from "./agent/chat";
import { Logger } from "./utils/logger";
import { loadOrBuildIndex, renderTree } from "./utils/workspace-indexer";
import { printSessionInfo } from "./utils/session-info";
import path from "path";

async function main() {
  console.log("  Indexing workspace...");

  const resolvedWorkspace = path.resolve(WORKSPACE);
  const { index, fromCache, staleReason } = await loadOrBuildIndex(
    resolvedWorkspace,
    REINDEX,
  );
  const cacheStatus = fromCache ? "cached" : `rebuilt (${staleReason})`;

  const logger = new Logger();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  printSessionInfo({ loggerPath: logger.getFilePath(), index, cacheStatus });
  process.env.WORKSPACE_TREE = renderTree(index.tree);
  process.env.WORKSPACE_FILE_COUNT = String(index.fileCount);

  let sessionEnded = false;

  rl.on("close", () => {
    if (!sessionEnded) {
      sessionEnded = true;
      logger.logSessionEnd();
    }
  });

  const askQuestion = () => {
    rl.question("You: ", async (input) => {
      const userInput = input.trim();

      if (userInput === "exit") {
        sessionEnded = true;
        logger.logSessionEnd();
        console.log("Goodbye!");
        rl.close();
        return;
      }

      if (!userInput) {
        askQuestion();
        return;
      }

      try {
        logger.logUser(userInput);
        await runAgentLoop(userInput, rl, logger);
        const stats = getContextStats(messages);
        console.log(stats + "\n");
        logger.logContextStats(stats);
      } catch (error) {
        console.error("Error:", error);
      }

      askQuestion();
    });
  };

  askQuestion();
}

main();
