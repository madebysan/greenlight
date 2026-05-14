import { createFalClient } from "@fal-ai/client";

export function createFalClientForRequest(clientKey: unknown) {
  const requestKey = typeof clientKey === "string" ? clientKey.trim() : "";
  const credentials = requestKey || process.env.FAL_KEY;

  if (!credentials) {
    return null;
  }

  return createFalClient({ credentials });
}
