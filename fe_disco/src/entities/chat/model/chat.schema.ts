import { z } from "zod";

export const sessionSummarySchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const messageSchema = z.object({
  id: z.string(),
  seq: z.number(),
  role: z.string(),
  content: z.string().nullable(),
  // Parsed in the UI with campaignPackageSchema; kept loose to decouple typing.
  artifact: z.unknown().nullable(),
  created_at: z.string(),
});

export const sessionDetailSchema = sessionSummarySchema.extend({
  messages: z.array(messageSchema).default([]),
});

export const sessionListSchema = z.object({
  items: z.array(sessionSummarySchema),
  total: z.number(),
});
