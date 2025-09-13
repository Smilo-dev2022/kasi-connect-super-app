import { useMemo, useRef, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Image as ImageIcon, Video, Upload, Play, Pause } from "lucide-react";
import { addMedia } from "@/lib/media";

type MediaItem = {
  id: number;
  type: "image" | "video";
  src: string;
  title?: string;
  tags?: string[];
};

const seed: MediaItem[] = [
  { id: 1, type: "image", src: "/placeholder.svg?height=600&width=800", title: "Community Clean-up" },
  { id: 2, type: "image", src: "/placeholder.svg?height=600&width=800", title: "Youth Soccer" },
  { id: 3, type: "video", src: "/placeholder.svg?height=600&width=800", title: "Ward Meeting Highlights" },
  { id: 4, type: "image", src: "/placeholder.svg?height=600&width=800", title: "Local Market" },
  { id: 5, type: "video", src: "/placeholder.svg?height=600&width=800", title: "CPF Awareness" },
];

const Media = () => {
  const [items, setItems] = useState<MediaItem[]>(seed);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [uploading, setUploading] = useState(false);

  const fileInput = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    return filter === "all" ? items : items.filter((m) => m.type === filter);
  }, [items, filter]);

  const onPick = () => fileInput.current?.click();
  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      // Try backend upload if configured (handled inside addMedia fallback otherwise)
      const summaries = await Promise.all(files.map((f) => addMedia(f)));
      const newItems: MediaItem[] = summaries.map((s, i) => ({
        id: Date.now() + i,
        type: s.mimeType.startsWith("video") ? "video" : "image",
        src: s.thumbnailUrl || "/placeholder.svg",
        title: s.name,
      }));
      setItems((prev) => [...newItems, ...prev]);
    } catch (err) {
      const newItems: MediaItem[] = files.map((f, i) => ({
        id: Date.now() + i,
        type: f.type.startsWith("video") ? "video" : "image",
        src: URL.createObjectURL(f),
        title: f.name,
      }));
      setItems((prev) => [...newItems, ...prev]);
    }
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Media" />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
            <Button variant={filter === "image" ? "default" : "outline"} onClick={() => setFilter("image")} className="gap-2">
              <ImageIcon className="w-4 h-4" /> Photos
            </Button>
            <Button variant={filter === "video" ? "default" : "outline"} onClick={() => setFilter("video")} className="gap-2">
              <Video className="w-4 h-4" /> Videos
            </Button>
          </div>
          <div className="ml-auto">
            <input ref={fileInput} type="file" className="hidden" accept="image/*,video/*" multiple onChange={onFiles} />
            <Button variant="hero" className="gap-2" onClick={onPick} disabled={uploading}>
              <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>

        {/* Featured carousel */}
        {filtered.length > 0 && (
          <Carousel className="w-full">
            <CarouselContent>
              {filtered.slice(0, 5).map((m) => (
                <CarouselItem key={m.id} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="p-2 bg-card/80 backdrop-blur-sm">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="cursor-pointer">
                          <AspectRatio ratio={16 / 9}>
                            <img src={m.src} alt={m.title} className="h-full w-full rounded-md object-cover" />
                          </AspectRatio>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl p-0 overflow-hidden">
                        <AspectRatio ratio={16 / 9}>
                          <img src={m.src} alt={m.title} className="h-full w-full object-cover" />
                        </AspectRatio>
                        <div className="p-4 flex items-center justify-between">
                          <div className="text-sm font-medium">{m.title}</div>
                          <div className="flex gap-2">
                            {m.type === "video" ? (
                              <Badge className="bg-secondary text-secondary-foreground">Video</Badge>
                            ) : (
                              <Badge className="bg-primary text-primary-foreground">Photo</Badge>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        )}

        {/* Grid gallery */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((m) => (
            <Card key={m.id} className="overflow-hidden bg-card/80 backdrop-blur-sm">
              <Dialog>
                <DialogTrigger asChild>
                  <div className="cursor-pointer">
                    <AspectRatio ratio={1}>
                      <img src={m.src} alt={m.title} className="h-full w-full object-cover" />
                    </AspectRatio>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-3xl p-0 overflow-hidden">
                  <AspectRatio ratio={16 / 9}>
                    <img src={m.src} alt={m.title} className="h-full w-full object-cover" />
                  </AspectRatio>
                  <div className="p-4 flex items-center justify-between">
                    <div className="text-sm font-medium">{m.title}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {m.type === "video" ? (
                        <><Video className="w-4 h-4" /> Video</>
                      ) : (
                        <><ImageIcon className="w-4 h-4" /> Photo</>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Media;

