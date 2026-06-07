import { ArrowUp } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import { cn } from "@/shared/lib/cn";

type ChatBoxProps = {
  onSubmit: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  size?: "hero" | "composer";
};

export function ChatBox({
  onSubmit,
  placeholder = "Describe your business…",
  disabled,
  autoFocus,
  size = "composer",
}: ChatBoxProps) {
  const [value, setValue] = useState("");
  const isHero = size === "hero";

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-end gap-3 rounded-2xl border bg-canvas-panel/90 backdrop-blur transition-shadow",
        "border-canvas-ruleStrong focus-within:border-brand-mid focus-within:shadow-glow",
        isHero ? "p-3 pl-5" : "p-2 pl-4",
      )}
    >
      <textarea
        autoFocus={autoFocus}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "max-h-40 flex-1 resize-none self-center bg-transparent text-ink placeholder:text-ink-mute focus:outline-none",
          isHero ? "py-2 text-lg" : "py-2 text-sm",
        )}
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Send"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-glow transition-all",
          "hover:brightness-110 disabled:opacity-40 disabled:shadow-none",
          isHero ? "h-11 w-11" : "h-9 w-9",
        )}
      >
        <ArrowUp className={isHero ? "h-5 w-5" : "h-4 w-4"} />
      </button>
    </div>
  );
}
