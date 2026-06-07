import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  as?: "button" | "span";
};

export function Chip({ active, as = "button", className, ...rest }: ChipProps) {
  const classes = cn(
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
    active
      ? "border-brand-mid bg-brand-tint text-ink"
      : "border-canvas-rule bg-canvas-inset/60 text-ink-dim hover:border-brand-mid hover:text-ink",
    className,
  );
  if (as === "span")
    return <span className={classes} {...(rest as HTMLAttributes<HTMLSpanElement>)} />;
  return <button type="button" className={classes} {...rest} />;
}
