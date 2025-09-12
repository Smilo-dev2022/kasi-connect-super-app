export type SearchResultType = "text" | "link";

export interface TextOrLinkResult {
  id: string;
  type: SearchResultType;
  title: string;
  url: string;
  snippet?: string;
  iconUrl?: string;
}

export interface ImageResult {
  id: string;
  title: string;
  imageUrl: string;
  pageUrl?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

const ddgBase = "https://api.duckduckgo.com/";

export async function searchTextAndLinks(query: string): Promise<TextOrLinkResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    format: "json",
    no_html: "1",
    skip_disambig: "1"
  });

  const response = await fetch(`${ddgBase}?${params.toString()}`);
  if (!response.ok) throw new Error(`Search request failed: ${response.status}`);
  const data = await response.json();

  const results: TextOrLinkResult[] = [];

  // Direct results
  if (Array.isArray(data.Results)) {
    for (const r of data.Results) {
      if (r && r.FirstURL) {
        results.push({
          id: r.FirstURL,
          type: "text",
          title: r.Text || r.FirstURL,
          url: r.FirstURL,
          snippet: r.Text
        });
      }
    }
  }

  // Abstract
  if (data.AbstractURL) {
    results.unshift({
      id: data.AbstractURL,
      type: "text",
      title: data.Heading || data.AbstractURL,
      url: data.AbstractURL,
      snippet: data.AbstractText
    });
  }

  // Related topics often contain rich links
  if (Array.isArray(data.RelatedTopics)) {
    for (const topic of data.RelatedTopics) {
      if (topic && topic.FirstURL) {
        results.push({
          id: topic.FirstURL,
          type: "link",
          title: topic.Text || topic.FirstURL,
          url: topic.FirstURL,
          snippet: topic.Text
        });
      } else if (topic && Array.isArray(topic.Topics)) {
        for (const t of topic.Topics) {
          if (t && t.FirstURL) {
            results.push({
              id: t.FirstURL,
              type: "link",
              title: t.Text || t.FirstURL,
              url: t.FirstURL,
              snippet: t.Text
            });
          }
        }
      }
    }
  }

  // De-duplicate by URL
  const seen = new Set<string>();
  const deduped: TextOrLinkResult[] = [];
  for (const r of results) {
    if (r.url && !seen.has(r.url)) {
      seen.add(r.url);
      deduped.push(r);
    }
  }

  return deduped;
}

// Wikimedia Commons image search (no API key, CORS enabled)
export async function searchImages(query: string, limit: number = 24): Promise<ImageResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrlimit: String(Math.min(Math.max(limit, 1), 50)),
    prop: "imageinfo",
    iiprop: "url|size|mime",
    iiurlwidth: "1024",
    format: "json",
    origin: "*"
  });

  const url = `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image search failed: ${response.status}`);
  const data = await response.json();

  const pages = (data && data.query && data.query.pages) ? (data.query.pages as Record<string, unknown>) : {};
  const results: ImageResult[] = Object.values(pages).flatMap((pageValue: unknown) => {
    const p = pageValue as { pageid?: number; title: string; imageinfo?: Array<{ url?: string; thumburl?: string; thumbwidth?: number; thumbheight?: number }>};
    const info = Array.isArray(p.imageinfo) ? p.imageinfo[0] : undefined;
    if (!info) return [];
    const imageUrl: string = info.thumburl || info.url;
    if (!imageUrl) return [];
    return [{
      id: String((p.pageid as number | undefined) ?? p.title),
      title: p.title,
      imageUrl,
      pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`,
      thumbnailUrl: info.thumburl || info.url,
      width: info.thumbwidth,
      height: info.thumbheight
    }];
  });

  return results;
}

