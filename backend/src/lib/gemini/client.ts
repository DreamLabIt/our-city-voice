import { env } from "../../config/env.js";
import { AppError } from "../errors.js";
import { logger } from "../logger.js";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

function getApiKey(): string {
  if (!env.GEMINI_API_KEY) {
    throw AppError.serviceUnavailable("GEMINI_API_KEY is not configured");
  }
  return env.GEMINI_API_KEY;
}

export async function embedText(text: string): Promise<number[]> {
  const apiKey = getApiKey();
  const model = env.GEMINI_EMBED_MODEL;
  const url = `${GEMINI_API_BASE}/models/${model}:embedContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: {
        parts: [{ text }],
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error({ status: response.status, body }, "gemini embedContent failed");
    throw AppError.serviceUnavailable("Failed to generate embeddings");
  }

  const data = (await response.json()) as {
    embedding?: { values?: number[] };
  };

  const values = data.embedding?.values;
  if (!Array.isArray(values)) {
    logger.error({ data }, "gemini embedContent returned no embedding values");
    throw AppError.serviceUnavailable("Failed to generate embeddings");
  }

  return values;
}

export async function classifyTriage(input: {
  title: string;
  description: string;
  categories: Array<{ slug: string; name: string }>;
  wards: Array<{ code: string; name: string }>;
}): Promise<{
  categorySlug: string | null;
  wardCode: string | null;
  priority: "low" | "medium" | "high" | "critical";
  reason: string | null;
}> {
  const apiKey = getApiKey();
  const model = env.GEMINI_MODEL;
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const systemPrompt = [
    "You are a civic issue triage assistant for a city issue reporting platform.",
    "Suggest a category and ward, and assign a priority.",
    "Only pick from the provided lists. If unsure, return null for categorySlug or wardCode.",
    "Return JSON with keys: categorySlug, wardCode, priority, reason.",
    "priority must be one of: low, medium, high, critical.",
  ].join("\n");

  const userPrompt = [
    `Title: ${input.title}`,
    `Description: ${input.description}`,
    `Categories: ${input.categories.map((c) => `${c.slug} (${c.name})`).join(", ")}`,
    `Wards: ${input.wards.map((w) => `${w.code} (${w.name})`).join(", ")}`,
    "Return only valid JSON.",
  ].join("\n\n");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 256,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error({ status: response.status, body }, "gemini generateContent failed");
    throw AppError.serviceUnavailable("Failed to classify issue");
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    logger.error({ data }, "gemini generateContent returned no text");
    throw AppError.serviceUnavailable("Failed to classify issue");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    logger.error({ error, text }, "gemini response was not valid JSON");
    throw AppError.serviceUnavailable("Failed to classify issue");
  }

  const result = parsed as Partial<{
    categorySlug: string | null;
    wardCode: string | null;
    priority: string;
    reason: string | null;
  }>;

  const priority = ["low", "medium", "high", "critical"].includes(result.priority ?? "")
    ? (result.priority as "low" | "medium" | "high" | "critical")
    : "medium";

  return {
    categorySlug: typeof result.categorySlug === "string" ? result.categorySlug : null,
    wardCode: typeof result.wardCode === "string" ? result.wardCode : null,
    priority,
    reason: typeof result.reason === "string" ? result.reason : null,
  };
}
