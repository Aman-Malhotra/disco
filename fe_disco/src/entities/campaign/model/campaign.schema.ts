import { z } from "zod";

// Mirrors the backend pipeline output (AgentContext) persisted as the
// assistant message's `artifact` and streamed in the `final` SSE event.

export const advertiserProfileSchema = z.object({
  category: z.string(),
  subcategory: z.string().nullish(),
  product: z.string().nullish(),
  positioning: z.string().nullish(),
  benefits: z.array(z.string()).default([]),
  audience_traits: z.array(z.string()).default([]),
  summary: z.string().nullish(),
});

export const publisherMatchSchema = z.object({
  publisher_id: z.string(),
  name: z.string(),
  fit_score: z.number(),
  reasoning: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
});
export const publisherMatchesSchema = z.object({ matches: z.array(publisherMatchSchema) });

export const personaMatchSchema = z.object({
  persona_id: z.string(),
  name: z.string(),
  score: z.number(),
  reasoning: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
});
export const personaSelectionSchema = z.object({ personas: z.array(personaMatchSchema) });

export const budgetAllocationSchema = z.object({
  publisher_id: z.string(),
  name: z.string(),
  pct: z.number(),
});
export const targetingSchema = z.object({
  age_min: z.number().nullish(),
  age_max: z.number().nullish(),
  genders: z.array(z.string()).default([]),
  geos: z.array(z.string()).default([]),
  income_tiers: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
});
export const bidStrategySchema = z.object({
  model: z.string(),
  suggested_bid_low_usd: z.number().nullish(),
  suggested_bid_high_usd: z.number().nullish(),
  rationale: z.string().nullish(),
});
export const campaignConfigSchema = z.object({
  objective: z.string(),
  daily_budget_usd: z.number(),
  allocation: z.array(budgetAllocationSchema).default([]),
  targeting: targetingSchema,
  bid_strategy: bidStrategySchema,
  rationale: z.string().nullish(),
});

export const creativeSchema = z.object({
  persona_id: z.string(),
  persona_name: z.string(),
  headline: z.string(),
  body: z.string(),
  reasoning: z.string().nullish(),
});

export const campaignPackageSchema = z.object({
  advertiser_text: z.string().optional(),
  advertiser_profile: advertiserProfileSchema.nullish(),
  publishers: publisherMatchesSchema.nullish(),
  personas: personaSelectionSchema.nullish(),
  campaign: campaignConfigSchema.nullish(),
  creatives: z.array(creativeSchema).default([]),
});
