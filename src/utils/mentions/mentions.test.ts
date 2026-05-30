import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { processMentions } from "./mentions";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-mentions-test-"));
});

describe("processMentions", () => {
  it("returns input unchanged when no mentions", () => {
    const result = processMentions("what is a closure?");
    expect(result.processedInput).toBe("what is a closure?");
    expect(result.mentionedFiles).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("injects file content before user message", () => {
    const filePath = path.join(tmpDir, "notes.md");
    fs.writeFileSync(filePath, "closure content here");
    const result = processMentions(`explain @${filePath}`);
    expect(result.processedInput).toContain("closure content here");
    expect(result.processedInput).toContain(`explain @${filePath}`);
    expect(result.mentionedFiles).toContain(filePath);
    expect(result.errors).toHaveLength(0);
  });

  it("file content appears before the user message", () => {
    const filePath = path.join(tmpDir, "notes.md");
    fs.writeFileSync(filePath, "file content");
    const result = processMentions(`explain @${filePath}`);
    const fileContentIndex = result.processedInput.indexOf("file content");
    const userMessageIndex = result.processedInput.indexOf("explain");
    expect(fileContentIndex).toBeLessThan(userMessageIndex);
  });

  it("handles multiple mentions in one message", () => {
    const file1 = path.join(tmpDir, "a.md");
    const file2 = path.join(tmpDir, "b.md");
    fs.writeFileSync(file1, "content a");
    fs.writeFileSync(file2, "content b");
    const result = processMentions(`compare @${file1} and @${file2}`);
    expect(result.mentionedFiles).toHaveLength(2);
    expect(result.processedInput).toContain("content a");
    expect(result.processedInput).toContain("content b");
    expect(result.errors).toHaveLength(0);
  });

  it("adds error for nonexistent file", () => {
    const fakePath = path.join(tmpDir, "nonexistent.md");
    const result = processMentions(`explain @${fakePath}`);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("file not found");
    expect(result.mentionedFiles).toHaveLength(0);
  });

  it("adds error when mention is a directory", () => {
    const dirPath = path.join(tmpDir, "subdir");
    fs.mkdirSync(dirPath);
    const result = processMentions(`explain @${dirPath}`);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("is a directory");
    expect(result.mentionedFiles).toHaveLength(0);
  });

  it("handles mix of valid and invalid mentions", () => {
    const validFile = path.join(tmpDir, "valid.md");
    fs.writeFileSync(validFile, "valid content");
    const fakePath = path.join(tmpDir, "missing.md");
    const result = processMentions(`explain @${validFile} and @${fakePath}`);
    expect(result.mentionedFiles).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.processedInput).toContain("valid content");
  });

  it("handles filenames with spaces", () => {
    const filePath = path.join(tmpDir, "07-Event Loop.md");
    fs.writeFileSync(filePath, "event loop content");
    // spaces break @mention regex — document this as known limitation
    const result = processMentions(`explain @${filePath}`);
    // path with spaces won't match [\w./-]+ — no mention extracted
    expect(result.mentionedFiles).toHaveLength(0);
    expect(result.processedInput).toBe(`explain @${filePath}`);
  });

  it("returns empty arrays when input has no @ symbol", () => {
    const result = processMentions("just a normal question");
    expect(result.mentionedFiles).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(result.processedInput).toBe("just a normal question");
  });
});
