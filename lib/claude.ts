import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MAX_RETRIES = 3;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateDocument(
  systemPrompt: string,
  jsonData: string
): Promise<string> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 8192,
        messages: [
          {
            role: "user",
            content: `Here is the screenplay extraction data:\n\n${jsonData}\n\n${systemPrompt}`,
          },
        ],
      });

      const textBlock = message.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text response from Claude");
      }

      return textBlock.text;
    } catch (error: unknown) {
      const isRateLimit =
        error instanceof Anthropic.RateLimitError ||
        (error instanceof Anthropic.APIError && error.status === 429);

      if (isRateLimit && attempt < MAX_RETRIES) {
        // Exponential backoff: 15s, 30s, 60s
        const waitMs = 15000 * Math.pow(2, attempt);
        await sleep(waitMs);
        continue;
      }

      throw error;
    }
  }

  throw new Error("Max retries exceeded");
}
