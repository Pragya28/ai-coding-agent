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
import {
  listRecentSessions,
  loadSessionMessages,
  formatSessionDate,
} from "./utils/session-store";
import { Message } from "./types";
import { SYSTEM_PROMPT } from "./prompts/system";

async function pickSession(
  rl: readline.Interface,
): Promise<{ messages: Message[]; resumedFrom?: string } | null> {
  const sessions = listRecentSessions(10);

  if (sessions.length === 0) return null;

  console.log("─────────────────────────────────────────");
  console.log("  Recent Sessions");
  console.log("─────────────────────────────────────────");

  sessions.forEach((s, i) => {
    console.log(
      `  ${i + 1}. ${formatSessionDate(s.date)} — ${s.messageCount} messages`,
    );
  });

  console.log("─────────────────────────────────────────");

  return new Promise((resolve) => {
    rl.question(
      "  Resume a session (1-10) or press Enter to start fresh: ",
      (answer) => {
        const num = parseInt(answer.trim());
        if (!isNaN(num) && num >= 1 && num <= sessions.length) {
          const selected = sessions[num - 1];
          const messages = loadSessionMessages(selected.jsonPath);
          console.log(
            `\n✓ Resuming session from ${formatSessionDate(selected.date)}\n`,
          );
          resolve({ messages, resumedFrom: selected.name });
        } else {
          resolve(null);
        }
      },
    );
  });
}

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

  let resumedFrom: string | undefined;
  const resumed = await pickSession(rl);
  if (resumed) {
    messages.splice(0, messages.length, ...resumed.messages);
    resumedFrom = resumed.resumedFrom;
  }

  let logger = new Logger();

  logger.logSessionStart(
    WORKSPACE,
    index.fileCount,
    index.folderCount,
    cacheStatus,
    getRouterModel(),
    getAllModels().join(" | "),
    resumedFrom,
  );
  printSessionInfo({ loggerPath: logger.getMdPath(), index, cacheStatus });
  process.env.WORKSPACE_TREE = renderTree(index.tree);
  process.env.WORKSPACE_FILE_COUNT = String(index.fileCount);

  let sessionEnded = false;

  rl.on("close", () => {
    if (!sessionEnded) {
      sessionEnded = true;
      logger.logSessionEnd();
    }
  });

  function startNewSession() {
    // Save current session
    logger.logSessionEnd();
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
