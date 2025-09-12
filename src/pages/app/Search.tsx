import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search as SearchIcon, ExternalLink, Image as ImageIcon, Link as LinkIcon, List } from "lucide-react";
import { searchImages, searchTextAndLinks, ImageResult, TextOrLinkResult } from "@/lib/search";

const EMPTY_QUERY = "";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = (searchParams.get("q") || "").toString();
  const initialTab = (searchParams.get("t") || "text") as "text" | "media" | "links";
  const [query, setQuery] = useState<string>(initialQuery);
  const [activeTab, setActiveTab] = useState<"text" | "media" | "links">(initialTab);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [textAndLinks, setTextAndLinks] = useState<TextOrLinkResult[]>([]);
  const [images, setImages] = useState<ImageResult[]>([]);

  const debouncedQuery = useDebouncedValue(query, 350);

  // Keep URL in sync with state
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debouncedQuery) next.set("q", debouncedQuery); else next.delete("q");
    if (activeTab) next.set("t", activeTab);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, activeTab]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setErrorMessage("");
      setIsLoading(true);
      try {
        if (!debouncedQuery.trim()) {
          setTextAndLinks([]);
          setImages([]);
          return;
        }
        const [tl, imgs] = await Promise.all([
          searchTextAndLinks(debouncedQuery),
          searchImages(debouncedQuery, 24)
        ]);
        if (!cancelled) {
          setTextAndLinks(tl);
          setImages(imgs);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Search failed";
        if (!cancelled) setErrorMessage(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const textResults = useMemo(() => textAndLinks.filter(r => r.type === "text"), [textAndLinks]);
  const linkResults = useMemo(() => textAndLinks.filter(r => r.type === "link"), [textAndLinks]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader title="Search" showSearch={false} />

      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the web, images, and links..."
            />
          </div>
          <Button variant="default" onClick={() => setQuery(q => q)} aria-label="Search">
            <SearchIcon className="w-4 h-4" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <List className="w-4 h-4" /> Text
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Media
            </TabsTrigger>
            <TabsTrigger value="links" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> Links
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-4">
            <ResultsText isLoading={isLoading} errorMessage={errorMessage} results={textResults} />
          </TabsContent>
          <TabsContent value="media" className="mt-4">
            <ResultsImages isLoading={isLoading} errorMessage={errorMessage} results={images} />
          </TabsContent>
          <TabsContent value="links" className="mt-4">
            <ResultsLinks isLoading={isLoading} errorMessage={errorMessage} results={linkResults} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

function ResultsText({ isLoading, errorMessage, results }: { isLoading: boolean; errorMessage: string; results: TextOrLinkResult[] }) {
  if (errorMessage) return <ErrorCard message={errorMessage} />;
  if (isLoading) return <LoadingCard label="Searching text" />;
  if (!results.length) return <EmptyCard label="No text results yet. Try a different query." />;
  return (
    <div className="space-y-3">
      {results.map(r => (
        <Card key={r.id} className="p-4">
          <a href={r.url} target="_blank" rel="noreferrer" className="group">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground group-hover:underline">{r.title}</h3>
                {r.snippet && <p className="text-sm text-muted-foreground mt-1">{r.snippet}</p>}
                <p className="text-xs text-primary mt-1 break-all">{r.url}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </div>
          </a>
        </Card>
      ))}
    </div>
  );
}

function ResultsLinks({ isLoading, errorMessage, results }: { isLoading: boolean; errorMessage: string; results: TextOrLinkResult[] }) {
  if (errorMessage) return <ErrorCard message={errorMessage} />;
  if (isLoading) return <LoadingCard label="Searching links" />;
  if (!results.length) return <EmptyCard label="No link results yet." />;
  return (
    <div className="space-y-3">
      {results.map(r => (
        <Card key={r.id} className="p-4">
          <a href={r.url} target="_blank" rel="noreferrer" className="group">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground group-hover:underline">{r.title}</h3>
                {r.snippet && <p className="text-sm text-muted-foreground mt-1">{r.snippet}</p>}
                <p className="text-xs text-primary mt-1 break-all">{r.url}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </div>
          </a>
        </Card>
      ))}
    </div>
  );
}

function ResultsImages({ isLoading, errorMessage, results }: { isLoading: boolean; errorMessage: string; results: ImageResult[] }) {
  if (errorMessage) return <ErrorCard message={errorMessage} />;
  if (isLoading) return <LoadingCard label="Searching images" />;
  if (!results.length) return <EmptyCard label="No images yet." />;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {results.map(img => (
        <a key={img.id} href={img.pageUrl || img.imageUrl} target="_blank" rel="noreferrer">
          <div className="aspect-square overflow-hidden rounded-md border hover:shadow-md">
            <img
              src={img.thumbnailUrl || img.imageUrl}
              alt={img.title}
              className="object-cover w-full h-full"
              loading="lazy"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{img.title}</p>
        </a>
      ))}
    </div>
  );
}

function LoadingCard({ label }: { label: string }) {
  return (
    <Card className="p-4 text-sm text-muted-foreground">{label}...</Card>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="p-4 text-sm text-destructive">{message}</Card>
  );
}

function EmptyCard({ label }: { label: string }) {
  return (
    <Card className="p-4 text-sm text-muted-foreground">{label}</Card>
  );
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default Search;

