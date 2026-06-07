import type { StepKey } from "@/entities/chat";

// Canonical pipeline steps, in display order. The stepper renders all of these
// from the start (pending) and updates each as `step` events arrive.
export const STEPS: { key: StepKey; label: string }[] = [
  { key: "advertiser", label: "Understanding the business" },
  { key: "publishers", label: "Matching publishers" },
  { key: "personas", label: "Figuring the target audience" },
  { key: "campaign", label: "Planning campaign details" },
  { key: "creatives", label: "Writing ad creatives" },
];
