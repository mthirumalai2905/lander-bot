import { sessionById } from "../../sessions/catalog";
import { useCanvasStore } from "../../store/canvasStore";

export function CodeViewer() {
  const session = sessionById(useCanvasStore((state) => state.activeSessionId));
  const source = useCanvasStore((state) => state.source);
  return (
    <aside className="pointer-events-auto absolute right-5 top-5 z-20 w-[min(420px,46%)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--code)]/94 shadow-[0_16px_48px_var(--shadow)] backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--dim)]">
            Live source
          </p>
          <p className="text-[13px] font-medium text-[var(--text)]">{session.sourceName}</p>
        </div>
        <span className="rounded-full bg-[var(--chip-hover)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
          compiled
        </span>
      </div>
      <pre className="max-h-[320px] overflow-auto px-4 py-3 font-mono text-[11.5px] leading-5 text-[var(--soft)]">
        {source}
      </pre>
    </aside>
  );
}
