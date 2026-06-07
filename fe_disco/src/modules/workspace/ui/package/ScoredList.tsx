import { Ban, Check } from "lucide-react";

import { Card, Eyebrow } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

export type ScoredItem = {
  id: string;
  name: string;
  score: number;
  matches: string[];
  mismatches: string[];
};

const RECOMMEND_THRESHOLD = 60;
const CONSIDER_THRESHOLD = 40;

/** Shared scored card: a fit bar per item, bucketed into recommended /
 *  also-considered, with match / doesn't-match pointers. Used for both
 *  publishers and personas. */
export function ScoredList({ title, items }: { title: string; items: ScoredItem[] }) {
  const recommended = items.filter((i) => i.score >= RECOMMEND_THRESHOLD);
  const considered = items.filter(
    (i) => i.score >= CONSIDER_THRESHOLD && i.score < RECOMMEND_THRESHOLD,
  );

  return (
    <Card className="p-5">
      <Eyebrow className="mb-3">{title}</Eyebrow>

      {recommended.length === 0 ? (
        <p className="text-sm text-ink-mute">Nothing scored above {RECOMMEND_THRESHOLD}% here.</p>
      ) : (
        <div className="space-y-2">
          {recommended.map((it) => (
            <Row key={it.id} item={it} />
          ))}
        </div>
      )}

      {considered.length > 0 && (
        <>
          <p className="mb-2 mt-5 font-mono text-[10px] uppercase tracking-eyebrow text-ink-mute">
            Also considered ({CONSIDER_THRESHOLD}–{RECOMMEND_THRESHOLD - 1}%)
          </p>
          <div className="space-y-2">
            {considered.map((it) => (
              <Row key={it.id} item={it} muted />
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function Row({ item, muted }: { item: ScoredItem; muted?: boolean }) {
  return (
    <div className="rounded-xl border border-canvas-rule bg-canvas-inset/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-ink">{item.name}</span>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-canvas-rule">
            <div
              className={cn("h-full rounded-full", muted ? "bg-ink-faint" : "bg-brand")}
              style={{ width: `${Math.min(100, item.score)}%` }}
            />
          </div>
          <span className="w-7 text-right font-mono text-xs text-ink-dim">{item.score}</span>
        </div>
      </div>

      {item.matches.length > 0 && (
        <div className="mt-2">
          <p className="mb-1 text-[11px] font-medium text-signal-ok">Matches</p>
          <ul className="space-y-1 text-xs leading-relaxed text-ink-dim">
            {item.matches.map((r, i) => (
              <li key={i} className="flex gap-1.5">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal-ok" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.mismatches.length > 0 && (
        <div className="mt-2">
          <p className="mb-1 text-[11px] font-medium text-ink-mute">Doesn&apos;t match</p>
          <ul className="space-y-1 text-xs leading-relaxed text-ink-mute">
            {item.mismatches.map((r, i) => (
              <li key={i} className="flex gap-1.5">
                <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal-idle" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
