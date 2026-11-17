export type BraveGroundingItem = {
  url: string;
  title: string;
  snippets: string[];
};

export type BraveSourceMeta = {
  title?: string;
  hostname?: string;
  age?: string[];
  description?: string;
};

export type BraveContextResult = {
  items: BraveGroundingItem[];
  sources: Record<string, BraveSourceMeta>;
};

const BRAVE_URL = "https://api.search.brave.com/res/v1/llm/context";

function country(): string {
  const value = (process.env.BRAVE_SEARCH_COUNTRY || "IN").trim().toUpperCase();
  return value || "IN";
}

function apiKey(): string {
  const key = process.env.BRAVE_SEARCH_API_KEY?.trim();
  if (!key) {
    throw new Error("BRAVE_SEARCH_API_KEY is not set");
  }
  return key;
}

export function parseBraveContextPayload(payload: unknown): BraveContextResult {
  if (!payload || typeof payload !== "object") {
    return { items: [], sources: {} };
  }
  const body = payload as { grounding?: unknown; sources?: unknown };
  return {
    items: asItems(body.grounding),
    sources: asSources(body.sources),
  };
}

function asItems(value: unknown): BraveGroundingItem[] {
  if (!value || typeof value !== "object") return [];
  const generic = (value as { generic?: unknown }).generic;
  if (!Array.isArray(generic)) return [];
  return generic.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { url?: unknown; title?: unknown; snippets?: unknown };
    if (typeof row.url !== "string" || !row.url.trim()) return [];
    const snippets = Array.isArray(row.snippets)
      ? row.snippets.filter((snippet): snippet is string => typeof snippet === "string" && snippet.trim().length > 0)
      : [];
    return [{
      url: row.url,
      title: typeof row.title === "string" ? row.title : row.url,
      snippets,
    }];
  });
}

function asSources(value: unknown): Record<string, BraveSourceMeta> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const sources: Record<string, BraveSourceMeta> = {};
  for (const [url, meta] of Object.entries(value as Record<string, unknown>)) {
    if (!meta || typeof meta !== "object") continue;
    const row = meta as BraveSourceMeta;
    sources[url] = {
      title: typeof row.title === "string" ? row.title : undefined,
      hostname: typeof row.hostname === "string" ? row.hostname : undefined,
      age: Array.isArray(row.age) ? row.age.filter((item): item is string => typeof item === "string") : undefined,
      description: typeof row.description === "string" ? row.description : undefined,
    };
  }
  return sources;
}

export async function fetchBraveContext(query: string): Promise<BraveContextResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(BRAVE_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "Content-Type": "application/json",
        "X-Subscription-Token": apiKey(),
      },
      body: JSON.stringify({
        q: query,
        country: country(),
        search_lang: "en",
        operators: true,
        operators_fallback: true,
        enable_source_metadata: true,
        enable_local: false,
        context_threshold_mode: "balanced",
        maximum_number_of_tokens: 6144,
        maximum_number_of_urls: 16,
        maximum_number_of_tokens_per_url: 1024,
        safesearch: "moderate",
      }),
    });
    if (!response.ok) {
      throw new Error(`Brave LLM Context returned ${response.status}`);
    }
    return parseBraveContextPayload(await response.json());
  } finally {
    clearTimeout(timer);
  }
}
