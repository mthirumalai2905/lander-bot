export const MIN_RIBBON_SPEED = 0.2;
export const MAX_RIBBON_SPEED = 4;

export function clampRibbonSpeed(speed: number): number {
  if (!Number.isFinite(speed) || speed <= 0) return 1;
  return Math.min(MAX_RIBBON_SPEED, Math.max(MIN_RIBBON_SPEED, speed));
}

export function ribbonSpeedsFor(count: number, current: number[] = []): number[] {
  return Array.from({ length: Math.max(count, 0) }, (_, index) =>
    clampRibbonSpeed(current[index] ?? 1),
  );
}

export function insertRibbonSpeed(
  current: number[],
  placement: "start" | "end",
  speed = 1,
): number[] {
  return placement === "start" ? [clampRibbonSpeed(speed), ...current] : [...current, clampRibbonSpeed(speed)];
}

export function removeRibbonSpeed(
  current: number[],
  placement: "start" | "end",
  index?: number,
): number[] {
  const next = [...current];
  if (index !== undefined && index >= 0 && index < next.length) {
    next.splice(index, 1);
    return next;
  }
  if (placement === "start") next.shift();
  else next.pop();
  return next;
}
