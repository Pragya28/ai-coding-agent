import { describe, it, expect, beforeEach, vi } from "vitest";
import * as readline from "readline";
import { handleCommand } from "./commands";
import { messages } from "../../agent/chat";

function makeRl() {
  return {
    question: vi.fn(),
    close: vi.fn(),
  } as unknown as readline.Interface;
}

function makeLogger() {
  return {
    logSystem: vi.fn(),
    logSessionEnd: vi.fn(),
  } as any;
}

beforeEach(() => {
  // Reset messages to just system message before each test
  messages.splice(1);
});

describe("handleCommand", () => {
  it("returns not handled for non-command input", () => {
    const result = handleCommand("read my file", makeLogger(), makeRl());
    expect(result.handled).toBe(false);
  });

  it("returns not handled for empty input", () => {
    const result = handleCommand("", makeLogger(), makeRl());
    expect(result.handled).toBe(false);
  });

  it("handles /help command", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = handleCommand("/help", makeLogger(), makeRl());
    expect(result.handled).toBe(true);
    expect(result).not.toHaveProperty("exit", true);
    consoleSpy.mockRestore();
  });

  it("handles /status command", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = handleCommand("/status", makeLogger(), makeRl());
    expect(result.handled).toBe(true);
    expect(result).not.toHaveProperty("exit", true);
    consoleSpy.mockRestore();
  });

  it("handles /exit command and calls logSessionEnd", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = makeLogger();
    const rl = makeRl();
    const result = handleCommand("/exit", logger, rl);
    expect(result.handled).toBe(true);
    expect(result).toHaveProperty("exit", true);
    expect(logger.logSessionEnd).toHaveBeenCalled();
    expect(rl.close).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("handles /quit as alias for exit", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = makeLogger();
    const result = handleCommand("/quit", logger, makeRl());
    expect(result.handled).toBe(true);
    expect(result).toHaveProperty("exit", true);
    consoleSpy.mockRestore();
  });

  it("handles /clear and keeps only system message", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    messages.push({ role: "user", content: "hello" });
    messages.push({ role: "assistant", content: "world" });
    expect(messages.length).toBe(3);
    const logger = makeLogger();
    handleCommand("/clear", logger, makeRl());
    expect(messages.length).toBe(1);
    expect(messages[0].role).toBe("system");
    expect(logger.logSystem).toHaveBeenCalledWith(
      expect.stringContaining("cleared"),
    );
    consoleSpy.mockRestore();
  });

  it("handles unknown command gracefully", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = handleCommand("/unknown", makeLogger(), makeRl());
    expect(result.handled).toBe(true);
    expect(result).not.toHaveProperty("exit", true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unknown command"),
    );
    consoleSpy.mockRestore();
  });

  it("is case insensitive for command names", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = handleCommand("/HELP", makeLogger(), makeRl());
    expect(result.handled).toBe(true);
    consoleSpy.mockRestore();
  });
});
