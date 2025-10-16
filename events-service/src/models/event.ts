import { z } from 'zod';
import { EventBaseSchema as CommonEventBaseSchema } from '@kasi/common-types';

export const EventBaseSchema = CommonEventBaseSchema;
export const NewEventInputSchema = CommonEventBaseSchema;
export const EventSchema = CommonEventBaseSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export const UpdateEventInputSchema = CommonEventBaseSchema.partial();

export type NewEventInput = z.infer<typeof NewEventInputSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventInputSchema>;
export type Event = z.infer<typeof EventSchema>;