import { Plus, X } from "lucide-react";

import { useSessions } from "@/entities/chat";
import { Logo } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

type SidePanelProps = {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  open: boolean;
  onClose: () => void;
};

export function SidePanel({ activeId, onSelect, onNew, open, onClose }: SidePanelProps) {
  const { data } = useSessions();
  const sessions = data?.items ?? [];

  return (
    <>
      {open && (
        <div
          aria-hidden
          onClick={onClose}
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm md:hidden"
        />
      )}
      <aside
        className={cn(
          "z-40 flex h-dvh w-72 shrink-0 flex-col border-r border-canvas-rule bg-canvas-panel",
          "fixed inset-y-0 left-0 transition-transform duration-300 ease-out",
          "md:static md:w-1/5 md:translate-x-0 md:bg-canvas-panel/70",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <button
            type="button"
            onClick={onNew}
            aria-label="New campaign"
            className="transition-opacity hover:opacity-80"
          >
            <Logo className="h-6" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="text-ink-mute transition-colors hover:text-ink md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3">
          <button
            type="button"
            onClick={onNew}
            className="flex w-full items-center gap-2 rounded-xl border border-canvas-ruleStrong bg-canvas-inset/60 px-3 py-2.5 text-sm text-ink-dim transition-colors hover:border-brand-mid hover:text-ink"
          >
            <Plus className="h-4 w-4" />
            New campaign
          </button>
        </div>

        <p className="mt-4 px-5 font-mono text-[10px] uppercase tracking-eyebrow text-ink-mute">
          Threads
        </p>

        <nav className="scrollbar-thin mt-2 flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={cn(
                "block w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors",
                s.id === activeId
                  ? "bg-brand-tint text-ink"
                  : "text-ink-dim hover:bg-canvas-inset hover:text-ink",
              )}
            >
              {s.title ?? "New campaign"}
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="px-3 py-2 text-sm text-ink-mute">No threads yet.</p>
          )}
        </nav>
      </aside>
    </>
  );
}
