import { OLLAMA_URL } from "../constants";
import { ROUTER_PROMPT } from "../prompts/router";
import { startSpinner } from "../utils/spinner";

export type TaskType =
  | "file_operation"
  | "code_generation"
  | "explanation"
  | "shell_command"
  | "search"
  | "general";

export async function routeTask(userMessage: string): Promise<TaskType> {
  const lower = userMessage.toLowerCase();

  // Keyword overrides before hitting the model
  if (
    ["read ", "open ", "show me", "my note", "my document"].some((k) =>
      lower.includes(k),
    )
  ) {
    return "file_operation";
  }
  if (
    ["search for", "find all", "which notes", "grep"].some((k) =>
      lower.includes(k),
    )
  ) {
    return "search";
  }

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

    // Validate it's a known task type
    const validTasks: TaskType[] = [
      "file_operation",
      "code_generation",
      "explanation",
      "shell_command",
      "search",
      "general",
    ];

    const task = validTasks.find((t) => raw.includes(t)) ?? "general";
    return task;
  } catch {
    // Fallback if router model fails
    return "general";
  } finally {
    stop();
  }
}
