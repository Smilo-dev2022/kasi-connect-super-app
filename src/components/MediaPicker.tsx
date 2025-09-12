import * as React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Image as ImageIcon, Camera, Video, Paperclip, Mic, X } from "lucide-react";

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (files: File[]) => void;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({ open, onOpenChange, onSelect }) => {
  const imageInputRef = React.useRef<HTMLInputElement | null>(null);
  const videoInputRef = React.useRef<HTMLInputElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const audioInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    onSelect(files);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Select media</DrawerTitle>
          <DrawerDescription>Choose files to attach to your message</DrawerDescription>
        </DrawerHeader>

        <div className="p-4 grid grid-cols-4 gap-3">
          <Card className="p-3 flex flex-col items-center gap-2 cursor-pointer hover:shadow" onClick={() => imageInputRef.current?.click()}>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="text-xs text-foreground">Gallery</div>
          </Card>
          <Card className="p-3 flex flex-col items-center gap-2 cursor-pointer hover:shadow" onClick={() => imageInputRef.current?.click()}>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div className="text-xs text-foreground">Camera</div>
          </Card>
          <Card className="p-3 flex flex-col items-center gap-2 cursor-pointer hover:shadow" onClick={() => videoInputRef.current?.click()}>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div className="text-xs text-foreground">Video</div>
          </Card>
          <Card className="p-3 flex flex-col items-center gap-2 cursor-pointer hover:shadow" onClick={() => fileInputRef.current?.click()}>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Paperclip className="w-5 h-5" />
            </div>
            <div className="text-xs text-foreground">Document</div>
          </Card>
        </div>

        <DrawerFooter>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">You can select multiple files</div>
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="gap-1">
              <X className="w-4 h-4" />
              Close
            </Button>
          </div>
        </DrawerFooter>

        {/* Hidden Inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </DrawerContent>
    </Drawer>
  );
};

export default MediaPicker;

