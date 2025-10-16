import { z } from 'zod';

export const MessageStubSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  sender_id: z.string(),
  text: z.string().default(''),
  created_at: z.number().int(),
  type: z.enum(['text', 'image', 'video', 'link', 'other']).default('text'),
});

export type MessageStub = z.infer<typeof MessageStubSchema>;
