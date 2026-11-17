const EPOCH_MS = 1_000_000_000_000;

export function sessionOriginMs(
  runStartedAt: Date | null | undefined,
  firstTurnAt: Date | null | undefined,
): number {
  return (runStartedAt ?? firstTurnAt ?? new Date(0)).getTime();
}

export function toElapsedMs(startedAt: Date, originMs: number): number {
  return Math.max(0, startedAt.getTime() - originMs);
}

export function absoluteFromElapsed(startTs: number, originMs: number): number {
  if (startTs > EPOCH_MS) return startTs;
  return originMs + startTs;
}

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
