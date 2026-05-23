import { OLLAMA_URL } from "../constants";
import { ROUTER_PROMPT } from "../prompts/router";
import { startSpinner } from "../utils/spinner";
import { verboseLog } from "../utils/verbose";

export type TaskType =
  | "file_operation"
  | "code_generation"
  | "explanation"
  | "shell_command"
  | "search"
  | "git"
  | "general";

const KEYWORD_ROUTES: { keywords: string[]; task: TaskType }[] = [
  {
    task: "file_operation",
    keywords: ["read ", "open ", "show me", "my note", "my document"],
  },
  {
    task: "search",
    keywords: ["search for", "find all", "which notes", "grep"],
  },
  {
    task: "git",
    keywords: [
      "git status",
      "git diff",
      "git log",
      "git add",
      "git commit",
      "what changed",
      "staged",
      "commit history",
      "recent commits",
      "show me the diff",
      "show diff",
      "show changes",
    ],
  },
];

const VALID_TASKS: TaskType[] = [
  "file_operation",
  "code_generation",
  "explanation",
  "shell_command",
  "search",
  "git",
  "general",
];

export async function routeTask(userMessage: string): Promise<TaskType> {
  const lower = userMessage.toLowerCase();

  // Keyword override — short circuit before hitting model
  const override = KEYWORD_ROUTES.find(({ keywords }) =>
    keywords.some((k) => lower.includes(k)),
  );
  if (override) return override.task;

  // Model-based classification
  const stop = startSpinner("Routing");
  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "lfm2.5-thinking:1.2b",
        messages: [
          { role: "system", content: ROUTER_PROMPT },
          { role: "user", content: userMessage },
        ],
        stream: false,
      }),
    });

    const data = await response.json();
    const raw = data.message.content.trim().toLowerCase();
    const task = VALID_TASKS.find((t) => raw.includes(t)) ?? "general";
    verboseLog(
      "Router Raw Response",
      `Input: "${userMessage}"\nRaw: "${raw}"\nClassified: "${task}"`,
    );
    return task;
  } catch {
    return "general";
  } finally {
    stop();
  }
}
