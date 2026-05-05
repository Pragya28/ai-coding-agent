interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const MAX_MESSAGES = 20; // max non-system messages to keep

export function trimMessages(messages: Message[]): Message[] {
  const systemMessage = messages.find((m) => m.role === "system");
  const nonSystemMessages = messages.filter((m) => m.role !== "system");

  if (nonSystemMessages.length <= MAX_MESSAGES) {
    return messages;
  }

  console.log(
    `[Context: trimmed ${nonSystemMessages.length - MAX_MESSAGES} old messages]`,
  );

  // Always keep system message + most recent MAX_MESSAGES
  const trimmed = nonSystemMessages.slice(-MAX_MESSAGES);
  return systemMessage ? [systemMessage, ...trimmed] : trimmed;
}

export function getContextStats(messages: Message[]): string {
  const nonSystem = messages.filter((m) => m.role !== "system");
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  const approxTokens = Math.round(totalChars / 4);
  return `[Context: ${nonSystem.length} messages, ~${approxTokens} tokens]`;
}
