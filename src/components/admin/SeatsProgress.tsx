export function SeatsProgress({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div className="min-w-[120px]">
      <div className="text-sm text-foreground">{used} / {total}</div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[hsl(var(--gold))]"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
