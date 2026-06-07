import { z } from "zod";

const schema = z.object({
  VITE_API_BASE_URL: z.string().default("/api"),
});

const parsed = schema.parse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
});

export const env = {
  apiBaseUrl: parsed.VITE_API_BASE_URL,
} as const;
