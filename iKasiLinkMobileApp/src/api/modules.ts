import { api } from './client';

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = { email: string; password: string; name: string };

export const AuthApi = {
  login: (payload: LoginPayload) => api.post('/auth/login', payload),
  register: (payload: RegisterPayload) => api.post('/auth/register', payload),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const ModerationApi = {
  reportContent: (contentId: string, reason: string) => api.post('/moderation/report', { contentId, reason }),
  getReports: () => api.get('/moderation/reports'),
};

export const EventsApi = {
  list: () => api.get('/events'),
  get: (id: string) => api.get(`/events/${id}`),
  create: (payload: Record<string, unknown>) => api.post('/events', payload),
};

export const MessagingApi = {
  listThreads: () => api.get('/messages/threads'),
  getThread: (id: string) => api.get(`/messages/threads/${id}`),
  sendMessage: (threadId: string, text: string) => api.post(`/messages/threads/${threadId}/messages`, { text }),
};

