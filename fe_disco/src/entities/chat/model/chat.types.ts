import type { z } from "zod";

import type { messageSchema, sessionDetailSchema, sessionSummarySchema } from "./chat.schema";

export type SessionSummary = z.infer<typeof sessionSummarySchema>;
export type SessionDetail = z.infer<typeof sessionDetailSchema>;
export type ChatMessage = z.infer<typeof messageSchema>;

// --- SSE stream contract (mirrors backend PipelineEvent + chat frames) ---

export type StepKey = "advertiser" | "publishers" | "personas" | "campaign" | "creatives";
export type StepStatus = "pending" | "progress" | "completed";

export type StepEvent = {
  type: "step";
  step: StepKey;
  status: "progress" | "completed";
  label: string;
  data?: unknown;
};

export type SessionEvent = { id: string; title: string };
export type FinalEvent = { type: "final"; data: unknown };
export type ErrorEvent = { message: string };
