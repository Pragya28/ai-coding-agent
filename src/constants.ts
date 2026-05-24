import "dotenv/config";

export const OLLAMA_URL = "http://localhost:11434/api/chat";
export const MODEL = "qwen2.5-coder:3b";
export const PLAN_MODE = process.argv.includes("--plan");
export const VERBOSE = process.argv.includes("--verbose");
export const REINDEX = process.argv.includes("--reindex");
export const MAX_ITERATIONS = 5;
export const WORKSPACE = process.env.WORKSPACE ?? process.cwd();
