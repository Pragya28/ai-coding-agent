import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { readFile } from "./read-file";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-test-"));
});

describe("readFile", () => {
  it("reads content of an existing file", () => {
    const filePath = path.join(tmpDir, "hello.md");
    fs.writeFileSync(filePath, "hello world");
    const result = readFile(filePath);
    expect(result.success).toBe(true);
    expect(result.output).toBe("hello world");
  });

  it("handles filenames with spaces", () => {
    const filePath = path.join(tmpDir, "07-Event Loop.md");
    fs.writeFileSync(filePath, "event loop content");
    const result = readFile(filePath);
    expect(result.success).toBe(true);
    expect(result.output).toBe("event loop content");
  });

  it("returns failure for nonexistent file", () => {
    const result = readFile(path.join(tmpDir, "nonexistent.md"));
    expect(result.success).toBe(false);
    expect(result.output).toContain("Error");
  });

  it("reads multiline content correctly", () => {
    const filePath = path.join(tmpDir, "notes.md");
    const content = "line one\nline two\nline three";
    fs.writeFileSync(filePath, content);
    const result = readFile(filePath);
    expect(result.success).toBe(true);
    expect(result.output).toBe(content);
  });
});
