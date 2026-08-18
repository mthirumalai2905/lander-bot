interface AppliedChangesProps {
  changes: string[];
}

export function AppliedChanges({ changes }: AppliedChangesProps) {
  if (!changes.length) return null;

  return (
    <div className="mt-3 space-y-1.5">
      {changes.map((change) => {
        const failed = /locked|couldn't|left .* unchanged|protected/i.test(change);
        return (
          <div key={change} className="flex items-start gap-2 text-[13px] leading-5 text-[var(--soft)]">
            <span className={failed ? "text-[var(--warn)]" : "text-[var(--ok)]"}>
              {failed ? "–" : "✓"}
            </span>
            <span>{change}</span>
          </div>
        );
      })}
    </div>
  );
}
