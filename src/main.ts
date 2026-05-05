import * as readline from "readline";
import { runAgentLoop, messages, getContextStats } from "./chat";
import { WORKSPACE, MODEL, PLAN_MODE } from "./constants";

function printSessionInfo() {
  console.log("─────────────────────────────────────────");
  console.log("  AI Coding Agent");
  console.log("─────────────────────────────────────────");
  console.log(`  Model     : ${MODEL}`);
  console.log(`  Workspace : ${WORKSPACE}`);
  console.log(`  Plan Mode : ${PLAN_MODE ? "on" : "off"}`);
  console.log("─────────────────────────────────────────");
  console.log('  Type "exit" to quit\n');
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  printSessionInfo();

  const askQuestion = () => {
    rl.question("You: ", async (input) => {
      const userInput = input.trim();

      if (userInput === "exit") {
        console.log("Goodbye!");
        rl.close();
        return;
      }

      if (!userInput) {
        askQuestion();
        return;
      }

      try {
        const response = await runAgentLoop(userInput, rl);
        console.log(`\nAgent: ${response}`);
        console.log(getContextStats(messages) + "\n");
      } catch (error) {
        console.error("Error:", error);
      }

      askQuestion();
    });
  };

  askQuestion();
}

main();
