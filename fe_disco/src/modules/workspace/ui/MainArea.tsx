import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { campaignPackageSchema, type CampaignPackage } from "@/entities/campaign";
import { useSession, type ChatMessage, type StepKey, type StepStatus } from "@/entities/chat";
import { ChatBox, Chip, Eyebrow } from "@/shared/ui";

import { EXAMPLE_BRIEFS } from "../config/examples";
import { Stepper } from "./Stepper";
import { PackageView } from "./package/PackageView";

type StreamView = {
  steps: Record<StepKey, StepStatus>;
  pkg: CampaignPackage | null;
  streaming: boolean;
  error: string | null;
};

type MainAreaProps = {
  activeId: string | null;
  inflight: string | null;
  stream: StreamView;
  onSend: (message: string) => void;
};

export function MainArea({ activeId, inflight, stream, onSend }: MainAreaProps) {
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
  }, [messages.length, stream.steps, stream.pkg, inflight]);

  if (!activeId) return <EmptyState onSend={onSend} />;

  const showWorkflow = Boolean(inflight) && (stream.streaming || stream.pkg !== null);

  return (
    <div className="relative flex h-dvh flex-col">
      <header className="flex items-center gap-3 border-b border-canvas-rule px-6 py-4">
        <h1 className="truncate font-display text-lg font-semibold text-ink">
          {session?.title ?? "New campaign"}
        </h1>
      </header>

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="scrollbar-thin flex-1 overflow-y-auto overflow-x-hidden"
      >
        <div className="space-y-6 px-[100px] py-10">
          {messages.map((m) => (
            <MessageRow key={m.id} message={m} />
          ))}

          {inflight && <UserBubble text={inflight} />}

          {showWorkflow && (
            <div className="flex justify-start">
              <div className="min-w-0 max-w-[80%] space-y-4">
                <Stepper statuses={stream.steps} />
                {stream.pkg && <PackageView pkg={stream.pkg} />}
              </div>
            </div>
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
          className="absolute bottom-28 right-10 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-canvas-ruleStrong bg-canvas-panel text-ink-dim shadow-elev transition-colors hover:text-ink"
        >
          {atBottom ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
        </button>
      )}

      <div className="border-t border-canvas-rule px-[100px] py-4">
        <ChatBox
          placeholder="Describe another business, or refine the brief…"
          disabled={stream.streaming}
          onSubmit={onSend}
        />
      </div>
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
    <div className="flex justify-start">
      <div className="min-w-0 max-w-[80%]">
        {pkg ? (
          <PackageView pkg={pkg} />
        ) : (
          <p className="text-sm text-ink-mute">No campaign was produced for this turn.</p>
        )}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="min-w-0 max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-brand-tint px-5 py-3 text-xl leading-relaxed text-ink">
        {text}
      </div>
    </div>
  );
}

function EmptyState({ onSend }: { onSend: (message: string) => void }) {
  return (
    <div className="relative flex h-dvh flex-col items-center overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[24%] h-[440px] w-[680px] -translate-x-1/2 animate-glow-pulse rounded-full bg-brand opacity-20 blur-[130px]"
      />
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-6 pt-[16vh] text-center">
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
