import { TaskType } from "./router";

const MODEL_MAP: Record<TaskType, string> = {
  file_operation: "qwen2.5-coder:3b",
  shell_command: "qwen2.5-coder:3b",
  search: "qwen2.5-coder:3b",
  general: "qwen2.5-coder:3b",
  explanation: "qwen2.5-coder:3b",
  code_generation: "qwen2.5-coder:3b",
  git: "qwen2.5-coder:3b",
};

export function selectModel(task: TaskType): string {
  return MODEL_MAP[task];
}
