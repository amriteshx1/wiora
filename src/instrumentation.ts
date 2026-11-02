export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DATABASE_URL) {
    return;
  }
  const { enqueuePendingReports } = await import("@/modules/preparations/server/report");
  await enqueuePendingReports().catch(() => {
    console.error("Pending reports were not queued");
  });
}
