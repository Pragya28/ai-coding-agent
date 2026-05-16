import * as fs from "fs";
import * as path from "path";

const LOGS_DIR = path.resolve("logs");

function ensureLogsDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function getSessionFilename(): string {
  const now = new Date();
  const date = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return path.join(LOGS_DIR, `session-${date}.md`);
}

export class Logger {
  private filePath: string;
  private buffer: string[] = [];

  constructor() {
    ensureLogsDir();
    this.filePath = getSessionFilename();
    this.write(
      `# Session Log\n\n**Started:** ${new Date().toLocaleString()}\n\n---\n`,
    );
  }

  private write(content: string) {
    this.buffer.push(content);
    fs.appendFileSync(this.filePath, content, "utf-8");
  }

  logUser(input: string) {
    this.write(`\n## 🧑 User\n\`\`\`\n${input}\n\`\`\`\n`);
  }

  logRouter(taskType: string, model: string) {
    this.write(`\n> 🔀 Router: **${taskType}** → \`${model}\`\n`);
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
    this.write(
      `\n> ${status} Tool: \`${name}\` | \`${args}\`\n> Result: ${success ? "success" : "failed"}\n\`\`\`\n${output.slice(0, 500)}${output.length > 500 ? "\n...(truncated)" : ""}\n\`\`\`\n`,
    );
  }

  logAgent(response: string) {
    this.write(`\n## 🤖 Agent\n${response}\n`);
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

  getFilePath(): string {
    return this.filePath;
  }
}
