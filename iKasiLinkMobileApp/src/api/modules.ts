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
  list: () => api.get('/api/events'),
  get: (id: string) => api.get(`/api/events/${id}`),
  create: (payload: Record<string, unknown>) => api.post('/api/events', payload),
};

export const MessagingApi = {
  // Raw messaging model uses WS for send/receive; HTTP only for missed since ts
  missedSince: (ts: number) => api.get(`/messages/since/${ts}`),
};

