import { describe, expect, it } from "vitest";

import { parseBraveContextPayload } from "./brave-llm-context";

describe("parseBraveContextPayload", () => {
  it("keeps source urls, titles, and snippets", () => {
    const parsed = parseBraveContextPayload({
      grounding: {
        generic: [
          {
            url: "https://www.reddit.com/r/cscareerquestions/acme",
            title: "Acme interview experience",
            snippets: ["They asked about systems design.", ""],
          },
          {
            url: "https://linkedin.com/posts/acme",
            title: "Acme hiring post",
            snippets: ["Hiring a backend engineer in India."],
          },
          { title: "Missing url", snippets: ["ignored"] },
        ],
      },
      sources: {
        "https://www.reddit.com/r/cscareerquestions/acme": {
          title: "Reddit thread",
          hostname: "www.reddit.com",
          description: "Interview discussion",
        },
      },
    });

    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0]).toEqual({
      url: "https://www.reddit.com/r/cscareerquestions/acme",
      title: "Acme interview experience",
      snippets: ["They asked about systems design."],
    });
    expect(parsed.sources["https://www.reddit.com/r/cscareerquestions/acme"]?.title).toBe("Reddit thread");
    expect(parsed.sources["https://www.reddit.com/r/cscareerquestions/acme"]?.hostname).toBe("www.reddit.com");
  });

  it("returns empty evidence when Brave has nothing usable", () => {
    expect(parseBraveContextPayload(null)).toEqual({ items: [], sources: {} });
    expect(parseBraveContextPayload({ grounding: { generic: [] } })).toEqual({ items: [], sources: {} });
  });
});
