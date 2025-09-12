import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  deleteMedia,
  listMedia,
  saveFile,
  StoredMediaItem,
} from "@/lib/media";
import { Trash2, UploadCloud } from "lucide-react";

const Media = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [filter, setFilter] = useState<"all" | "image" | "video" | "audio" | "file">("all");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["media", "list"],
    queryFn: listMedia,
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const results: StoredMediaItem[] = [];
      for (const file of Array.from(files)) {
        const item = await saveFile(file);
        results.push(item);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media", "list"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media", "list"] });
    },
  });

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.kind === filter);
  }, [items, filter]);

  useEffect(() => {
    // Prefetch on mount
    queryClient.prefetchQuery({ queryKey: ["media", "list"], queryFn: listMedia });
  }, [queryClient]);

  return (
    <div className="pb-20">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Media</h1>
          <div className="flex items-center gap-2">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="image">Images</TabsTrigger>
                <TabsTrigger value="video">Videos</TabsTrigger>
                <TabsTrigger value="audio">Audio</TabsTrigger>
                <TabsTrigger value="file">Files</TabsTrigger>
              </TabsList>
            </Tabs>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  uploadMutation.mutate(e.target.files);
                  e.currentTarget.value = "";
                }
              }}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              <UploadCloud className="w-4 h-4 mr-2" /> Upload
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          {isLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <EmptyState onUpload={() => fileInputRef.current?.click()} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  onDelete={() => deleteMutation.mutate(item.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

function MediaCard({ item, onDelete }: { item: StoredMediaItem; onDelete: () => void }) {
  const objectUrlRef = useRef<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(item.blob);
    objectUrlRef.current = url;
    setObjectUrl(url);
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [item.blob]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-medium truncate" title={item.name}>
          {item.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
          {item.kind === "image" ? (
            item.thumbnail ? (
              <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
            ) : objectUrl ? (
              <img src={objectUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : null
          ) : item.kind === "video" ? (
            objectUrl ? (
              <video src={objectUrl} className="w-full h-full object-cover" controls />
            ) : null
          ) : (
            <div className="text-xs text-muted-foreground">{item.type || item.kind}</div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-3 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {(item.size / 1024).toFixed(1)} KB
        </div>
        <Button variant="destructive" size="icon" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-10 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <UploadCloud className="w-8 h-8 text-primary" />
        </div>
        <div className="text-lg font-medium mb-2">No media yet</div>
        <p className="text-sm text-muted-foreground mb-6">
          Upload images, videos, audio, or any files to get started.
        </p>
        <Button onClick={onUpload}>Upload</Button>
      </CardContent>
    </Card>
  );
}

export default Media;

