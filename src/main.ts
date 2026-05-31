import * as readline from "readline";
import { flags, WORKSPACE } from "./constants";
import { runAgentLoop } from "./agent/loop";
import { getContextStats } from "./utils/context-manager/context-manager";
import { messages, resetMessages } from "./agent/chat";
import { Logger } from "./utils/logger";
import {
  loadOrBuildIndex,
  renderTree,
} from "./utils/workspace-indexer/workspace-indexer";
import { printSessionInfo } from "./utils/session-info";
import path from "path";
import { getAllModels } from "./agent/model-selector";
import { getRouterModel } from "./agent/router";
import { handleCommand } from "./utils/commands/commands";
import { processMentions } from "./utils/mentions/mentions";

async function main() {
  console.log("  Indexing workspace...");

  const resolvedWorkspace = path.resolve(WORKSPACE);
  const { index, fromCache, staleReason } = await loadOrBuildIndex(
    resolvedWorkspace,
    flags.REINDEX,
  );
  const cacheStatus = fromCache ? "cached" : `rebuilt (${staleReason})`;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let logger = new Logger();

  logger.logSessionStart(
    WORKSPACE,
    index.fileCount,
    index.folderCount,
    cacheStatus,
    getRouterModel(),
    getAllModels().join(" | "),
  );
  printSessionInfo({ loggerPath: logger.getMdPath(), index, cacheStatus });
  process.env.WORKSPACE_TREE = renderTree(index.tree);
  process.env.WORKSPACE_FILE_COUNT = String(index.fileCount);
  resetMessages();

  let sessionEnded = false;

  rl.on("close", () => {
    if (!sessionEnded) {
      sessionEnded = true;
      logger.logSessionEnd();
      logger.saveMessages(messages);
    }
  });

  function startNewSession() {
    // Save current session
    if (!sessionEnded) {
      sessionEnded = true;
      logger.logSessionEnd();
    }
    logger.saveMessages(messages);

    // Reset messages
    resetMessages();

    // Create new logger
    logger = new Logger();
    logger.logSessionStart(
      WORKSPACE,
      index.fileCount,
      index.folderCount,
      cacheStatus,
      getRouterModel(),
      getAllModels().join(" | "),
    );

    console.log("\n✓ New session started.\n");
  }
  const askQuestion = () => {
    rl.question("You: ", async (input) => {
      const userInput = input.trim();

      if (!userInput) {
        askQuestion();
        return;
      }

      const commandResult = handleCommand(
        userInput,
        logger,
        rl,
        startNewSession,
      );
      if (commandResult.handled) {
        if (commandResult.results) {
          if (commandResult.results.cmd === "resume")
            logger.logSessionStart(
              WORKSPACE,
              index.fileCount,
              index.folderCount,
              cacheStatus,
              getRouterModel(),
              getAllModels().join(" | "),
              String(commandResult.results.data),
            );
        }
        if (!commandResult.exit) askQuestion();
        return;
      }

      if (userInput === "exit") {
        sessionEnded = true;
        logger.logSessionEnd();
        console.log("Goodbye!");
        rl.close();
        return;
      }

      try {
        const { processedInput, mentionedFiles, errors } =
          processMentions(userInput);

        if (mentionedFiles.length > 0) {
          console.log(
            `\n📎 Attached: ${mentionedFiles.map((f) => `@${f}`).join(", ")}\n`,
          );
        }
        if (errors.length > 0) {
          errors.forEach((e) => console.log(`⚠️  ${e}`));
          return;
        }
        logger.logUser(userInput);
        if (mentionedFiles.length > 0) {
          logger.logSystem(`File mentions: ${mentionedFiles.join(", ")}`);
        }
        await runAgentLoop(processedInput, rl, logger);
        logger.saveMessages(messages);
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
