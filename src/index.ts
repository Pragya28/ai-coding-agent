import * as readline from "readline";
import { parseToolCall, executeTool } from "./tool-parser";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "llama3.2";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT = `You are a helpful coding assistant with access to the following tools:

- read_file: Read contents of a file
- list_directory: List files in a directory  
- run_shell: Execute a shell command

When you need to use a tool, respond ONLY in this exact format:
TOOL: tool_name | argument

Examples:
TOOL: read_file | src/index.ts
TOOL: list_directory | src
TOOL: run_shell | echo hello

After receiving the tool result, continue helping the user.
If you don't need a tool, just respond normally.`;

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

  // Max 5 iterations to prevent infinite loops
  for (let i = 0; i < 5; i++) {
    const response = await callOllama();
    messages.push({ role: "assistant", content: response });

    const toolCall = parseToolCall(response);

    if (!toolCall) {
      // No tool call — agent is done, return final response
      return response;
    }

    // Execute the tool and feed result back to agent
    console.log(`\n[Tool: ${toolCall.name} | ${toolCall.argument}]`);
    const result = executeTool(toolCall);
    console.log(`[Result: ${result.success ? "success" : "failed"}]\n`);

    messages.push({
      role: "user",
      content: `Tool result:\n${result.output}`,
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
