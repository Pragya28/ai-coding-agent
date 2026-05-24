import * as fs from "fs";
import * as path from "path";
import { WORKSPACE } from "../constants";

interface MentionResult {
  processedInput: string;
  mentionedFiles: string[];
  errors: string[];
}

export function processMentions(input: string): MentionResult {
  const mentionedFiles: string[] = [];
  const errors: string[] = [];

  // Match @path patterns — stop at whitespace or end of string
  const mentionRegex = /@([\w./-]+)/g;
  const matches = [...input.matchAll(mentionRegex)];

  if (matches.length === 0) {
    return { processedInput: input, mentionedFiles: [], errors: [] };
  }

  const fileContexts: string[] = [];

  for (const match of matches) {
    const rawPath = match[1];
    const resolved = path.isAbsolute(rawPath)
      ? rawPath
      : path.resolve(WORKSPACE, rawPath);

    try {
      if (!fs.existsSync(resolved)) {
        errors.push(`@${rawPath}: file not found`);
        continue;
      }

      const stat = fs.statSync(resolved);
      if (stat.isDirectory()) {
        errors.push(`@${rawPath}: is a directory, not a file`);
        continue;
      }

      const content = fs.readFileSync(resolved, "utf-8");
      mentionedFiles.push(rawPath);

      fileContexts.push(
        `--- @${rawPath} ---\n${content}\n--- end of @${rawPath} ---`,
      );
    } catch (error) {
      errors.push(`@${rawPath}: ${error}`);
    }
  }

  // Prepend file contents to the user message
  const processedInput =
    fileContexts.length > 0
      ? `${fileContexts.join("\n\n")}\n\n${input}`
      : input;

  return { processedInput, mentionedFiles, errors };
}
