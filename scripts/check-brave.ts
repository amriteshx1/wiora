import "dotenv/config";
import { fetchBraveContext } from "../src/lib/brave-llm-context";
import { buildBraveQuery } from "../src/modules/preparations/server/research-query";

async function main() {
  const query = buildBraveQuery("job_interview", {
    company: "Stripe",
    jobTitle: "Software Engineer",
  });
  const result = await fetchBraveContext(query);
  const hosts = [...new Set(result.items.map((item) => {
    try {
      return new URL(item.url).hostname;
    } catch {
      return "invalid";
    }
  }))].slice(0, 8);
  const snippets = result.items.reduce((sum, item) => sum + item.snippets.length, 0);
  console.log(JSON.stringify({
    queryWords: query.split(/\s+/).length,
    queryChars: query.length,
    sources: result.items.length,
    snippets,
    hosts,
  }));
  if (result.items.length === 0) {
    throw new Error("Brave returned no usable sources");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
