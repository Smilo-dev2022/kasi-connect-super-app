export type SearchResult = {
  title: string;
  url: string;
  source?: string;
  snippet?: string;
  thumbnailUrl?: string;
};

export type SearchCategory = "text" | "media" | "links";

export type SearchResponse = {
  category: SearchCategory;
  query: string;
  results: SearchResult[];
  tookMs: number;
  provider: string;
};

const serpApiKey = (import.meta.env?.VITE_SERPAPI_KEY as string | undefined);

async function searchSerpApi(query: string, category: SearchCategory): Promise<SearchResult[]> {
  const base = "https://serpapi.com/search.json";
  const params = new URLSearchParams({
    q: query,
    api_key: serpApiKey ?? "",
    engine: category === "media" ? "google_images" : "google",
    num: "10",
  });
  const url = `${base}?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`SerpAPI request failed: ${response.status}`);
  }
  const data = await response.json();
  if (category === "media") {
    const images: Array<{
      title?: string;
      source?: string;
      original?: string;
      link?: string;
      thumbnail?: string;
      snippet?: string;
    }> = data.images_results ?? [];
    return images.map((img) => ({
      title: img.title ?? img.source ?? "Image",
      url: img.original ?? img.link ?? img.thumbnail ?? "",
      thumbnailUrl: img.thumbnail,
      source: img.source,
      snippet: img.snippet,
    }));
  }
  // text or links share organic_results
  const organic: Array<{
    title?: string;
    link?: string;
    snippet?: string;
    snippet_highlighted_words?: string[];
  }> = data.organic_results ?? [];
  return organic.map((item) => ({
    title: item.title ?? "",
    url: item.link ?? "",
    snippet: item.snippet ?? item.snippet_highlighted_words?.join(" ") ?? "",
    source: item.source ?? item.displayed_link,
  }));
}

async function searchDuckDuckGo(query: string, category: SearchCategory): Promise<SearchResult[]> {
  // Note: DDG instant answer API is limited; use html lite for text, and fallback for images.
  // This is a simple client-side friendly mock via DuckDuckGo's html lite endpoint. CORS may block; we return a mock if blocked.
  try {
    if (category === "media") {
      // No simple images API without server proxy; return mock results
      return [
        {
          title: `Image result for ${query}`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
          thumbnailUrl: undefined,
          source: "DuckDuckGo",
          snippet: "Open images on DuckDuckGo",
        },
      ];
    }
    const ddgUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(ddgUrl, { mode: "no-cors" });
    // no-cors prevents reading body; provide generic link back
    return [
      {
        title: `Results for ${query}`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        source: "DuckDuckGo",
        snippet: "Open results on DuckDuckGo",
      },
    ];
  } catch {
    return [
      {
        title: `Results for ${query}`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        source: "DuckDuckGo",
        snippet: "Open results on DuckDuckGo",
      },
    ];
  }
}

export async function performSearch(query: string, category: SearchCategory): Promise<SearchResponse> {
  const started = performance.now();
  let results: SearchResult[] = [];
  let provider = "DuckDuckGo";
  if (serpApiKey) {
    try {
      results = await searchSerpApi(query, category);
      provider = category === "media" ? "SerpAPI (Google Images)" : "SerpAPI (Google)";
    } catch {
      results = await searchDuckDuckGo(query, category);
      provider = "DuckDuckGo";
    }
  } else {
    results = await searchDuckDuckGo(query, category);
  }
  const tookMs = Math.round(performance.now() - started);
  return { category, query, results, tookMs, provider };
}

