import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import { campaignPackageSchema, type CampaignPackage } from "@/entities/campaign";
import { chatApi, chatKeys, type StepKey, type StepStatus } from "@/entities/chat";

import { STEPS } from "../config/steps";

type StepState = Record<StepKey, StepStatus>;

type StreamState = {
  steps: StepState;
  pkg: CampaignPackage | null;
  title: string | null;
  streaming: boolean;
  error: string | null;
};

const pendingSteps = (): StepState =>
  Object.fromEntries(STEPS.map((s) => [s.key, "pending"])) as StepState;

const initial = (): StreamState => ({
  steps: pendingSteps(),
  pkg: null,
  title: null,
  streaming: false,
  error: null,
});

/** Drives one /chat turn over SSE: updates the stepper and captures the package. */
export function useChatStream() {
  const qc = useQueryClient();
  const [state, setState] = useState<StreamState>(initial);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (sessionId: string, message: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ ...initial(), streaming: true });

      try {
        for await (const frame of chatApi.streamChat(sessionId, message, controller.signal)) {
          let obj: Record<string, unknown>;
          try {
            obj = JSON.parse(frame.data) as Record<string, unknown>;
          } catch {
            continue;
          }

          if (frame.event === "session") {
            setState((s) => ({ ...s, title: (obj.title as string) ?? null }));
          } else if (frame.event === "step") {
            const step = obj.step as StepKey;
            const status = obj.status as StepStatus;
            setState((s) => ({ ...s, steps: { ...s.steps, [step]: status } }));
          } else if (frame.event === "final") {
            const parsed = campaignPackageSchema.safeParse(obj.data);
            if (parsed.success) setState((s) => ({ ...s, pkg: parsed.data }));
          } else if (frame.event === "error") {
            setState((s) => ({ ...s, error: (obj.message as string) ?? "Workflow error" }));
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setState((s) => ({ ...s, error: (err as Error).message }));
        }
      } finally {
        setState((s) => ({ ...s, streaming: false }));
        await qc.invalidateQueries({ queryKey: chatKeys.detail(sessionId) });
        await qc.invalidateQueries({ queryKey: chatKeys.list() });
      }
    },
    [qc],
  );

  const reset = useCallback(() => setState(initial()), []);

  return { ...state, run, reset };
}
