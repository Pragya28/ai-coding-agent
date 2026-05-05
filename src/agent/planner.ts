import * as readline from "readline";

export async function confirmPlan(
  plan: string,
  rl: readline.Interface,
): Promise<boolean> {
  console.log(`\n[Plan Mode] The agent wants to:\n${plan}\n`);

  return new Promise((resolve) => {
    rl.question("Proceed? (y/n): ", (answer) => {
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

export function extractPlan(response: string): string | null {
  const match = response.match(/PLAN:\s*(.+?)(?:\n|$)/s);
  return match ? match[1].trim() : null;
}
