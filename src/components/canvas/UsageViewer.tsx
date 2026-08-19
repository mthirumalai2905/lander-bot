import { formatTokenCount, formatUsd } from "../../ai/deepseekPricing";
import { usageTotals, useUsageStore } from "../../store/usageStore";

export function UsageViewer() {
  const entries = useUsageStore((state) => state.entries);
  const clear = useUsageStore((state) => state.clear);
  const totals = usageTotals(entries);

  return (
    <aside className="pointer-events-auto absolute right-0 top-full z-30 mt-2 w-[min(360px,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--code)] shadow-[0_16px_48px_var(--shadow)]">
      <div className="flex items-start justify-between border-b border-[var(--border)] px-4 py-2.5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--dim)]">
            Token spend
          </p>
          <p className="text-[13px] font-medium text-[var(--text)]">
            {formatUsd(totals.costUsd)} · {formatTokenCount(totals.tokens)} tokens
          </p>
        </div>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="rounded-full px-2 py-0.5 text-[11px] text-[var(--muted)] hover:text-[var(--text)]"
          >
            Clear
          </button>
        )}
      </div>
      <div className="max-h-[320px] overflow-auto">
        {entries.length === 0 ? (
          <p className="px-4 py-3 text-[12px] leading-5 text-[var(--muted)]">
            Each DeepSeek request will show tokens and estimated USD cost here, next to the change it made.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {entries.map((entry) => (
              <li key={entry.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] leading-5 text-[var(--text)]">{entry.task}</p>
                  <p className="shrink-0 text-[13px] font-medium text-[var(--text)]">
                    {formatUsd(entry.costUsd)}
                  </p>
                </div>
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  {formatTokenCount(entry.totalTokens)} tokens · {formatTokenCount(entry.promptTokens)} in ·{" "}
                  {formatTokenCount(entry.completionTokens)} out
                  {entry.cacheHitTokens > 0
                    ? ` · ${formatTokenCount(entry.cacheHitTokens)} cached`
                    : ""}
                  {entry.peak ? " · peak" : " · off-peak"}
                  {entry.estimated ? " · estimated" : ""}
                </p>
                {entry.changes.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {entry.changes.map((change, index) => (
                      <li key={`${entry.id}-${index}`} className="text-[12px] leading-5 text-[var(--soft)]">
                        {change}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="border-t border-[var(--border)] px-4 py-2 text-[10px] leading-4 text-[var(--dim)]">
        deepseek-chat (V4 Flash) · official input cache-hit/miss + output rates
      </p>
    </aside>
  );
}
