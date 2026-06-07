import { ArrowDown, ArrowUp, Loader2, Menu } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { campaignPackageSchema, type CampaignPackage } from "@/entities/campaign";
import { useSession, type ChatMessage, type PlanStep, type StepStatus } from "@/entities/chat";
import { ChatBox, Chip, Eyebrow, Markdown } from "@/shared/ui";

import { EXAMPLE_BRIEFS } from "../config/examples";
import { Stepper } from "./Stepper";
import { PackageView } from "./package/PackageView";

type StreamView = {
  plan: PlanStep[] | null;
  steps: Record<string, StepStatus>;
  pkg: CampaignPackage | null;
  answer: string | null;
  streaming: boolean;
  error: string | null;
};

type MainAreaProps = {
  activeId: string | null;
  inflight: string | null;
  stream: StreamView;
  onSend: (message: string) => void;
  onOpenMenu: () => void;
};

export function MainArea({ activeId, inflight, stream, onSend, onOpenMenu }: MainAreaProps) {
  const { data: session } = useSession(activeId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [scrollable, setScrollable] = useState(false);

  const messages = session?.messages ?? [];

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollable(el.scrollHeight - el.clientHeight > 80);
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };
  const scrollToBottom = () =>
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });

  useEffect(() => {
    checkScroll();
  }, [messages.length, stream.plan, stream.steps, stream.pkg, stream.answer, inflight]);

  if (!activeId) return <EmptyState onSend={onSend} onOpenMenu={onOpenMenu} />;

  // Plain loader until the backend commits: a `plan` (agents starting) or an answer.
  const showProcessing = Boolean(inflight) && stream.streaming && !stream.plan && !stream.answer;

  return (
    <div className="relative flex h-dvh flex-col">
      <header className="flex items-center gap-3 border-b border-canvas-rule px-4 py-4 md:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="-ml-1 shrink-0 text-ink-dim transition-colors hover:text-ink md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate font-display text-lg font-semibold text-ink">
          {session?.title ?? "New campaign"}
        </h1>
      </header>

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="scrollbar-thin flex-1 overflow-y-auto overflow-x-hidden"
      >
        <div className="space-y-6 px-4 py-6 md:px-[100px] md:py-10">
          {messages.map((m) => (
            <MessageRow key={m.id} message={m} />
          ))}

          {inflight && <UserBubble text={inflight} />}

          {inflight && (
            <AssistantBubble>
              {showProcessing && <Processing />}
              {stream.answer && <Markdown>{stream.answer}</Markdown>}
              {stream.plan && <Stepper plan={stream.plan} statuses={stream.steps} />}
              {stream.pkg && <PackageView pkg={stream.pkg} />}
            </AssistantBubble>
          )}

          {stream.error && (
            <p className="rounded-xl border border-signal-err/40 bg-signal-err/10 p-3 text-base text-signal-err">
              {stream.error}
            </p>
          )}
        </div>
      </div>

      {scrollable && (
        <button
          type="button"
          onClick={atBottom ? scrollToTop : scrollToBottom}
          aria-label={atBottom ? "Scroll to top" : "Scroll to latest"}
          className="absolute bottom-28 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-canvas-ruleStrong bg-canvas-panel text-ink-dim shadow-elev transition-colors hover:text-ink md:right-10"
        >
          {atBottom ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
        </button>
      )}

      <div className="border-t border-canvas-rule px-4 py-4 md:px-[100px]">
        <ChatBox placeholder="Ask anything…" disabled={stream.streaming} onSubmit={onSend} />
      </div>
    </div>
  );
}

/** One assistant turn, grouped in a single chat bubble. The inner cards
 *  (stepper, package sections) are the smaller bubbles within it. */
function AssistantBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-start">
      <div className="min-w-0 max-w-[80%] space-y-3 rounded-2xl rounded-bl-md border border-canvas-ruleStrong bg-canvas-rule p-3 md:p-4">
        {children}
      </div>
    </div>
  );
}

function Processing() {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-ink-dim">
      <Loader2 className="h-4 w-4 animate-spin text-brand-violet" />
      Processing…
    </div>
  );
}

function parsePackage(artifact: unknown): CampaignPackage | null {
  if (!artifact) return null;
  const result = campaignPackageSchema.safeParse(artifact);
  return result.success ? result.data : null;
}

function MessageRow({ message }: { message: ChatMessage }) {
  if (message.role === "user") return <UserBubble text={message.content ?? ""} />;
  const pkg = parsePackage(message.artifact);
  return (
    <AssistantBubble>
      {message.content && <Markdown>{message.content}</Markdown>}
      {pkg && <PackageView pkg={pkg} />}
      {!message.content && !pkg && (
        <p className="text-sm text-ink-mute">No campaign was produced for this turn.</p>
      )}
    </AssistantBubble>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="min-w-0 max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-canvas-ruleStrong px-4 py-2.5 text-base leading-relaxed text-ink md:max-w-[80%] md:px-5 md:py-3 md:text-xl">
        {text}
      </div>
    </div>
  );
}

function EmptyState({
  onSend,
  onOpenMenu,
}: {
  onSend: (message: string) => void;
  onOpenMenu: () => void;
}) {
  return (
    <div className="relative flex h-dvh flex-col items-center overflow-hidden">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="absolute left-4 top-4 z-20 text-ink-dim transition-colors hover:text-ink md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[24%] h-[440px] w-[680px] -translate-x-1/2 animate-glow-pulse rounded-full bg-brand opacity-20 blur-[130px]"
      />
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-6 pt-[20vh] text-center md:pt-[16vh]">
        <div className="animate-fade-up">
          <Eyebrow className="mb-6">An advertiser brief in · a campaign out</Eyebrow>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Ad campaigns,
            <br />
            <span className="text-gradient">conjured.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-relaxed text-ink-dim">
            Describe what you sell in a sentence. Disco finds the publishers worth running on, writes
            creative tuned to the shoppers who&apos;ll bite, and drafts a launch-ready campaign.
          </p>
        </div>

        <div className="mt-10 w-full animate-fade-up" style={{ animationDelay: "80ms" }}>
          <ChatBox size="hero" autoFocus placeholder="Describe what you sell…" onSubmit={onSend} />
        </div>

        <div
          className="mt-6 flex animate-fade-up flex-wrap items-center justify-center gap-2"
          style={{ animationDelay: "160ms" }}
        >
          {EXAMPLE_BRIEFS.map((ex) => (
            <Chip key={ex.label} onClick={() => onSend(ex.brief)}>
              {ex.label}
            </Chip>
          ))}
        </div>
      </main>
    </div>
  );
}
