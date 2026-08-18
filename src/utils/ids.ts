const counters = new Map<string, number>();

export function peekNextId(prefix: string): string {
  const next = (counters.get(prefix) ?? 0) + 1;
  return `${prefix}_${next}`;
}

export function nextId(prefix: string): string {
  const current = counters.get(prefix) ?? 0;
  const value = current + 1;
  counters.set(prefix, value);
  return `${prefix}_${value}`;
}

export function syncIdCounter(prefix: string, ids: string[]): void {
  let max = counters.get(prefix) ?? 0;
  const pattern = new RegExp(`^${prefix}_(\\d+)$`);
  for (const id of ids) {
    const match = id.match(pattern);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  counters.set(prefix, max);
}

export function resetIdCounters(values?: Record<string, number>): void {
  counters.clear();
  if (values) {
    for (const [prefix, value] of Object.entries(values)) {
      counters.set(prefix, value);
    }
  }
}

export function createLocalId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
