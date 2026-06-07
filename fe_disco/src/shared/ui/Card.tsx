import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-canvas-rule bg-canvas-panel shadow-panel",
        className,
      )}
      {...rest}
    />
  );
}

export function Eyebrow({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("font-mono text-[10px] uppercase tracking-eyebrow text-ink-mute", className)}
      {...rest}
    />
  );
}
