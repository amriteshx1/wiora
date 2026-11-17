type UsageKind =
  | "research_planning"
  | "external_search"
  | "document_extraction"
  | "situation_synthesis"
  | "live_steering"
  | "report_generation"
  | "preparation_credit";

export function logUsage(event: {
  kind: UsageKind;
  preparationId?: string;
  runId?: string;
  userId?: string;
  reused?: boolean;
  ok?: boolean;
  sources?: number;
  tokens?: number;
  detail?: string;
}): void {
  const payload: Record<string, unknown> = {
    at: new Date().toISOString(),
    kind: event.kind,
  };
  if (event.preparationId) payload.preparationId = event.preparationId;
  if (event.runId) payload.runId = event.runId;
  if (event.userId) payload.userId = event.userId;
  if (event.reused != null) payload.reused = event.reused;
  if (event.ok != null) payload.ok = event.ok;
  if (event.sources != null) payload.sources = event.sources;
  if (event.tokens != null) payload.tokens = event.tokens;
  if (event.detail) payload.detail = event.detail.slice(0, 120);
  console.info("[wiora:usage]", JSON.stringify(payload));
}
