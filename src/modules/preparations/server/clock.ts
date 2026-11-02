export function sessionMinutes(durationMinutes: number): number {
  if (process.env.NODE_ENV === "production") {
    return durationMinutes;
  }
  const raw = process.env.TEST_SESSION_MINUTES;
  if (!raw) {
    return durationMinutes;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return durationMinutes;
  }
  return parsed;
}
