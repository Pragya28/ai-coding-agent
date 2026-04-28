import { ToolName, ToolResult, tools } from "./tools/index";

export interface ToolCall {
  name: ToolName;
  argument: string;
  secondArgument?: string;
}

// Tool call formats:
// TOOL: tool_name | argument
// TOOL: write_file | path/to/file | content here

export function parseToolCall(response: string): ToolCall | null {
  const match = response.match(/TOOL:\s*(\w+)\s*\|\s*(.+)/s);
  if (!match) return null;

  const name = match[1] as ToolName;
  if (!tools[name]) {
    console.log(`[Ignored invalid tool: ${name}]`);
    return null;
  }

  // Split remaining by first | to get argument and optional second argument
  const parts = match[2].split(/\|(.+)/s);
  const argument = parts[0].trim();
  const secondArgument = parts[1]?.trim();

  return { name, argument, secondArgument };
}

export function executeTool(toolCall: ToolCall): ToolResult {
  if (toolCall.secondArgument !== undefined) {
    return (tools[toolCall.name] as (a: string, b: string) => ToolResult)(
      toolCall.argument,
      toolCall.secondArgument,
    );
  }
  return (tools[toolCall.name] as (a: string) => ToolResult)(toolCall.argument);
}
