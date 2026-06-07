export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-brand-mid"
          style={{ animation: `caret-blink 1.1s ${i * 0.18}s infinite` }}
        />
      ))}
    </span>
  );
}
