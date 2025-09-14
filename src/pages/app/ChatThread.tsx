import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessagingClient, IncomingMessage } from '@/lib/messagingClient';
import { getCurrentUserId, setCurrentUserId } from '@/lib/devAuth';
import { Check, X, ShoppingBag, CreditCard } from 'lucide-react';
const WALLET_API = (import.meta as any)?.env?.VITE_WALLET_API || 'http://localhost:8000';

type OrderPayload = {
  kind: 'order';
  orderId: string;
  item: string;
  price: number;
  currency: string;
  status: 'requested' | 'accepted' | 'declined';
};

function encode(payload: unknown): string {
  return JSON.stringify(payload);
}

function tryDecode(ciphertext: string): unknown | undefined {
  try {
    return JSON.parse(ciphertext);
  } catch {
    return undefined;
  }
}

export default function ChatThread() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientRef = useRef<MessagingClient>();
  const [activeUserId, setActiveUserId] = useState<string>(getCurrentUserId());
  const [messages, setMessages] = useState<IncomingMessage[]>([]);
  const [text, setText] = useState('');

  const peerId = useMemo(() => threadId || 'business-1', [threadId]);

  useEffect(() => {
    const client = new MessagingClient();
    clientRef.current = client;
    (async () => {
      await client.connect(activeUserId);
      client.onMessage((m) => {
        if ((m.from === activeUserId && m.to === peerId) || (m.from === peerId && m.to === activeUserId)) {
          setMessages((prev) => [...prev, m]);
        }
      });
      if (searchParams.get('ord') === '1') {
        // auto-send a demo order request on entry
        const order: OrderPayload = {
          kind: 'order',
          orderId: `ord_${Date.now()}`,
          item: 'Standard Order',
          price: 120,
          currency: 'ZAR',
          status: 'requested',
        };
        client.send({ to: peerId, scope: 'direct', ciphertext: encode(order), contentType: 'application/order+json' });
      }
    })();
    return () => {
      clientRef.current = undefined;
    };
  }, [activeUserId, peerId, searchParams]);

  function sendText() {
    if (!text.trim()) return;
    clientRef.current?.send({ to: peerId, scope: 'direct', ciphertext: encode({ kind: 'text', text }) });
    setText('');
  }

  function sendOrderRequest() {
    const order: OrderPayload = {
      kind: 'order',
      orderId: `ord_${Date.now()}`,
      item: 'Standard Order',
      price: 120,
      currency: 'ZAR',
      status: 'requested',
    };
    clientRef.current?.send({ to: peerId, scope: 'direct', ciphertext: encode(order), contentType: 'application/order+json' });
  }

  function respondToOrder(source: IncomingMessage, status: 'accepted' | 'declined') {
    const decoded = tryDecode(source.ciphertext) as Partial<OrderPayload> | undefined;
    if (!decoded || decoded.kind !== 'order' || !decoded.orderId) return;
    const response: OrderPayload = { ...decoded, status } as OrderPayload;
    clientRef.current?.send({ to: peerId, scope: 'direct', ciphertext: encode(response), contentType: 'application/order+json' });
  }

  async function createWalletRequest(price: number) {
    const body = { group_id: 'group-demo', requester_id: activeUserId, amount_cents: Math.round(price * 100) };
    await fetch(`${WALLET_API}/wallet/requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title={`Chat with ${peerId}`} onBack={() => navigate(-1)} />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <Button size="sm" variant={activeUserId === 'user-demo' ? 'community' : 'outline'} onClick={() => { setCurrentUserId('user-demo'); setActiveUserId('user-demo'); }}>Use as Customer</Button>
          <Button size="sm" variant={activeUserId === peerId ? 'community' : 'outline'} onClick={() => { setCurrentUserId(peerId); setActiveUserId(peerId); }}>Use as Business</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="community" onClick={sendOrderRequest}>
            <ShoppingBag className="w-4 h-4 mr-2" /> Send Order Request
          </Button>
          <Button variant="outline" onClick={() => createWalletRequest(120)}>
            <CreditCard className="w-4 h-4 mr-2" /> Request Wallet Payment
          </Button>
        </div>
        <div className="space-y-2">
          {messages.map((m) => {
            const decoded = tryDecode(m.ciphertext) as any;
            const isMine = m.from === activeUserId;
            const align = isMine ? 'items-end' : 'items-start';
            const bg = isMine ? 'bg-primary text-primary-foreground' : 'bg-card';
            const showOrder = decoded && decoded.kind === 'order';
            return (
              <div key={m.id} className={`flex ${align}`}>
                <Card className={`p-3 max-w-[80%] ${bg}`}>
                  {!showOrder ? (
                    <div className="text-sm">{decoded?.text ?? m.ciphertext}</div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Order</Badge>
                        <span className="text-sm font-medium">{decoded.item}</span>
                      </div>
                      <div className="text-sm">Total: {decoded.currency} {decoded.price}</div>
                      <div className="text-xs text-muted-foreground">Status: {decoded.status}</div>
                      {decoded.status === 'requested' && m.from !== activeUserId && (
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" variant="community" onClick={() => respondToOrder(m, 'accepted')}>
                            <Check className="w-4 h-4 mr-1" /> Accept
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => respondToOrder(m, 'declined')}>
                            <X className="w-4 h-4 mr-1" /> Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
        <div className="fixed bottom-16 left-0 right-0 p-3 bg-background/80 backdrop-blur border-t">
          <div className="mx-auto max-w-2xl flex gap-2">
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" />
            <Button onClick={sendText}>Send</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

