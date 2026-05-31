import * as fs from "fs";
import * as path from "path";
import { LOGS_DIR } from "../constants";
import { Message } from "../types";

export interface SessionMeta {
  name: string;
  fullPath: string;
  mdPath: string;
  jsonPath: string;
  date: Date;
  messageCount: number;
  workspace?: string;
  firstMessage?: string;
}

export function listRecentSessions(limit = 10): SessionMeta[] {
  if (!fs.existsSync(LOGS_DIR)) return [];

  return fs
    .readdirSync(LOGS_DIR)
    .filter((f) => {
      const fullPath = path.join(LOGS_DIR, f);
      return (
        fs.statSync(fullPath).isDirectory() &&
        f.startsWith("session-") &&
        fs.existsSync(path.join(fullPath, "session.json"))
      );
    })
    .map((f) => {
      const fullPath = path.join(LOGS_DIR, f);
      const jsonPath = path.join(fullPath, "session.json");
      const mdPath = path.join(fullPath, "session.md");
      const stat = fs.statSync(fullPath);
      let messageCount = 0;
      let firstMessage: string | undefined;

      try {
        const msgs = JSON.parse(
          fs.readFileSync(jsonPath, "utf-8"),
        ) as Message[];
        const nonSystem = msgs.filter((m) => m.role !== "system");
        messageCount = nonSystem.length;
        firstMessage = nonSystem[0]?.content?.slice(0, 60).replace(/\n/g, " ");
      } catch {}

      return {
        name: f,
        fullPath,
        mdPath,
        jsonPath,
        date: stat.mtime,
        messageCount,
        firstMessage,
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}

export function loadSessionMessages(jsonPath: string): Message[] {
  try {
    return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  } catch {
    return [];
  }
}

export function formatSessionDate(date: Date): string {
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
