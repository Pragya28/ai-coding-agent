import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { searchFiles } from "./search-files";

let tmpDir: string;

function seed(files: Record<string, string>) {
  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(tmpDir, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf-8");
  }
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-search-test-"));
});

describe("searchFiles", () => {
  it("finds a pattern in a single file", () => {
    seed({ "notes.md": "closure is a function that remembers its scope" });
    const result = searchFiles("closure", tmpDir);
    expect(result.success).toBe(true);
    expect(result.output).toContain("notes.md");
    expect(result.output).toContain("closure");
  });

  it("finds matches across multiple files", () => {
    seed({
      "a.md": "closure example one",
      "b.md": "closure example two",
      "c.md": "no match here",
    });
    const result = searchFiles("closure", tmpDir);
    expect(result.success).toBe(true);
    expect(result.output).toContain("a.md");
    expect(result.output).toContain("b.md");
    expect(result.output).not.toContain("c.md");
  });

  it("returns clean no-match message when pattern not found", () => {
    seed({ "notes.md": "some content here" });
    const result = searchFiles("zzznomatch", tmpDir);
    expect(result.success).toBe(true);
    expect(result.output).toContain("No matches found");
  });

  it("respects the directory argument — does not search outside it (Bug 6 regression)", () => {
    seed({
      "js/closure.md": "closure in js",
      "react/closure.md": "closure in react",
    });
    const result = searchFiles("closure", path.join(tmpDir, "js"));
    expect(result.success).toBe(true);
    expect(result.output).toContain("js/closure.md");
    expect(result.output).not.toContain("react/closure.md");
  });

  it("searches recursively into subdirectories", () => {
    seed({ "a/b/deep.md": "async await pattern" });
    const result = searchFiles("async", tmpDir);
    expect(result.success).toBe(true);
    expect(result.output).toContain("deep.md");
  });

  it("is case insensitive", () => {
    seed({ "notes.md": "Closure is important" });
    const result = searchFiles("closure", tmpDir);
    expect(result.success).toBe(true);
    expect(result.output).toContain("notes.md");
  });

  it("skips node_modules directory", () => {
    seed({
      "node_modules/lib.md": "closure inside node_modules",
      "src/notes.md": "no match here",
    });
    const result = searchFiles("closure", tmpDir);
    expect(result.success).toBe(true);
    expect(result.output).toContain("No matches found");
  });
  it("falls back to workspace root on nonexistent directory and logs warning (Bug 19 regression)", () => {
    const result = searchFiles("nonononono", path.join(tmpDir, "nonexistent"));
    // Bug 19 fix: falls back to workspace root instead of crashing
    expect(result.success).toBe(true);
    expect(result.output).toContain("No matches found");
  });
  it("includes line numbers in output", () => {
    seed({ "notes.md": "line one\nclosure here\nline three" });
    const result = searchFiles("closure", tmpDir);
    expect(result.success).toBe(true);
    expect(result.output).toContain("Line 2");
  });

  it("handles filenames with spaces", () => {
    seed({ "07-Event Loop.md": "event loop and closure" });
    const result = searchFiles("closure", tmpDir);
    expect(result.success).toBe(true);
    expect(result.output).toContain("07-Event Loop.md");
  });
});
