import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import { campaignPackageSchema, type CampaignPackage } from "@/entities/campaign";
import { chatApi, chatKeys, type PlanStep, type StepKey, type StepStatus } from "@/entities/chat";

type StreamState = {
  plan: PlanStep[] | null; // null until the backend says agents are starting
  steps: Record<string, StepStatus>;
  pkg: CampaignPackage | null;
  answer: string | null; // a direct reply (router "answer" / run note)
  title: string | null;
  streaming: boolean;
  error: string | null;
};

const initial = (): StreamState => ({
  plan: null,
  steps: {},
  pkg: null,
  answer: null,
  title: null,
  streaming: false,
  error: null,
});

/** Drives one /chat turn over SSE. Until a `plan` arrives, the UI shows a
 *  plain loader; `plan` reveals the stepper, `message` shows a direct reply. */
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
          } else if (frame.event === "message") {
            setState((s) => ({ ...s, answer: (obj.text as string) ?? null }));
          } else if (frame.event === "plan") {
            const plan = (obj.steps as PlanStep[]) ?? [];
            const steps = Object.fromEntries(plan.map((p) => [p.key, "pending"])) as Record<
              string,
              StepStatus
            >;
            setState((s) => ({ ...s, plan, steps }));
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
