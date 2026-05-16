interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const MAX_MESSAGES = 20; // max non-system messages to keep

export function trimMessages(messages: Message[]): {
  trimmed: Message[];
  trimCount: number;
} {
  const systemMessage = messages.find((m) => m.role === "system");
  const nonSystemMessages = messages.filter((m) => m.role !== "system");

  if (nonSystemMessages.length <= MAX_MESSAGES) {
    return { trimmed: messages, trimCount: 0 };
  }

  const trimCount = nonSystemMessages.length - MAX_MESSAGES;
  console.log(`[Context: trimmed ${trimCount} old messages]`);

  const trimmed = nonSystemMessages.slice(-MAX_MESSAGES);
  return {
    trimmed: systemMessage ? [systemMessage, ...trimmed] : trimmed,
    trimCount,
  };
}

export function getContextStats(messages: Message[]): string {
  const nonSystem = messages.filter((m) => m.role !== "system");
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  const approxTokens = Math.round(totalChars / 4);
  return `[Context: ${nonSystem.length} messages, ~${approxTokens} tokens]`;
}
