import * as readline from "readline";
import { WORKSPACE, PLAN_MODE, VERBOSE } from "../../constants";
import { getRouterModel } from "../../agent/router";
import { getAllModels } from "../../agent/model-selector";
import { Logger } from "../logger";
import { messages } from "../../agent/chat";
import { getContextStats } from "../context-manager/context-manager";

export type CommandResult =
  | { handled: false }
  | { handled: true; exit?: boolean };

export function handleCommand(
  input: string,
  logger: Logger,
  rl: readline.Interface,
): CommandResult {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return { handled: false };

  const [command, ...args] = trimmed.slice(1).split(" ");

  switch (command.toLowerCase()) {
    case "help":
      printHelp();
      return { handled: true };

    case "clear":
      clearHistory(logger);
      return { handled: true };

    case "status":
      printStatus();
      return { handled: true };

    case "exit":
    case "quit":
      logger.logSessionEnd();
      console.log("Goodbye!");
      rl.close();
      return { handled: true, exit: true };

    default:
      console.log(
        `\nUnknown command: /${command}. Type /help for available commands.\n`,
      );
      return { handled: true };
  }
}

function printHelp() {
  console.log(`
─────────────────────────────────────────
  Available Commands
─────────────────────────────────────────
  /help          Show this help message
  /clear         Clear conversation history
  /status        Show current session status
  /exit          Exit the agent
─────────────────────────────────────────
  Tips:
  @path/to/file  Mention a file in your prompt
                 e.g. "explain @src/agent/loop.ts"
─────────────────────────────────────────
`);
}

function clearHistory(logger: Logger) {
  const cleared = messages.length - 1; // exclude system message
  messages.splice(1); // keep system message, remove the rest
  logger.logSystem(
    `Conversation history cleared (${cleared} messages removed)`,
  );
  console.log(`\n✓ Cleared ${cleared} messages from conversation history.\n`);
}

function printStatus() {
  const stats = getContextStats(messages);
  console.log(`
─────────────────────────────────────────
  Session Status
─────────────────────────────────────────
  Workspace : ${WORKSPACE}
  Router    : ${getRouterModel()}
  Models    : ${getAllModels().join(" | ")}
  Plan Mode : ${PLAN_MODE ? "on" : "off"}
  Verbose   : ${VERBOSE ? "on" : "off"}
  ${stats}
─────────────────────────────────────────
`);
}
