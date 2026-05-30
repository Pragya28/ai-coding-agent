import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { createIgnoreMatcher, DEFAULT_IGNORED } from "./ignore-patterns";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-ignore-test-"));
});

describe("DEFAULT_IGNORED", () => {
  it("contains expected default patterns", () => {
    expect(DEFAULT_IGNORED).toContain(".git");
    expect(DEFAULT_IGNORED).toContain("node_modules");
    expect(DEFAULT_IGNORED).toContain(".DS_Store");
    expect(DEFAULT_IGNORED).toContain("dist");
    expect(DEFAULT_IGNORED).toContain(".env");
  });
});

describe("createIgnoreMatcher", () => {
  it("ignores node_modules by default", () => {
    const ig = createIgnoreMatcher(tmpDir);
    expect(ig.ignores("node_modules")).toBe(true);
    expect(ig.ignores("node_modules/some-package/index.js")).toBe(true);
  });

  it("ignores .git by default", () => {
    const ig = createIgnoreMatcher(tmpDir);
    expect(ig.ignores(".git")).toBe(true);
    expect(ig.ignores(".git/config")).toBe(true);
  });

  it("ignores .DS_Store by default", () => {
    const ig = createIgnoreMatcher(tmpDir);
    expect(ig.ignores(".DS_Store")).toBe(true);
  });

  it("ignores image files by default", () => {
    const ig = createIgnoreMatcher(tmpDir);
    expect(ig.ignores("assets/image.png")).toBe(true);
    expect(ig.ignores("photo.jpg")).toBe(true);
    expect(ig.ignores("icon.svg")).toBe(true);
  });

  it("does not ignore regular source files", () => {
    const ig = createIgnoreMatcher(tmpDir);
    expect(ig.ignores("src/index.ts")).toBe(false);
    expect(ig.ignores("README.md")).toBe(false);
    expect(ig.ignores("package.json")).toBe(false);
  });

  it("reads and applies .gitignore patterns when file exists", () => {
    fs.writeFileSync(
      path.join(tmpDir, ".gitignore"),
      "custom-output/\n*.tmp\n# comment line\n",
    );
    const ig = createIgnoreMatcher(tmpDir);
    expect(ig.ignores("custom-output/file.js")).toBe(true);
    expect(ig.ignores("temp.tmp")).toBe(true);
  });

  it("ignores comment lines in .gitignore", () => {
    fs.writeFileSync(
      path.join(tmpDir, ".gitignore"),
      "# this is a comment\nreal-pattern/\n",
    );
    const ig = createIgnoreMatcher(tmpDir);
    expect(ig.ignores("real-pattern/file.js")).toBe(true);
  });

  it("handles missing .gitignore gracefully", () => {
    // no .gitignore in tmpDir
    expect(() => createIgnoreMatcher(tmpDir)).not.toThrow();
    const ig = createIgnoreMatcher(tmpDir);
    expect(ig.ignores("node_modules")).toBe(true); // defaults still apply
  });

  it("handles empty .gitignore gracefully", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "");
    expect(() => createIgnoreMatcher(tmpDir)).not.toThrow();
    const ig = createIgnoreMatcher(tmpDir);
    expect(ig.ignores("node_modules")).toBe(true);
  });

  it("gitignore patterns do not override non-ignored source files", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "dist/\n");
    const ig = createIgnoreMatcher(tmpDir);
    expect(ig.ignores("src/index.ts")).toBe(false);
  });
});
