import { Plus } from "lucide-react";

import { useSessions } from "@/entities/chat";
import { Logo } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

type SidePanelProps = {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
};

export function SidePanel({ activeId, onSelect, onNew }: SidePanelProps) {
  const { data } = useSessions();
  const sessions = data?.items ?? [];

  return (
    <aside className="flex h-dvh w-1/5 shrink-0 flex-col border-r border-canvas-rule bg-canvas-panel/70">
      <div className="flex items-center px-5 py-5">
        <button type="button" onClick={onNew} aria-label="New campaign" className="transition-opacity hover:opacity-80">
          <Logo className="h-6" />
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
        {sessions.length === 0 && <p className="px-3 py-2 text-sm text-ink-mute">No threads yet.</p>}
      </nav>
    </aside>
  );
}
