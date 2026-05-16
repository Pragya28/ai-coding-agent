import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { writeFile } from "./write-file";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-test-"));
});

describe("writeFile", () => {
  it("creates a new file with content", () => {
    const filePath = path.join(tmpDir, "hello.md");
    const result = writeFile(filePath, "hello world");
    expect(result.success).toBe(true);
    expect(fs.readFileSync(filePath, "utf-8")).toBe("hello world");
  });

  it("overwrites an existing file with new content", () => {
    const filePath = path.join(tmpDir, "hello.md");
    fs.writeFileSync(filePath, "old content");
    const result = writeFile(filePath, "new content");
    expect(result.success).toBe(true);
    expect(fs.readFileSync(filePath, "utf-8")).toBe("new content");
  });

  it("returns unchanged when content is identical", () => {
    const filePath = path.join(tmpDir, "hello.md");
    fs.writeFileSync(filePath, "same content");
    const result = writeFile(filePath, "same content");
    expect(result.success).toBe(true);
    expect(result.output).toContain("unchanged");
  });

  it("creates nested directories if they don't exist", () => {
    const filePath = path.join(tmpDir, "a", "b", "c", "hello.md");
    const result = writeFile(filePath, "nested");
    expect(result.success).toBe(true);
    expect(fs.readFileSync(filePath, "utf-8")).toBe("nested");
  });

  it("preserves pipe characters in content (Bug 1 regression)", () => {
    const filePath = path.join(tmpDir, "test.md");
    const result = writeFile(filePath, "this is either: PASS | FAIL");
    expect(result.success).toBe(true);
    expect(fs.readFileSync(filePath, "utf-8")).toBe(
      "this is either: PASS | FAIL",
    );
  });

  it("handles filenames with spaces", () => {
    const filePath = path.join(tmpDir, "07-Event Loop.md");
    const result = writeFile(filePath, "event loop content");
    expect(result.success).toBe(true);
    expect(fs.readFileSync(filePath, "utf-8")).toBe("event loop content");
  });

  it("returns failure on invalid path", () => {
    const result = writeFile("/root/no-permission/file.md", "content");
    expect(result.success).toBe(false);
    expect(result.output).toContain("Error");
  });
});
