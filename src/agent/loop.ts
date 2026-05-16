import * as readline from "readline";
import { MAX_ITERATIONS, PLAN_MODE } from "../constants";
import { callOllama, messages } from "./chat";
import { routeTask } from "./router";
import { selectModel } from "./model-selector";
import { executeTool, parseToolCall } from "../utils/tool-parser/tool-parser";
import { confirmPlan, extractPlan } from "./planner";
import { Logger } from "../utils/logger";

export async function runAgentLoop(
  userInput: string,
  rl: readline.Interface,
  logger: Logger,
): Promise<string> {
  const taskType = await routeTask(userInput);
  const model = selectModel(taskType);
  console.log(`\n[Router: ${taskType} → ${model}]`);
  logger.logRouter(taskType, model);

  messages.push({ role: "user", content: userInput });

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await callOllama(model, logger);
    messages.push({ role: "assistant", content: response });

    const toolCall = parseToolCall(response);

    if (!toolCall) {
      const cleaned = response
        .replace(/^PLAN:.*$/gm, "")
        .replace(/Now show the user the EXACT contents.*$/s, "")
        .trim();
      logger.logAgent(cleaned);
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

    console.log(
      `\n[Tool: ${toolCall.name} | ${toolCall.argument}${toolCall.secondArgument ? ` | ${toolCall.secondArgument}` : ""}]`,
    );
    const result = executeTool(toolCall);
    console.log(`[Result: ${result.success ? "success" : "failed"}]\n`);
    logger.logTool(
      toolCall.name,
      toolCall.argument,
      toolCall.secondArgument,
      result.success,
      result.output,
    );

    if (!result.success) {
      messages.push({
        role: "user",
        content: `Tool failed: ${result.output}. Answer directly from knowledge.`,
      });
      continue;
    }

    // Allow multi-step: if search succeeded, let model decide next step
    if (toolCall.name === "search_files") {
      messages.push({
        role: "user",
        content: `Tool result:\n${result.output}\n\nLook at the file paths listed above. Pick the most relevant file path EXACTLY as shown and call read_file with that exact path. Do not guess or invent a filename.`,
      });
    } else {
      messages.push({
        role: "user",
        content: `Tool result:\n${result.output}\n\nNow show the user the EXACT contents from this result. Do not summarize or just report the file path — display the actual content.`,
      });
    }
  }

  // At the end of the loop
  const lastToolCall = messages
    .filter((m) => m.role === "user" && m.content.startsWith("Tool result:"))
    .at(-1);

  const summary = lastToolCall
    ? `Reached max iterations. Last completed step:\n${lastToolCall.content.slice(0, 300)}...`
    : "Reached max iterations without completing the task. Please try rephrasing your request.";

  logger.logSystem("Max iterations reached");
  return summary;
}
