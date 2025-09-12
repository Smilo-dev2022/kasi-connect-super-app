import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Paperclip, Image as ImageIcon, Send, X, Trash, Play } from "lucide-react";
import MediaPicker from "@/components/MediaPicker";

export interface PendingAttachment {
  id: string;
  file: File;
  url: string;
  type: "image" | "video" | "file" | "audio";
}

interface ChatComposerProps {
  onSend: (payload: { text: string; attachments: PendingAttachment[] }) => void;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({ onSend }) => {
  const [text, setText] = React.useState("");
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [attachments, setAttachments] = React.useState<PendingAttachment[]>([]);
  const [recording, setRecording] = React.useState(false);

  const addFiles = (files: File[]) => {
    const next = files.map((file) => {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("audio/")
        ? "audio"
        : "file";
      return { id: `${Date.now()}-${file.name}`, file, url, type } as PendingAttachment;
    });
    setAttachments((prev) => [...prev, ...next]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = () => {
    if (!text.trim() && attachments.length === 0) return;
    onSend({ text: text.trim(), attachments });
    setText("");
    setAttachments([]);
  };

  const toggleRecord = () => {
    // Stub: fake start/stop of audio recording
    setRecording((r) => !r);
  };

  return (
    <div className="border-t border-border bg-white p-3 space-y-2">
      {attachments.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {attachments.map((a) => (
            <Card key={a.id} className="relative p-2 min-w-[96px] max-w-[128px]">
              {a.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt={a.file.name} className="w-24 h-24 object-cover rounded" />
              ) : (
                <div className="w-24 h-24 bg-accent/30 rounded flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              <button className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background border flex items-center justify-center" onClick={() => removeAttachment(a.id)}>
                <X className="w-3 h-3" />
              </button>
              <div className="mt-1 text-[10px] truncate max-w-[96px]">{a.file.name}</div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <Button variant="outline" size="icon" className="w-10 h-10" onClick={() => setPickerOpen(true)}>
          <Paperclip className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message"
            className="w-full"
          />
        </div>
        <Button variant={recording ? "destructive" : "outline"} size="icon" className="w-10 h-10" onClick={toggleRecord}>
          <Mic className="w-4 h-4" />
        </Button>
        <Button variant="community" size="icon" className="w-10 h-10" onClick={handleSend}>
          <Send className="w-4 h-4" />
        </Button>
      </div>

      <MediaPicker open={pickerOpen} onOpenChange={setPickerOpen} onSelect={addFiles} />
    </div>
  );
};

export default ChatComposer;

