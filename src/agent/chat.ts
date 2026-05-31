import { flags, OLLAMA_URL } from "../constants";
import { getSystemPrompt } from "../prompts/system";
import { Message } from "../types";
import { trimMessages } from "../utils/context-manager/context-manager";
import { Logger } from "../utils/logger";

export function createMessages(): Message[] {
  return [{ role: "system", content: getSystemPrompt() }];
}

export function resetMessages(initial?: Message[]) {
  messages.splice(0, messages.length);
  if (initial && initial.length > 0) {
    messages.push(...initial);
  } else {
    messages.push({ role: "system", content: getSystemPrompt() });
  }
}

export const messages: Message[] = createMessages();

export async function callOllama(
  model: string,
  logger?: Logger,
  silent: boolean = false,
): Promise<string> {
  const { trimmed, trimCount } = trimMessages(messages);

  if (trimCount > 0 && logger) {
    logger.logSystem(`Context trimmed: removed ${trimCount} old messages`);
  }

  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: trimmed,
      stream: true,
    }),
  });

  if (!response.body) {
    throw new Error("No response body from Ollama");
  }

  let fullContent = "";
  let isFirstChunk = true;
  const decoder = new TextDecoder();
  const reader = response.body.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((l) => l.trim());

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const token = parsed.message?.content ?? "";

          if (token) {
            fullContent += token;

            if (!silent) {
              if (isFirstChunk) {
                process.stdout.write("\nAgent: ");
                isFirstChunk = false;
              }
              process.stdout.write(token);
            }
          }

          if (!silent && parsed.done) {
            process.stdout.write("\n");
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (flags.VERBOSE) {
    const approxTokens = Math.round(fullContent.length / 4);
    console.log(`\n[VERBOSE] Response tokens: ~${approxTokens}`);
  }
  return fullContent;
}
