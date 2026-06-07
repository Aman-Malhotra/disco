import { Check, Loader2 } from "lucide-react";

import type { PlanStep, StepStatus } from "@/entities/chat";
import { cn } from "@/shared/lib/cn";

export function Stepper({
  plan,
  statuses,
}: {
  plan: PlanStep[];
  statuses: Record<string, StepStatus>;
}) {
  return (
    <div className="rounded-2xl border border-canvas-rule bg-canvas-panel p-5 shadow-panel">
      <ol className="space-y-0">
        {plan.map((step, i) => {
          const status = statuses[step.key] ?? "pending";
          const isLast = i === plan.length - 1;
          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <StepIcon status={status} index={i} />
                {!isLast && (
                  <span
                    className={cn(
                      "my-1 w-px flex-1",
                      status === "completed" ? "bg-brand-mid" : "bg-canvas-rule",
                    )}
                    style={{ minHeight: 24 }}
                  />
                )}
              </div>
              <div className={cn("pb-5", isLast && "pb-0")}>
                <p
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-eyebrow",
                    status === "progress" ? "text-brand-violet" : "text-ink-mute",
                  )}
                >
                  {status === "completed"
                    ? "Done"
                    : status === "progress"
                      ? "Running agent"
                      : "Queued"}
                </p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    status === "pending" ? "text-ink-mute" : "text-ink",
                  )}
                >
                  {step.label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepIcon({ status, index }: { status: StepStatus; index: number }) {
  if (status === "completed") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white">
        <Check className="h-4 w-4" />
      </span>
    );
  }
  if (status === "progress") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-tint text-brand-violet ring-2 ring-brand-mid">
        <Loader2 className="h-4 w-4 animate-spin" />
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-canvas-ruleStrong text-xs font-medium text-ink-mute">
      {index + 1}
    </span>
  );
}
