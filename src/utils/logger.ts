import * as fs from "fs";
import * as path from "path";
import { LOGS_DIR } from "../constants";
import { Message } from "../types";

function getSessionDir(): string {
  const now = new Date();
  const date = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return path.join(LOGS_DIR, `session-${date}`);
}

function cleanOldSessions() {
  if (!fs.existsSync(LOGS_DIR)) return;

  const sessions = fs
    .readdirSync(LOGS_DIR)
    .filter((f) => fs.statSync(path.join(LOGS_DIR, f)).isDirectory())
    .map((f) => ({
      name: f,
      fullPath: path.join(LOGS_DIR, f),
      mtime: fs.statSync(path.join(LOGS_DIR, f)).mtime,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  sessions.forEach((session, index) => {
    if (session.mtime < cutoff || index >= 50) {
      fs.rmSync(session.fullPath, { recursive: true });
    }
  });
}

function ensureLogsDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
  cleanOldSessions();
}

export class Logger {
  private sessionDir: string;
  private mdPath: string;
  private jsonPath: string;
  private turnStart: number = Date.now();

  constructor(sessionDir?: string) {
    ensureLogsDir();
    this.sessionDir = sessionDir ?? getSessionDir();
    fs.mkdirSync(this.sessionDir, { recursive: true });
    this.mdPath = path.join(this.sessionDir, "session.md");
    this.jsonPath = path.join(this.sessionDir, "session.json");
    this.write(
      `# Session Log\n\n**Started:** ${new Date().toLocaleString()}\n\n---\n`,
    );
  }

  private write(content: string) {
    fs.appendFileSync(this.mdPath, content, "utf-8");
  }

  saveMessages(messages: Message[]) {
    fs.writeFileSync(this.jsonPath, JSON.stringify(messages, null, 2), "utf-8");
  }

  getSessionDir(): string {
    return this.sessionDir;
  }

  getMdPath(): string {
    return this.mdPath;
  }

  logSessionStart(
    workspace: string,
    fileCount: number,
    folderCount: number,
    cacheStatus: string,
    routerModel: string,
    taskModel: string,
    resumedFrom?: string,
  ) {
    this.write(`\n> 📁 Workspace: \`${workspace}\`\n`);
    this.write(
      `> 🗂 Indexed: ${fileCount} files, ${folderCount} folders (${cacheStatus})\n`,
    );
    this.write(
      `> 🔧 Models: router=\`${routerModel}\` | tasks=\`${taskModel}\`\n`,
    );
    if (resumedFrom) {
      this.write(`> 🔁 Resumed from: \`${resumedFrom}\`\n`);
    }
  }

  logUser(input: string) {
    this.turnStart = Date.now();
    this.write(`\n## 🧑 User\n\`\`\`\n${input}\n\`\`\`\n`);
  }

  logRouter(taskType: string, model: string) {
    this.write(`\n> 🔀 Router: **${taskType}** → \`${model}\`\n`);
    this.write(`> 🤖 Model: \`${model}\`\n`);
  }

  logTool(
    name: string,
    argument: string,
    secondArgument: string | undefined,
    success: boolean,
    output: string,
  ) {
    const args = secondArgument ? `${argument} | ${secondArgument}` : argument;
    const status = success ? "✅" : "❌";
    const limit = name === "search_files" ? 2000 : 500;
    this.write(
      `\n> ${status} Tool: \`${name}\` | \`${args}\`\n> Result: ${success ? "success" : "failed"}\n\`\`\`\n${output.slice(0, limit)}${output.length > limit ? "\n...(truncated)" : ""}\n\`\`\`\n`,
    );
  }

  logAgent(response: string) {
    this.write(`\n## 🤖 Agent\n${response}\n`);
  }

  logTurnEnd(iterations: number, maxIterations: number) {
    const elapsed = ((Date.now() - this.turnStart) / 1000).toFixed(1);
    this.write(
      `\n> ⏱ ${elapsed}s | 🔁 Iterations: ${iterations}/${maxIterations}\n`,
    );
  }

  logContextStats(stats: string) {
    this.write(`\n> ${stats}\n`);
  }

  logSystem(message: string) {
    this.write(`\n> ⚙️ System: ${message}\n`);
  }

  logSessionEnd() {
    this.write(`\n---\n\n**Session ended:** ${new Date().toLocaleString()}\n`);
  }
}
