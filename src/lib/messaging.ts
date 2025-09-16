// Messaging service library
export async function sendMessage(groupId: string, content: string) {
  const response = await fetch(`/api/messaging/groups/${groupId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  
  const requestId = response.headers?.get('x-request-id');
  if (requestId) {
    console.log(`Sent message to group ${groupId}, request_id=${requestId}`);
  }
  
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  
  return response.json();
}

export async function getHistory(groupId: string, options: { limit?: number; cursor?: string } = {}) {
  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.cursor) params.append('cursor', options.cursor);
  
  const response = await fetch(`/api/messaging/groups/${groupId}/history?${params}`);
  
  const requestId = response.headers?.get('x-request-id');
  if (requestId) {
    console.log(`Fetched history for group ${groupId}, request_id=${requestId}`);
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch message history' }));
    throw new Error(error.error || 'Failed to fetch message history');
  }
  
  return response.json();
}

export async function getReceipts(groupId: string) {
  const response = await fetch(`/api/messaging/groups/${groupId}/receipts`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch receipts');
  }
  
  return response.json();
}

export async function getMessagesWithReceipts(groupId: string) {
  const [messagesResponse, receiptsResponse] = await Promise.all([
    getHistory(groupId),
    getReceipts(groupId)
  ]);
  
  const messages = messagesResponse.messages || [];
  const receipts = receiptsResponse.receipts || [];
  
  // Join receipts with messages
  return messages.map((message: Record<string, unknown>) => ({
    ...message,
    receipts: receipts.filter((receipt: Record<string, unknown>) => receipt.message_id === message.id)
  }));
}