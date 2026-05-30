import { describe, it, expect } from "vitest";
import { parseToolCall, executeTool } from "./tool-parser";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("parseToolCall", () => {
  describe("valid tool calls", () => {
    it("parses a single argument tool call", () => {
      const result = parseToolCall("TOOL: read_file | src/index.ts");
      expect(result).toEqual({
        name: "read_file",
        argument: "src/index.ts",
        secondArgument: undefined,
      });
    });

    it("parses a two argument tool call", () => {
      const result = parseToolCall(
        "TOOL: write_file | src/index.ts | hello world",
      );
      expect(result).toEqual({
        name: "write_file",
        argument: "src/index.ts",
        secondArgument: "hello world",
      });
    });

    it("preserves pipe characters in file content (Bug 1 regression)", () => {
      const result = parseToolCall(
        "TOOL: write_file | test.md | this is either: PASS | FAIL",
      );
      expect(result).toEqual({
        name: "write_file",
        argument: "test.md",
        secondArgument: "this is either: PASS | FAIL",
      });
    });

    it("parses search_files with directory argument (Bug 6 regression)", () => {
      const result = parseToolCall(
        "TOOL: search_files | closure | 03-Domains/JavaScript",
      );
      expect(result).toEqual({
        name: "search_files",
        argument: "closure",
        secondArgument: "03-Domains/JavaScript",
      });
    });

    it("parses search_files without directory argument", () => {
      const result = parseToolCall("TOOL: search_files | closure");
      expect(result).toEqual({
        name: "search_files",
        argument: "closure",
        secondArgument: undefined,
      });
    });

    it("handles filenames with spaces", () => {
      const result = parseToolCall(
        "TOOL: read_file | 03-Domains/JavaScript/07-Event Loop.md",
      );
      expect(result).toEqual({
        name: "read_file",
        argument: "03-Domains/JavaScript/07-Event Loop.md",
        secondArgument: undefined,
      });
    });

    it("truncates content at first newline — model sends single-line content in practice", () => {
      const result = parseToolCall(
        "TOOL: write_file | notes.md | line one\nline two\nline three",
      );
      expect(result).toEqual({
        name: "write_file",
        argument: "notes.md",
        secondArgument: "line one",
      });
    });
  });

  describe("invalid tool calls", () => {
    it("returns null when no TOOL prefix", () => {
      const result = parseToolCall("read_file | src/index.ts");
      expect(result).toBeNull();
    });

    it("returns null for unknown tool name", () => {
      const result = parseToolCall("TOOL: delete_file | src/index.ts");
      expect(result).toBeNull();
    });

    it("returns null for empty string", () => {
      const result = parseToolCall("");
      expect(result).toBeNull();
    });

    it("returns null for plain assistant text", () => {
      const result = parseToolCall(
        "The file contains information about closures.",
      );
      expect(result).toBeNull();
    });
  });
});

describe("executeTool", () => {
  it("calls single argument tool correctly", () => {
    const result = executeTool({ name: "list_directory", argument: "." });
    expect(result.success).toBeDefined();
  });

  it("calls double argument tool correctly", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-exec-test-"));
    const result = executeTool({
      name: "search_files",
      argument: "anything",
      secondArgument: tmpDir,
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("No matches found");
  });

  it("passes secondArgument to write_file", () => {
    const result = executeTool({
      name: "write_file",
      argument: "/tmp/agent-executor-test.md",
      secondArgument: "executor test content",
    });
    expect(result.success).toBe(true);
  });
});

describe("parseToolCall — git tools", () => {
  it("parses git_status with no argument", () => {
    const result = parseToolCall("TOOL: git_status");
    expect(result).toEqual({
      name: "git_status",
      argument: "",
      secondArgument: undefined,
    });
  });

  it("parses git_diff with no argument", () => {
    const result = parseToolCall("TOOL: git_diff");
    expect(result).toEqual({
      name: "git_diff",
      argument: "",
      secondArgument: undefined,
    });
  });

  it("parses git_diff with file path", () => {
    const result = parseToolCall("TOOL: git_diff | src/index.ts");
    expect(result).toEqual({
      name: "git_diff",
      argument: "src/index.ts",
      secondArgument: undefined,
    });
  });

  it("parses git_log with no argument", () => {
    const result = parseToolCall("TOOL: git_log");
    expect(result).toEqual({
      name: "git_log",
      argument: "",
      secondArgument: undefined,
    });
  });

  it("parses git_add with no argument", () => {
    const result = parseToolCall("TOOL: git_add");
    expect(result).toEqual({
      name: "git_add",
      argument: "",
      secondArgument: undefined,
    });
  });

  it("parses git_add with file path", () => {
    const result = parseToolCall("TOOL: git_add | src/index.ts");
    expect(result).toEqual({
      name: "git_add",
      argument: "src/index.ts",
      secondArgument: undefined,
    });
  });

  it("parses git_commit with message", () => {
    const result = parseToolCall("TOOL: git_commit | feat: add new feature");
    expect(result).toEqual({
      name: "git_commit",
      argument: "feat: add new feature",
      secondArgument: undefined,
    });
  });
});
