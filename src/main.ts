import * as readline from "readline";
import { WORKSPACE, PLAN_MODE, VERBOSE } from "./constants";
import { runAgentLoop } from "./agent/loop";
import { getContextStats } from "./utils/context-manager/context-manager";
import { messages } from "./agent/chat";
import { Logger } from "./utils/logger";

function printSessionInfo() {
  console.log("─────────────────────────────────────────");
  console.log("  AI Coding Agent");
  console.log("─────────────────────────────────────────");
  console.log(`  Router    : lfm2.5-thinking:1.2b`);
  console.log(`  Models    : qwen2.5-coder:3b (local)`);
  console.log(`  Workspace : ${WORKSPACE}`);
  console.log(`  Plan Mode : ${PLAN_MODE ? "on" : "off"}`);
  console.log(`  Verbose   : ${VERBOSE ? "on" : "off"}`);
  console.log(`  Tools     : fs · shell · git`);
  console.log("─────────────────────────────────────────");
  console.log('  Type "exit" to quit\n');
}

async function main() {
  const logger = new Logger();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  printSessionInfo();
  console.log(`  Log       : ${logger.getFilePath()}\n`);
  console.log("─────────────────────────────────────────\n");

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
