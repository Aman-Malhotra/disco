import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/shared/lib/cn";

/** Renders LLM text as markdown, themed to the Disco palette. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose max-w-none",
        "prose-p:text-ink-dim prose-li:text-ink-dim prose-strong:text-ink",
        "prose-headings:font-display prose-headings:text-ink prose-headings:font-semibold",
        "prose-a:text-brand-violet prose-a:no-underline hover:prose-a:underline",
        // inline code: subtle light chip
        "prose-code:rounded prose-code:bg-canvas-inset prose-code:px-1 prose-code:py-0.5 prose-code:text-ink prose-code:before:content-none prose-code:after:content-none",
        // code blocks: light card, and reset the inline-code chip on tokens inside <pre>
        "prose-pre:rounded-xl prose-pre:border prose-pre:border-canvas-rule prose-pre:bg-canvas-inset prose-pre:text-ink",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-ink",
        "prose-hr:border-canvas-rule prose-blockquote:border-l-brand-mid prose-blockquote:text-ink-mute",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
