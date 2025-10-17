import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ModerationItem } from "@/lib/moderation";
import { listQueue, updateItemStatus } from "@/lib/moderation";

interface ModerationQueueProps {
  pollIntervalMs?: number;
}

export default function ModerationQueue({ pollIntervalMs = 1000 }: ModerationQueueProps) {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    async function refreshQueue() {
      const queue = await listQueue();
      // Create a new array reference to ensure React detects state changes
      if (isMountedRef.current) {
        setItems([...queue]);
      }
    }

    // Initial load
    void refreshQueue();

    // Poll for changes
    const intervalId = setInterval(() => {
      void refreshQueue();
    }, pollIntervalMs);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [pollIntervalMs]);

  async function handleEscalate(itemId: string) {
    await updateItemStatus(itemId, "escalated");
    // Optimistically update UI; polling will reconcile as well
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, status: "escalated" } : i)));
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Moderation Queue</h2>
      {items.length === 0 && <p>No reports in queue.</p>}
      {items.length > 0 && (
        <div className="space-y-2" aria-label="queue-list">
          {items.map((item) => (
            <Card key={item.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium" data-testid={`snippet-${item.id}`}>{item.contentSnippet}</div>
                <div className="text-sm text-muted-foreground" data-testid={`status-${item.id}`}>
                  Status: {item.status}
                </div>
              </div>
              {item.status === "pending" && (
                <Button onClick={() => void handleEscalate(item.id)}>Escalate</Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

