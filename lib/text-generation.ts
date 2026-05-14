import Anthropic from "@anthropic-ai/sdk";
import {
  DEFAULT_TEXT_PROVIDER,
  getTextProviderEnvKey,
  getTextProviderOption,
  normalizeTextProvider,
  type TextProvider,
} from "@/lib/ai-providers";

const MAX_RETRIES = 3;

type GenerateDocumentConfig = {
  apiKey: string;
  provider?: TextProvider;
  maxTokens?: number;
  model?: string;
};

type ResolvedTextGenerationConfig = {
  apiKey: string;
  provider: TextProvider;
};

type OpenAICompatibleResponse = {
  choices?: {
    message?: {
      content?: string | null;
    };
  }[];
};

type GeminiResponse = {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
  }[];
  promptFeedback?: {
    blockReason?: string;
  };
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUserPrompt(systemPrompt: string, input: string): string {
  return `Here is the screenplay extraction data:\n\n${input}\n\n${systemPrompt}`;
}

function getDefaultMaxTokens(provider: TextProvider): number {
  switch (provider) {
    case "anthropic":
      return 16384;
    case "deepseek":
      return 8192;
    case "gemini":
    case "openai":
    default:
      return 12000;
  }
}

function shouldRetry(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function getServerApiKey(provider: TextProvider): string {
  const envKey = getTextProviderEnvKey(provider);
  return process.env[envKey]?.trim() || "";
}

export function resolveTextGenerationConfig(body: {
  apiKey?: unknown;
  apiProvider?: unknown;
}): ResolvedTextGenerationConfig {
  const provider = normalizeTextProvider(body.apiProvider);
  const clientKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";

  return {
    provider,
    apiKey: clientKey || getServerApiKey(provider),
  };
}

export async function generateDocument(
  systemPrompt: string,
  input: string,
  config: string | GenerateDocumentConfig,
): Promise<string> {
  const resolvedConfig =
    typeof config === "string"
      ? { apiKey: config, provider: DEFAULT_TEXT_PROVIDER }
      : { ...config, provider: config.provider || DEFAULT_TEXT_PROVIDER };

  const prompt = buildUserPrompt(systemPrompt, input);
  const provider = resolvedConfig.provider;
  const model = resolvedConfig.model || getTextProviderOption(provider).model;
  const maxTokens = resolvedConfig.maxTokens || getDefaultMaxTokens(provider);

  switch (provider) {
    case "openai":
      return callOpenAICompatible({
        provider,
        apiKey: resolvedConfig.apiKey,
        model,
        maxTokens,
        prompt,
      });
    case "deepseek":
      return callOpenAICompatible({
        provider,
        apiKey: resolvedConfig.apiKey,
        model,
        maxTokens,
        prompt,
      });
    case "gemini":
      return callGemini({
        apiKey: resolvedConfig.apiKey,
        model,
        maxTokens,
        prompt,
      });
    case "anthropic":
    default:
      return callAnthropic({
        apiKey: resolvedConfig.apiKey,
        model,
        maxTokens,
        prompt,
      });
  }
}

async function callAnthropic({
  apiKey,
  model,
  maxTokens,
  prompt,
}: {
  apiKey: string;
  model: string;
  maxTokens: number;
  prompt: string;
}): Promise<string> {
  const client = new Anthropic({ apiKey });

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const message = await client.messages.create({
        model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      });

      const textBlock = message.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text response from Claude");
      }

      return textBlock.text.trim();
    } catch (error: unknown) {
      const isRateLimit =
        error instanceof Anthropic.RateLimitError ||
        (error instanceof Anthropic.APIError && error.status === 429);

      if (isRateLimit && attempt < MAX_RETRIES) {
        await sleep(15000 * 2 ** attempt);
        continue;
      }

      if (error instanceof Anthropic.AuthenticationError) {
        throw new Error("Invalid Claude API key. Check the selected provider and key.");
      }

      throw error;
    }
  }

  throw new Error("Claude retry limit exceeded");
}

async function callOpenAICompatible({
  provider,
  apiKey,
  model,
  maxTokens,
  prompt,
}: {
  provider: "openai" | "deepseek";
  apiKey: string;
  model: string;
  maxTokens: number;
  prompt: string;
}): Promise<string> {
  const providerOption = getTextProviderOption(provider);
  const baseUrl =
    provider === "openai" ? "https://api.openai.com/v1" : "https://api.deepseek.com";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (shouldRetry(response.status) && attempt < MAX_RETRIES) {
      await sleep(5000 * 2 ** attempt);
      continue;
    }

    if (!response.ok) {
      const errorText = await response.text();
      const isInvalidKey =
        response.status === 401 ||
        response.status === 403 ||
        (response.status === 400 && /api key/i.test(errorText));
      if (isInvalidKey) {
        throw new Error(`Invalid ${providerOption.label} API key. Check the selected provider and key.`);
      }
      throw new Error(`${providerOption.label} API ${response.status}: ${errorText.slice(0, 500)}`);
    }

    const data = (await response.json()) as OpenAICompatibleResponse;
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error(`${providerOption.label} returned no text content`);
    }

    return text.trim();
  }

  throw new Error(`${providerOption.label} retry limit exceeded`);
}

async function callGemini({
  apiKey,
  model,
  maxTokens,
  prompt,
}: {
  apiKey: string;
  model: string;
  maxTokens: number;
  prompt: string;
}): Promise<string> {
  const providerOption = getTextProviderOption("gemini");
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
        },
      }),
    });

    if (shouldRetry(response.status) && attempt < MAX_RETRIES) {
      await sleep(5000 * 2 ** attempt);
      continue;
    }

    if (!response.ok) {
      const errorText = await response.text();
      const isInvalidKey =
        response.status === 401 ||
        response.status === 403 ||
        (response.status === 400 && /api key/i.test(errorText));
      if (isInvalidKey) {
        throw new Error(`Invalid ${providerOption.label} API key. Check the selected provider and key.`);
      }
      throw new Error(`${providerOption.label} API ${response.status}: ${errorText.slice(0, 500)}`);
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!text) {
      const blockReason = data.promptFeedback?.blockReason;
      throw new Error(
        blockReason
          ? `${providerOption.label} blocked the request: ${blockReason}`
          : `${providerOption.label} returned no text content`,
      );
    }

    return text;
  }

  throw new Error(`${providerOption.label} retry limit exceeded`);
}
