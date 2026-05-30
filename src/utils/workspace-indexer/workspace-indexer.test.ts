import { describe, it, expect } from "vitest";
import { renderTree, flatFileList } from "./workspace-indexer";

const sampleTree = {
  src: {
    __files__: ["main.ts", "constants.ts"],
    utils: {
      __files__: ["logger.ts", "spinner.ts"],
    },
  },
  __files__: ["README.md", "package.json"],
};

describe("renderTree", () => {
  it("renders files at root level", () => {
    const output = renderTree(sampleTree);
    expect(output).toContain("README.md");
    expect(output).toContain("package.json");
  });

  it("renders directories", () => {
    const output = renderTree(sampleTree);
    expect(output).toContain("src/");
  });

  it("renders nested files", () => {
    const output = renderTree(sampleTree);
    expect(output).toContain("main.ts");
    expect(output).toContain("logger.ts");
  });

  it("indents nested content", () => {
    const output = renderTree(sampleTree);
    const lines = output.split("\n");
    const utilsLine = lines.find((l) => l.includes("utils/"));
    const loggerLine = lines.find((l) => l.includes("logger.ts"));
    expect(utilsLine).toBeDefined();
    expect(loggerLine).toBeDefined();
    // logger.ts should be indented more than utils/
    const utilsIndent = utilsLine!.length - utilsLine!.trimStart().length;
    const loggerIndent = loggerLine!.length - loggerLine!.trimStart().length;
    expect(loggerIndent).toBeGreaterThan(utilsIndent);
  });

  it("returns empty string for empty tree", () => {
    const output = renderTree({});
    expect(output).toBe("");
  });
});

describe("flatFileList", () => {
  it("returns all files as flat list", () => {
    const files = flatFileList(sampleTree);
    expect(files).toContain("README.md");
    expect(files).toContain("package.json");
    expect(files).toContain("src/main.ts");
    expect(files).toContain("src/constants.ts");
    expect(files).toContain("src/utils/logger.ts");
    expect(files).toContain("src/utils/spinner.ts");
  });

  it("returns empty array for empty tree", () => {
    const files = flatFileList({});
    expect(files).toHaveLength(0);
  });

  it("returns correct count", () => {
    const files = flatFileList(sampleTree);
    expect(files).toHaveLength(6);
  });

  it("prefixes nested files correctly", () => {
    const files = flatFileList(sampleTree);
    const nestedFiles = files.filter((f) => f.startsWith("src/utils/"));
    expect(nestedFiles).toHaveLength(2);
  });
});
