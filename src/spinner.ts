const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function startSpinner(label: string): () => void {
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\r${frames[i % frames.length]} ${label}...`);
    i++;
  }, 80);

  // Return a stop function
  return () => {
    clearInterval(interval);
    process.stdout.write("\r\x1b[K"); // clear the spinner line
  };
}
