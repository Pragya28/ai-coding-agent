import { describe, it, expect } from "vitest";
import { parseToolCall } from "./tool-parser";

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
