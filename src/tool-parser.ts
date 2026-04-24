import { tools, ToolName, ToolResult } from "./tools";

export interface ToolCall {
  name: ToolName;
  argument: string;
}

// Model will respond in this format when it wants to call a tool:
// TOOL: tool_name | argument

export function parseToolCall(response: string): ToolCall | null {
  const match = response.match(/TOOL:\s*(\w+)\s*\|\s*(.+)/);
  if (!match) return null;

  const name = match[1] as ToolName;
  if (!tools[name]) {
    console.log(`[Ignored invalid tool: ${name}]`);
    return null;
  }

  return { name, argument: match[2].trim() };
}

export function executeTool(toolCall: ToolCall): ToolResult {
  return tools[toolCall.name](toolCall.argument);
}
