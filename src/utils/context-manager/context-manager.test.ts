import { describe, it, expect, vi } from "vitest";
import { trimMessages, getContextStats } from "./context-manager";

const sys = { role: "system" as const, content: "you are an assistant" };
const user = (n: number) => ({
  role: "user" as const,
  content: `user message ${n}`,
});
const assistant = (n: number) => ({
  role: "assistant" as const,
  content: `assistant message ${n}`,
});

describe("trimMessages", () => {
  it("returns messages unchanged when under limit", () => {
    const messages = [sys, user(1), assistant(1), user(2)];
    const { trimmed, trimCount } = trimMessages(messages);
    expect(trimmed).toEqual(messages);
    expect(trimCount).toBe(0);
  });

  it("trims oldest non-system messages when over limit", () => {
    const messages = [
      sys,
      ...Array.from({ length: 22 }, (_, i) =>
        i % 2 === 0 ? user(i) : assistant(i),
      ),
    ];
    const { trimmed } = trimMessages(messages);
    expect(trimmed[0]).toEqual(sys);
    const nonSystem = trimmed.filter((m) => m.role !== "system");
    expect(nonSystem.length).toBe(20);
  });

  it("returns correct trimCount", () => {
    const messages = [sys, ...Array.from({ length: 25 }, (_, i) => user(i))];
    const { trimCount } = trimMessages(messages);
    expect(trimCount).toBe(5);
  });

  it("keeps the most recent messages after trimming", () => {
    const messages = [sys, ...Array.from({ length: 22 }, (_, i) => user(i))];
    const { trimmed } = trimMessages(messages);
    const nonSystem = trimmed.filter((m) => m.role !== "system");
    expect(nonSystem[nonSystem.length - 1].content).toBe("user message 21");
    expect(nonSystem[0].content).toBe("user message 2");
  });

  it("preserves system message at index 0 after trimming", () => {
    const messages = [sys, ...Array.from({ length: 25 }, (_, i) => user(i))];
    const { trimmed } = trimMessages(messages);
    expect(trimmed[0]).toEqual(sys);
  });

  it("handles messages with no system message", () => {
    const messages = Array.from({ length: 22 }, (_, i) => user(i));
    const { trimmed } = trimMessages(messages);
    expect(trimmed.length).toBe(20);
    expect(trimmed[0].role).not.toBe("system");
  });

  it("logs trim count when trimming occurs", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const messages = [sys, ...Array.from({ length: 22 }, (_, i) => user(i))];
    trimMessages(messages);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("trimmed 2 old messages"),
    );
    consoleSpy.mockRestore();
  });

  it("does not log when no trimming occurs", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const messages = [sys, user(1), assistant(1)];
    trimMessages(messages);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("getContextStats", () => {
  it("returns correct message count excluding system", () => {
    const messages = [sys, user(1), assistant(1), user(2)];
    const stats = getContextStats(messages);
    expect(stats).toContain("3 messages");
  });

  it("returns approximate token count", () => {
    const messages = [{ role: "user" as const, content: "a".repeat(400) }];
    const stats = getContextStats(messages);
    expect(stats).toContain("~100 tokens");
  });

  it("returns zero for empty messages", () => {
    const stats = getContextStats([]);
    expect(stats).toContain("0 messages");
    expect(stats).toContain("~0 tokens");
  });
});
