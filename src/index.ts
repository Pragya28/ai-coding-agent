import * as readline from "readline";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "llama3.2";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const messages: Message[] = [
  {
    role: "system",
    content: "You are a helpful coding assistant.",
  },
];

async function chat(userInput: string): Promise<string> {
  messages.push({ role: "user", content: userInput });

  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
    }),
  });

  const data = await response.json();
  const assistantMessage = data.message.content;

  messages.push({ role: "assistant", content: assistantMessage });

  return assistantMessage;
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('AI Coding Agent ready. Type "exit" to quit.\n');

  const askQuestion = () => {
    rl.question("You: ", async (input) => {
      const userInput = input.trim();

      if (userInput === "exit") {
        console.log("Goodbye!");
        rl.close();
        return;
      }

      if (!userInput) {
        askQuestion();
        return;
      }

      try {
        const response = await chat(userInput);
        console.log(`\nAgent: ${response}\n`);
      } catch (error) {
        console.error("Error:", error);
      }

      askQuestion();
    });
  };

  askQuestion();
}

main();
