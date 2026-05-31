import "dotenv/config";
import path from "path";

export const OLLAMA_URL = "http://localhost:11434/api/chat";
export const MODEL = "qwen2.5-coder:3b";
export const ROUTER_MODEL = "lfm2.5-thinking:1.2b";
export const MAX_ITERATIONS = 5;
export const WORKSPACE = process.env.WORKSPACE ?? process.cwd();
export const flags = {
  PLAN_MODE: process.argv.includes("--plan"),
  VERBOSE: process.argv.includes("--verbose"),
  REINDEX: process.argv.includes("--reindex"),
  RESUME: process.argv.includes("--resume"),
};
export const LOGS_DIR = path.resolve(__dirname, "../logs");
