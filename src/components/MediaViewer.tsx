import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface MediaItem {
  url: string;
  type: "image" | "video";
}

interface MediaViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MediaItem[];
  startIndex?: number;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({ open, onOpenChange, items, startIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = React.useState(startIndex);

  React.useEffect(() => {
    if (open) setCurrentIndex(startIndex);
  }, [open, startIndex]);

  const current = items[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  const goPrev = () => hasPrev && setCurrentIndex((i) => i - 1);
  const goNext = () => hasNext && setCurrentIndex((i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Media</DialogTitle>
        </DialogHeader>

        <div className="relative w-full aspect-video bg-black/80 rounded-md flex items-center justify-center">
          {current?.type === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.url} alt="attachment" className="max-w-full max-h-full object-contain" />
          )}
          {current?.type === "video" && (
            <video src={current.url} controls className="max-w-full max-h-full" />
          )}

          {hasPrev && (
            <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20" onClick={goPrev}>
              <ChevronLeft className="w-5 h-5 text-white" />
            </Button>
          )}
          {hasNext && (
            <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20" onClick={goNext}>
              <ChevronRight className="w-5 h-5 text-white" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="absolute right-2 top-2 bg-white/10 hover:bg-white/20" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 text-white" />
          </Button>
        </div>

        {items.length > 1 && (
          <div className="mt-3 grid grid-cols-6 gap-2">
            {items.map((item, idx) => (
              <button
                key={idx}
                className={`relative aspect-video rounded overflow-hidden border ${idx === currentIndex ? "border-primary" : "border-transparent"}`}
                onClick={() => setCurrentIndex(idx)}
              >
                {item.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="thumb" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-black/60" />
                )}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MediaViewer;

