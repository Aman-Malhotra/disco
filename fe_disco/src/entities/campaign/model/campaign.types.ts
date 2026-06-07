import type { z } from "zod";

import type {
  advertiserProfileSchema,
  campaignConfigSchema,
  campaignPackageSchema,
  creativeSchema,
  personaMatchSchema,
  publisherMatchSchema,
} from "./campaign.schema";

export type CampaignPackage = z.infer<typeof campaignPackageSchema>;
export type AdvertiserProfile = z.infer<typeof advertiserProfileSchema>;
export type PublisherMatch = z.infer<typeof publisherMatchSchema>;
export type PersonaMatch = z.infer<typeof personaMatchSchema>;
export type CampaignConfig = z.infer<typeof campaignConfigSchema>;
export type Creative = z.infer<typeof creativeSchema>;
