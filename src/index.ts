import * as readline from "readline";
import { parseToolCall, executeTool } from "./tool-parser";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "llama3.2";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT = `You are a helpful coding assistant with access to these tools:

- read_file: Read the EXACT contents of a file. Use this for reading any file.
- list_directory: List files in a directory. Use this to explore folder structure.
- run_shell: Execute a shell command. Use ONLY for running code, not for reading files.

Rules:
1. ALWAYS use read_file to read files, never run_shell with cat.
2. When you receive a tool result, report the EXACT content. Do NOT summarize, invent, or paraphrase file contents.
3. Call ONLY ONE tool at a time. Wait for the result before deciding next step.
4. Once you have enough information to answer, respond normally WITHOUT calling any more tools.
5. Respond ONLY in this format when calling a tool:
TOOL: tool_name | argument

Examples:
TOOL: read_file | package.json
TOOL: list_directory | src
TOOL: run_shell | node index.js`;

const messages: Message[] = [{ role: "system", content: SYSTEM_PROMPT }];

async function callOllama(): Promise<string> {
  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
    }),
  });

  const data = await response.json();
  return data.message.content;
}

async function runAgentLoop(userInput: string): Promise<string> {
  messages.push({ role: "user", content: userInput });

  for (let i = 0; i < 5; i++) {
    const response = await callOllama();
    messages.push({ role: "assistant", content: response });

    const toolCall = parseToolCall(response);

    if (!toolCall) {
      // No tool call — agent is done
      return response;
    }

    console.log(`\n[Tool: ${toolCall.name} | ${toolCall.argument}]`);
    const result = executeTool(toolCall);
    console.log(`[Result: ${result.success ? "success" : "failed"}]\n`);

    if (!result.success) {
      // Tell model the tool failed and let it try once more
      messages.push({
        role: "user",
        content: `Tool failed: ${result.output}. Try a different approach or answer without the tool.`,
      });
      continue;
    }

    // Tool succeeded — force model to answer NOW with the result
    messages.push({
      role: "user",
      content: `Tool result:\n${result.output}\n\nNow answer the user's original question using ONLY this result. Do not call any more tools.`,
    });
  }

  return "Max iterations reached.";
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('AI Coding Agent ready. Type "exit" to quit.\n');

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
        const response = await runAgentLoop(userInput);
        console.log(`\nAgent: ${response}\n`);
      } catch (error) {
        console.error("Error:", error);
      }

      askQuestion();
    });
  };

  askQuestion();
}

main();
