import { useParams } from "react-router-dom";
import { useRef, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Image as ImageIcon, Paperclip, Mic, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: string;
  sender: "me" | "them";
  type: "text" | "image";
  text?: string;
  imageUrl?: string;
  time: string;
};

const initialMessages: Message[] = [
  { id: "1", sender: "them", type: "text", text: "Hello! Welcome to the group.", time: "09:10" },
  { id: "2", sender: "me", type: "text", text: "Hi all 👋", time: "09:12" },
];

const ChatDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const images = messages.filter((m) => m.type === "image");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newMsg: Message = {
      id: String(Date.now()),
      sender: "me",
      type: "text",
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setText("");
  };

  const handlePickImage = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };

  const handleFilesSelected: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = e.target.files as FileList | null;
    if (!files || files.length === 0) return;

    const toAdd: Message[] = [];
    Array.from(files).forEach((file: File) => {
      const url = URL.createObjectURL(file);
      toAdd.push({
        id: `${Date.now()}-${file.name}`,
        sender: "me",
        type: "image",
        imageUrl: url,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    });
    setMessages((prev) => [...prev, ...toAdd]);
    setIsAttachOpen(false);
    toast({ title: "Media attached", description: `${toAdd.length} file(s) added` });
  };

  const openViewerAt = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title={`Chat #${id}`} showBack />

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          {messages.map((m, idx) => (
            <div key={m.id} className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"}`}>
              <div className="flex items-end gap-2 max-w-[80%]">
                {m.sender === "them" && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>G</AvatarFallback>
                  </Avatar>
                )}
                {m.type === "text" ? (
                  <Card className={`p-3 ${m.sender === "me" ? "bg-primary/20 border-primary/30" : "bg-card/80"}`}>
                    <div className="text-sm text-foreground whitespace-pre-wrap">{m.text}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 text-right">{m.time}</div>
                  </Card>
                ) : (
                  <button
                    className="relative"
                    onClick={() => openViewerAt(images.findIndex((img) => img.id === m.id))}
                    aria-label="Open image"
                  >
                    <img
                      src={m.imageUrl}
                      alt="Attachment"
                      className="rounded-xl border w-48 h-48 object-cover"
                    />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-14 left-0 right-0 px-4">
        <Card className="p-2 bg-white">
          <div className="flex items-center gap-2">
            <Sheet open={isAttachOpen} onOpenChange={setIsAttachOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Attach">
                  <Paperclip className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="pb-6">
                <SheetHeader>
                  <SheetTitle>Attach</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-4 gap-3 pt-4">
                  <Button variant="outline" className="flex flex-col gap-2 h-auto py-3" onClick={handlePickImage}>
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-xs">Photos</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col gap-2 h-auto py-3" onClick={() => toast({ title: "Coming soon", description: "Camera access" })}>
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-xs">Camera</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col gap-2 h-auto py-3" onClick={() => toast({ title: "Coming soon", description: "Documents" })}>
                    <Paperclip className="w-5 h-5" />
                    <span className="text-xs">Document</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col gap-2 h-auto py-3" onClick={() => toast({ title: "Coming soon", description: "Voice note" })}>
                    <Mic className="w-5 h-5" />
                    <span className="text-xs">Audio</span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <Button onClick={handleSend} aria-label="Send">
              <Send className="w-5 h-5" />
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFilesSelected}
            />
          </div>
        </Card>
      </div>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="p-0 bg-black/90 border-0 max-w-3xl">
          <Carousel className="w-full">
            <CarouselContent>
              {images.map((img, index) => (
                <CarouselItem key={img.id} className="flex items-center justify-center">
                  <img src={img.imageUrl} alt="Preview" className="max-h-[80vh] object-contain" />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatDetail;

