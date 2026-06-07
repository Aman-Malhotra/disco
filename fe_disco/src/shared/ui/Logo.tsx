import { cn } from "@/shared/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/disco-logo.png"
      alt="Disco"
      className={cn("h-7 w-auto select-none", className)}
      draggable={false}
    />
  );
}
