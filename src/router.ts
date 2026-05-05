import { OLLAMA_URL } from "./constants";

export type TaskType =
  | "file_operation"
  | "code_generation"
  | "explanation"
  | "shell_command"
  | "search"
  | "general";

export async function routeTask(userMessage: string): Promise<TaskType> {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "lfm2.5-thinking:1.2b",
        messages: [
          {
            role: "system",
            content: `You are a task classifier. Classify the user message into exactly one of these categories:
- file_operation: reading, listing, writing, or creating files
- code_generation: writing, editing, generating, or fixing code
- explanation: explaining concepts, summarizing, answering questions
- shell_command: running terminal commands
- search: searching for patterns or keywords across files
- general: anything else

Respond with ONLY the category name, nothing else. No explanation, no punctuation.`,
          },
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
  }
}
