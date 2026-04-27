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

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export const messages: Message[] = [{ role: "system", content: SYSTEM_PROMPT }];

async function callOllama(): Promise<string> {
  const trimmed = trimMessages(messages);

  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: trimmed,
      stream: false,
    }),
  });

  const data = await response.json();
  return data.message.content;
}

export async function runAgentLoop(
  userInput: string,
  rl: readline.Interface,
): Promise<string> {
  messages.push({ role: "user", content: userInput });

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await callOllama();
    messages.push({ role: "assistant", content: response });

    const toolCall = parseToolCall(response);

    if (!toolCall) {
      return response;
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
        content: `Tool failed: ${result.output}. Try a different approach or answer without the tool.`,
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
