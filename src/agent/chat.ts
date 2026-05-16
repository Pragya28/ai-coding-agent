import { OLLAMA_URL } from "../constants";
import { SYSTEM_PROMPT } from "../prompts/system";
import { trimMessages } from "../utils/context-manager/context-manager";
import { Logger } from "../utils/logger";
import { startSpinner } from "../utils/spinner";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export function createMessages(): Message[] {
  return [{ role: "system", content: SYSTEM_PROMPT }];
}

export const messages: Message[] = createMessages();

export async function callOllama(
  model: string,
  logger?: Logger,
): Promise<string> {
  const { trimmed, trimCount } = trimMessages(messages);

  if (trimCount > 0 && logger) {
    logger.logSystem(`Context trimmed: removed ${trimCount} old messages`);
  }

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
