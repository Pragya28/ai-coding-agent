import * as readline from "readline";
import { flags, WORKSPACE } from "../../constants";
import { getRouterModel } from "../../agent/router";
import { getAllModels } from "../../agent/model-selector";
import { Logger } from "../logger";
import { messages, resetMessages } from "../../agent/chat";
import { getContextStats } from "../context-manager/context-manager";
import {
  formatSessionDate,
  listRecentSessions,
  loadSessionMessages,
} from "../session-store";
import { Message } from "../../types";

export type CommandResult =
  | { handled: false }
  | { handled: true; exit?: boolean; results?: { cmd: string; data: unknown } };

export function handleCommand(
  input: string,
  logger: Logger,
  rl: readline.Interface,
  onNewSession: () => void,
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

    case "verbose":
      flags.VERBOSE = !flags.VERBOSE;
      console.log(`\n✓ Verbose mode: ${flags.VERBOSE ? "on" : "off"}\n`);
      logger.logSystem(`Verbose mode toggled: ${flags.VERBOSE ? "on" : "off"}`);
      return { handled: true };

    case "plan":
      flags.PLAN_MODE = !flags.PLAN_MODE;
      console.log(`\n✓ Plan mode: ${flags.PLAN_MODE ? "on" : "off"}\n`);
      logger.logSystem(`Plan mode toggled: ${flags.PLAN_MODE ? "on" : "off"}`);
      return { handled: true };

    case "reindex":
      flags.REINDEX = true;
      console.log("\n✓ Reindex flag set — will reindex on next startup.\n");
      logger.logSystem("Reindex flag set");
      return { handled: true };

    case "new":
      onNewSession();
      return { handled: true };

    case "sessions":
      printSessions();
      return { handled: true };

    case "resume":
      const num = parseInt(args[0]);
      const resumed = pickSession(num);
      return { handled: true, results: { cmd: "resume", data: resumed } };

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
  /verbose       Toggle verbose mode on/off
  /plan          Toggle plan mode on/off
  /reindex       Force workspace reindex on next start
  /sessions      List recent sessions
  /new           Start a new session
  /exit          Exit the agent
─────────────────────────────────────────
  Tips:
  @path/to/file  Inject file contents into prompt
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
  Plan Mode : ${flags.PLAN_MODE ? "on" : "off"}
  Verbose   : ${flags.VERBOSE ? "on" : "off"}
  ${stats}
─────────────────────────────────────────
`);
}

function printSessions() {
  const sessions = listRecentSessions(10);
  if (sessions.length === 0) {
    console.log("\nNo previous sessions found.\n");
    return;
  }
  console.log("\n─────────────────────────────────────────");
  console.log("  Recent Sessions");
  console.log("─────────────────────────────────────────");

  sessions.forEach((s, i) => {
    console.log(
      `  ${i + 1}. ${formatSessionDate(s.date)} — ${s.messageCount} messages`,
    );
  });

  console.log("─────────────────────────────────────────");
  console.log("Use /resume <number> to resume a session");
  console.log("─────────────────────────────────────────");
}

function pickSession(num: number): string | null {
  const sessions = listRecentSessions(10);
  if (!isNaN(num) && num >= 1 && num <= sessions.length) {
    const selected = sessions[num - 1];
    const messages = loadSessionMessages(selected.jsonPath);
    console.log(
      `\n✓ Resuming session from ${formatSessionDate(selected.date)}\n`,
    );
    resetMessages(messages);
    return selected.name;
  }
  return null;
}
