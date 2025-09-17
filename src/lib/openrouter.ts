import OpenAI from "openai";

let client: OpenAI | null = null;

export function openrouter() {
  if (!client) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY");
    }
    client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "https://taskette.app",
        "X-Title": process.env.OPENROUTER_APP_NAME ?? "Taskette",
      },
    });
  }
  return client;
}

export function openrouterModel() {
  return process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash-lite";
}
