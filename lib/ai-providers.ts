export const TEXT_PROVIDERS = ["anthropic", "openai", "deepseek", "gemini"] as const;

export type TextProvider = (typeof TEXT_PROVIDERS)[number];

export type TextProviderOption = {
  id: TextProvider;
  label: string;
  company: string;
  model: string;
  description: string;
  keyLabel: string;
  keyUrl: string;
  placeholder: string;
};

export const DEFAULT_TEXT_PROVIDER: TextProvider = "anthropic";

export const TEXT_PROVIDER_OPTIONS: readonly TextProviderOption[] = [
  {
    id: "anthropic",
    label: "Claude",
    company: "Anthropic",
    model: "claude-haiku-4-5-20251001",
    description: "Strong default for report writing.",
    keyLabel: "Claude API key",
    keyUrl: "https://console.anthropic.com/settings/keys",
    placeholder: "sk-ant-api03-...",
  },
  {
    id: "openai",
    label: "OpenAI",
    company: "OpenAI",
    model: "gpt-4.1-mini",
    description: "Fast general-purpose report pass.",
    keyLabel: "OpenAI API key",
    keyUrl: "https://platform.openai.com/api-keys",
    placeholder: "sk-...",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    company: "DeepSeek",
    model: "deepseek-v4-flash",
    description: "Low-cost OpenAI-compatible option.",
    keyLabel: "DeepSeek API key",
    keyUrl: "https://platform.deepseek.com/api_keys",
    placeholder: "sk-...",
  },
  {
    id: "gemini",
    label: "Gemini",
    company: "Google",
    model: "gemini-2.5-flash",
    description: "Long-context Google model.",
    keyLabel: "Gemini API key",
    keyUrl: "https://aistudio.google.com/apikey",
    placeholder: "AIza...",
  },
];

export function isTextProvider(value: unknown): value is TextProvider {
  return typeof value === "string" && (TEXT_PROVIDERS as readonly string[]).includes(value);
}

export function normalizeTextProvider(value: unknown): TextProvider {
  return isTextProvider(value) ? value : DEFAULT_TEXT_PROVIDER;
}

export function getTextProviderOption(provider: TextProvider): TextProviderOption {
  return TEXT_PROVIDER_OPTIONS.find((option) => option.id === provider) || TEXT_PROVIDER_OPTIONS[0];
}

export function getTextProviderEnvKey(provider: TextProvider): string {
  switch (provider) {
    case "openai":
      return "OPENAI_API_KEY";
    case "deepseek":
      return "DEEPSEEK_API_KEY";
    case "gemini":
      return "GEMINI_API_KEY";
    case "anthropic":
    default:
      return "ANTHROPIC_API_KEY";
  }
}
