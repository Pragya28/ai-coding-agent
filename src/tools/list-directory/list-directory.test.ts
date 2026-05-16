import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { listDirectory } from "./list-directory";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-list-test-"));
});

describe("listDirectory", () => {
  it("lists files and directories", () => {
    fs.writeFileSync(path.join(tmpDir, "notes.md"), "content");
    fs.mkdirSync(path.join(tmpDir, "subdir"));
    const result = listDirectory(tmpDir);
    expect(result.success).toBe(true);
    expect(result.output).toContain("[file] notes.md");
    expect(result.output).toContain("[dir] subdir");
  });

  it("returns failure for nonexistent directory", () => {
    const result = listDirectory(path.join(tmpDir, "nonexistent"));
    expect(result.success).toBe(false);
    expect(result.output).toContain("Error");
  });

  it("lists files with spaces in names", () => {
    fs.writeFileSync(path.join(tmpDir, "07-Event Loop.md"), "content");
    const result = listDirectory(tmpDir);
    expect(result.success).toBe(true);
    expect(result.output).toContain("[file] 07-Event Loop.md");
  });

  it("returns empty output for empty directory", () => {
    const result = listDirectory(tmpDir);
    expect(result.success).toBe(true);
    expect(result.output).toBe("");
  });
});
