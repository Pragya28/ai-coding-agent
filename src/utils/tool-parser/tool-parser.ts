import { ToolName, ToolResult, tools } from "../../tools";

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

  // Grab everything after TOOL: name | and trim trailing whitespace/newlines
  const raw = match[2]
    .trim()
    .replace(/\n[\s\S]*$/, "")
    .trim();

  let argument: string;
  let secondArgument: string | undefined;

  if (name === "write_file") {
    // split on FIRST pipe only — content may contain pipes
    const pipeIndex = raw.indexOf("|");
    if (pipeIndex === -1) {
      argument = raw;
    } else {
      argument = raw.slice(0, pipeIndex).trim();
      secondArgument = raw.slice(pipeIndex + 1).trim();
    }
  } else {
    // split normally for all other tools
    const parts = raw.split(/\s*\|\s*/);
    argument = parts[0].trim();
    secondArgument = parts[1]?.trim();
  }

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
