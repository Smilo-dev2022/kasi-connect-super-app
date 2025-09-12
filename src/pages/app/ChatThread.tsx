import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SimpleWsClient, IncomingMessage, OutgoingMessage, formatCurrencyZAR } from "@/lib/utils";

type LocalMessage = {
  id: string;
  from: string;
  to: string;
  scope: 'direct' | 'group';
  contentType?: string;
  body: unknown;
  timestamp: number;
};

type OrderOffer = {
  kind: 'order_offer';
  title: string;
  items: { name: string; qty: number; price: number }[];
  currency: string;
};

type OrderAccept = {
  kind: 'order_accept';
  forMessageId: string;
};

const encode = (body: unknown) => JSON.stringify(body);
const decode = (ciphertext: string): unknown => {
  try { return JSON.parse(ciphertext); } catch { return ciphertext; }
};

export default function ChatThread() {
  const params = useParams();
  const [search] = useSearchParams();
  const toId = params.toId as string;
  const selfId = "me";
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const clientRef = useRef<SimpleWsClient | null>(null);

  useEffect(() => {
    const client = new SimpleWsClient({ url: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host.replace(/:\d+$/, '')}:8080/ws`, userId: selfId });
    client.connect();
    client.onMessage((m: IncomingMessage) => {
      const body = decode(m.ciphertext) as any;
      setMessages((prev) => [...prev, { id: m.id, from: m.from, to: m.to, scope: m.scope, contentType: m.contentType, body, timestamp: m.timestamp }]);
      if (body && body.kind === 'order_accept' && body.forMessageId) {
        setAcceptedIds((prev) => new Set(prev).add(body.forMessageId));
      }
    });
    clientRef.current = client;
    return () => { clientRef.current = null; };
  }, []);

  useEffect(() => {
    const prefill = search.get('prefill');
    if (prefill) {
      try {
        const offer = JSON.parse(decodeURIComponent(prefill)) as OrderOffer;
        // Simulate incoming order so the current user can accept
        const id = String(Date.now());
        setMessages((prev) => [
          ...prev,
          { id, from: toId, to: selfId, scope: 'direct', contentType: 'application/json', body: offer, timestamp: Date.now() },
        ]);
      } catch {}
    }
  }, [search]);

  const sendBody = (body: unknown, contentType?: string) => {
    const msg: OutgoingMessage = { type: 'msg', to: toId, scope: 'direct', ciphertext: encode(body), contentType, timestamp: Date.now() };
    clientRef.current?.send(msg);
    // Optimistic echo
    const id = String(Date.now());
    setMessages((prev) => [...prev, { id, from: selfId, to: toId, scope: 'direct', contentType, body, timestamp: Date.now() }]);
    if ((body as any)?.kind === 'order_accept' && (body as any).forMessageId) {
      setAcceptedIds((prev) => new Set(prev).add((body as any).forMessageId));
    }
  };

  const onSendText = () => {
    if (!input.trim()) return;
    sendBody({ kind: 'text', text: input }, 'application/json');
    setInput("");
  };

  const onAcceptOrder = (messageId: string) => {
    const accept: OrderAccept = { kind: 'order_accept', forMessageId: messageId };
    sendBody(accept, 'application/json');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title={`Chat with ${toId}`} />
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          {messages.map((m) => (
            <div key={m.id}>
              <MessageBubble selfId={selfId} message={m} onAcceptOrder={onAcceptOrder} accepted={acceptedIds.has(m.id)} />
            </div>
          ))}
        </div>
        <Card className="p-2 flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message" />
          <Button onClick={onSendText}>Send</Button>
        </Card>
      </div>
    </div>
  );
}

function MessageBubble({ selfId, message, onAcceptOrder, accepted }: { selfId: string; message: LocalMessage; onAcceptOrder: (id: string) => void; accepted: boolean }) {
  const isMine = message.from === selfId;
  const body = message.body as any;
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      {body?.kind === 'order_offer' ? (
        <OrderCard id={message.id} offer={body as OrderOffer} isMine={isMine} onAccept={() => onAcceptOrder(message.id)} accepted={accepted} />
      ) : body?.kind === 'order_accept' ? (
        <Card className="p-3 bg-green-50 border-green-200 max-w-md">
          <div className="text-sm">Order accepted</div>
        </Card>
      ) : body?.kind === 'text' ? (
        <Card className={`p-3 ${isMine ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>{body.text}</Card>
      ) : (
        <Card className="p-3">Unsupported message</Card>
      )}
    </div>
  );
}

function OrderCard({ id, offer, isMine, onAccept, accepted }: { id: string; offer: OrderOffer; isMine: boolean; onAccept: () => void; accepted: boolean }) {
  const total = useMemo(() => offer.items.reduce((sum, it) => sum + it.price * it.qty, 0), [offer]);
  return (
    <Card className="p-4 w-full max-w-md bg-card/80 backdrop-blur-sm">
      <div className="text-sm font-semibold mb-2">{offer.title}</div>
      <div className="space-y-1 mb-3">
        {offer.items.map((it, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div>
              <div className="font-medium">{it.name}</div>
              <div className="text-xs text-muted-foreground">Qty {it.qty}</div>
            </div>
            <div className="text-right font-medium">{formatCurrencyZAR(it.price * it.qty)}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-muted-foreground">Total</div>
        <div className="font-bold">{formatCurrencyZAR(total)}</div>
      </div>
      {!isMine ? (
        accepted ? (
          <Badge className="w-fit">Accepted</Badge>
        ) : (
          <Button className="w-full" onClick={onAccept}>Accept Order</Button>
        )
      ) : (
        accepted ? <Badge className="w-fit">Accepted</Badge> : <Badge variant="outline" className="w-fit">Awaiting acceptance</Badge>
      )}
    </Card>
  );
}

