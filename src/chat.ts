import * as readline from "readline";
import {
  OLLAMA_URL,
  MODEL,
  SYSTEM_PROMPT,
  PLAN_MODE,
  MAX_ITERATIONS,
} from "./constants";
import { parseToolCall, executeTool } from "./tool-parser";
import { trimMessages, getContextStats } from "./context-manager";
import { confirmPlan, extractPlan } from "./planner";
import { routeTask } from "./router";
import { selectModel } from "./model-selector";
import { startSpinner } from "./spinner";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export const messages: Message[] = [{ role: "system", content: SYSTEM_PROMPT }];

async function callOllama(model: string): Promise<string> {
  const trimmed = trimMessages(messages);
  const stop = startSpinner(`Thinking with ${model}`);

  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: trimmed,
        stream: false,
      }),
    });

    const data = await response.json();
    return data.message.content;
  } finally {
    stop();
  }
}

export async function runAgentLoop(
  userInput: string,
  rl: readline.Interface,
): Promise<string> {
  const taskType = await routeTask(userInput);
  const model = selectModel(taskType);
  console.log(`\n[Router: ${taskType} → ${model}]`);

  messages.push({ role: "user", content: userInput });

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await callOllama(model);
    messages.push({ role: "assistant", content: response });

    const toolCall = parseToolCall(response);

    if (!toolCall) {
      const cleaned = response.replace(/^PLAN:.*$/gm, "").trim();
      return cleaned;
    }

    if (PLAN_MODE) {
      const plan =
        extractPlan(response) ??
        `call ${toolCall.name} with "${toolCall.argument}"`;
      const confirmed = await confirmPlan(plan, rl);

      if (!confirmed) {
        messages.push({
          role: "user",
          content:
            "User rejected the plan. Try a different approach or answer without using tools.",
        });
        continue;
      }
    }

    console.log(`\n[Tool: ${toolCall.name} | ${toolCall.argument}]`);
    const result = executeTool(toolCall);
    console.log(`[Result: ${result.success ? "success" : "failed"}]\n`);

    if (!result.success) {
      messages.push({
        role: "user",
        content: `Tool failed: ${result.output}. The file or command may not exist. Answer the user's question directly from your own knowledge without using any tools.`,
      });
      continue;
    }

    messages.push({
      role: "user",
      content: `Tool result:\n${result.output}\n\nNow answer the user's original question using ONLY this result. Do not call any more tools.`,
    });
  }

  return "Max iterations reached.";
}

export { getContextStats };
