import { describe, it, expect, vi, beforeEach } from "vitest";
import { gitStatus, gitDiff, gitLog, gitAdd, gitCommit } from "./git";

vi.mock("child_process", () => ({
  execSync: vi.fn().mockReturnValue("mock output"),
}));

import { execSync } from "child_process";

beforeEach(() => {
  vi.mocked(execSync).mockReturnValue("mock output" as any);
});

describe("gitStatus", () => {
  it("calls git status", () => {
    const result = gitStatus();
    expect(execSync).toHaveBeenCalledWith("git status", expect.any(Object));
    expect(result.success).toBe(true);
  });
});

describe("gitDiff", () => {
  it("calls git diff with no argument", () => {
    gitDiff();
    expect(execSync).toHaveBeenCalledWith("git diff", expect.any(Object));
  });

  it("calls git diff with file path", () => {
    gitDiff("src/index.ts");
    expect(execSync).toHaveBeenCalledWith(
      "git diff src/index.ts",
      expect.any(Object),
    );
  });
});

describe("gitLog", () => {
  it("calls git log with default args", () => {
    gitLog();
    expect(execSync).toHaveBeenCalledWith(
      "git log --oneline -10",
      expect.any(Object),
    );
  });

  it("calls git log with custom args", () => {
    gitLog("--oneline -5");
    expect(execSync).toHaveBeenCalledWith(
      "git log --oneline -5",
      expect.any(Object),
    );
  });
});

describe("gitAdd", () => {
  it("calls git add . with no argument", () => {
    gitAdd();
    expect(execSync).toHaveBeenCalledWith("git add .", expect.any(Object));
  });

  it("calls git add with file path", () => {
    gitAdd("src/index.ts");
    expect(execSync).toHaveBeenCalledWith(
      "git add src/index.ts",
      expect.any(Object),
    );
  });
});

describe("gitCommit", () => {
  it("commits with a valid message", () => {
    const result = gitCommit("feat: add new feature");
    expect(execSync).toHaveBeenCalledWith(
      `git commit -m "feat: add new feature"`,
      expect.any(Object),
    );
    expect(result.success).toBe(true);
  });

  it("rejects empty commit message", () => {
    vi.mocked(execSync).mockClear();
    const result = gitCommit("");
    expect(result.success).toBe(false);
    expect(result.output).toContain("cannot be empty");
    expect(execSync).not.toHaveBeenCalled();
  });

  it("strips backticks from commit message", () => {
    gitCommit("feat: add `dangerous` feature");
    expect(execSync).toHaveBeenCalledWith(
      `git commit -m "feat: add dangerous feature"`,
      expect.any(Object),
    );
  });

  it("strips dollar signs from commit message", () => {
    gitCommit("feat: $bad message");
    expect(execSync).toHaveBeenCalledWith(
      `git commit -m "feat: bad message"`,
      expect.any(Object),
    );
  });

  it("returns failure on git error", () => {
    vi.mocked(execSync).mockImplementationOnce(() => {
      throw { stderr: "nothing to commit" };
    });
    const result = gitCommit("feat: empty commit");
    expect(result.success).toBe(false);
    expect(result.output).toContain("nothing to commit");
  });
});
