interface QueueItem {
  id: string;
  status: string;
  claimed_by: string | null;
  [key: string]: unknown;
}

interface QueueState {
  items: QueueItem[];
}

export async function optimisticallyClaimItem(
  itemId: string, 
  moderatorId: string, 
  queueState: QueueState
) {
  // Optimistic update
  const originalItem = queueState.items.find((item: QueueItem) => item.id === itemId);
  const itemIndex = queueState.items.findIndex((item: QueueItem) => item.id === itemId);
  
  if (itemIndex !== -1) {
    queueState.items[itemIndex] = {
      ...originalItem,
      claimed_by: moderatorId,
      status: 'in_review'
    } as QueueItem;
  }

  try {
    // API call would happen here
    const response = await fetch(`/api/reports/${itemId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moderator_id: moderatorId })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    return response.json();
  } catch (error) {
    // Rollback optimistic update
    if (itemIndex !== -1 && originalItem) {
      queueState.items[itemIndex] = originalItem;
    }
    throw error;
  }
}

export async function optimisticallyEscalateReport(
  report: QueueItem,
  moderatorId: string
) {
  const originalStatus = report.status;
  const originalEscalationLevel = (report as QueueItem & { escalation_level?: number }).escalation_level;

  // Optimistic update
  report.status = 'escalated';
  (report as QueueItem & { escalation_level: number }).escalation_level = ((report as QueueItem & { escalation_level?: number }).escalation_level || 0) + 1;
  (report as QueueItem & { escalated_by: string }).escalated_by = moderatorId;

  try {
    const response = await fetch(`/api/reports/${report.id}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moderator_id: moderatorId })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    return response.json();
  } catch (error) {
    // Rollback optimistic update
    report.status = originalStatus;
    (report as QueueItem & { escalation_level?: number }).escalation_level = originalEscalationLevel;
    delete (report as QueueItem & { escalated_by?: string }).escalated_by;
    throw error;
  }
}

export default function ModerationQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  
  return (
    <div>
      <h2>Moderation Queue</h2>
      {items.map((item: QueueItem) => (
        <div key={item.id}>
          <span>{(item as QueueItem & { content_text?: string }).content_text}</span>
          <span>{item.status}</span>
        </div>
      ))}
    </div>
  );
}