import { useMemo, useState, type ComponentType, type FormEvent } from "react";
import { performSearch, type SearchCategory, type SearchResult } from "@/lib/search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, ImageIcon, Link as LinkIcon, Search as SearchIcon, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const categories: { key: SearchCategory; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: "text", label: "Text", icon: FileText },
  { key: "media", label: "Media", icon: ImageIcon },
  { key: "links", label: "Links", icon: LinkIcon },
];

export default function Search() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("text");
  const canSearch = useMemo(() => query.trim().length > 0, [query]);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["search", query, activeCategory],
    queryFn: () => performSearch(query.trim(), activeCategory),
    enabled: false,
    staleTime: 1000 * 60,
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSearch) return;
    refetch();
  }

  const iconForTab = (key: SearchCategory) => categories.find(c => c.key === key)?.icon ?? SearchIcon;

  return (
    <div className="max-w-3xl mx-auto p-4 pb-28">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5" /> Agent 9 – Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex gap-2">
            <Input
              placeholder="Search the web..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button type="submit" disabled={!canSearch || isFetching}>
              {isFetching ? "Searching..." : "Search"}
            </Button>
          </form>

          <div className="mt-4">
            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as SearchCategory)}>
              <TabsList>
                {categories.map(({ key, label, icon: Icon }) => (
                  <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" /> {label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {categories.map(({ key }) => (
                <TabsContent key={key} value={key} className="mt-4">
                  <ResultsList
                    results={data?.results ?? []}
                    emptyHint={
                      canSearch
                        ? isFetching
                          ? "Fetching results..."
                          : data
                            ? data.results.length === 0
                              ? "No results"
                              : undefined
                            : "Run a search to see results"
                        : "Type a query to search"
                    }
                  />
                  {!!data && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Provider: {data.provider} • {data.tookMs} ms • {data.results.length} results
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultsList({ results, emptyHint }: { results: SearchResult[]; emptyHint?: string }) {
  if (!results.length) {
    return <div className="text-sm text-muted-foreground">{emptyHint ?? "No results"}</div>;
  }
  return (
    <ul className="space-y-3">
      {results.map((r, idx) => (
        <li key={`${r.url}-${idx}`} className="group">
          <a href={r.url} target="_blank" rel="noreferrer" className="block">
            <div className="flex items-start gap-3">
              {r.thumbnailUrl ? (
                <img src={r.thumbnailUrl} alt={r.title} className="w-16 h-16 object-cover rounded border" />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center rounded border bg-muted">
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <div className="font-medium truncate group-hover:underline">{r.title || r.url}</div>
                {r.source && <div className="text-xs text-muted-foreground truncate">{r.source}</div>}
                {r.snippet && <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.snippet}</div>}
              </div>
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}

