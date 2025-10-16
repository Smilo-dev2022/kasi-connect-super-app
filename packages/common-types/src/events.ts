import { z } from 'zod';

export const EventBaseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  startsAt: z.string(),
  endsAt: z.string().optional(),
  reminderMinutesBefore: z.number().int().min(0).max(10080).optional().default(60),
});

export const NewEventInputSchema = EventBaseSchema.superRefine((data, ctx) => {
  // Cross-field validation can be added by consumers
});

export const EventSchema = EventBaseSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type NewEventInput = z.infer<typeof NewEventInputSchema>;
export type Event = z.infer<typeof EventSchema>;
