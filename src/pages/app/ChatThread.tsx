import { useParams, useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import ChatComposer, { PendingAttachment } from "@/components/ChatComposer";
import MediaViewer, { MediaItem } from "@/components/MediaViewer";

interface Message {
  id: string;
  author: string;
  me: boolean;
  text?: string;
  time: string;
  attachments?: MediaItem[];
}

const SAMPLE_THREADS: Record<string, { name: string; avatar: string; messages: Message[] }> = {
  "1": {
    name: "Family WhatsApp",
    avatar: "👨‍👩‍👧‍👦",
    messages: [
      { id: "m1", author: "Mama", me: false, text: "Don't forget Sunday lunch", time: "10:25" },
      { id: "m2", author: "You", me: true, text: "Ngiyabona, see you!", time: "10:26" }
    ]
  },
  "2": {
    name: "Thabo's Stokvel",
    avatar: "💰",
    messages: [
      { id: "m1", author: "Admin", me: false, text: "Payment reminder for December", time: "09:40" }
    ]
  },
  "3": {
    name: "Ward 12 CPF",
    avatar: "🛡️",
    messages: [
      { id: "m1", author: "CPF", me: false, text: "Safety patrol schedule updated", time: "08:10" }
    ]
  }
};

const ChatThread = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItems, setViewerItems] = useState<MediaItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const thread = useMemo(() => {
    const key = id ?? "1";
    return SAMPLE_THREADS[key] ?? SAMPLE_THREADS["1"];
  }, [id]);

  useEffect(() => {
    setMessages(thread.messages);
  }, [thread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openViewer = (items: MediaItem[], index: number) => {
    setViewerItems(items);
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handleSend = (payload: { text: string; attachments: PendingAttachment[] }) => {
    const newMessage: Message = {
      id: `${Date.now()}`,
      author: "You",
      me: true,
      text: payload.text || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: payload.attachments.map((a) => ({
        url: a.url,
        type: a.type === "video" ? "video" : "image"
      }))
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-24">
      <AppHeader title={thread.name} />

      <div className="p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.me ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] ${msg.me ? "items-end" : "items-start"} flex gap-2`}>
              {!msg.me && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{thread.avatar}</AvatarFallback>
                </Avatar>
              )}
              <Card className={`p-3 bg-card/80 backdrop-blur-sm ${msg.me ? "bg-primary/10 border-primary/20" : ""}`}>
                {msg.text && <div className="text-sm text-foreground whitespace-pre-wrap">{msg.text}</div>}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {msg.attachments.map((att, idx) => (
                      <button key={idx} className="relative overflow-hidden rounded-md border" onClick={() => openViewer(msg.attachments || [], idx)}>
                        {att.type === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={att.url} alt="attachment" className="w-40 h-40 object-cover" />
                        ) : (
                          <div className="w-40 h-40 bg-black/70 text-white flex items-center justify-center">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground mt-1 text-right">{msg.time}</div>
              </Card>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-14 left-0 right-0">
        <ChatComposer onSend={handleSend} />
      </div>

      <MediaViewer open={viewerOpen} onOpenChange={setViewerOpen} items={viewerItems} startIndex={viewerIndex} />
    </div>
  );
};

export default ChatThread;

