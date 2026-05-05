import { OLLAMA_URL, SYSTEM_PROMPT } from "../constants";
import { trimMessages } from "../utils/context-manager";
import { startSpinner } from "../utils/spinner";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export function createMessages(): Message[] {
  return [{ role: "system", content: SYSTEM_PROMPT }];
}

export const messages: Message[] = createMessages();

export async function callOllama(model: string): Promise<string> {
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
