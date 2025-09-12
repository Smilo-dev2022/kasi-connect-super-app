import { z } from 'zod';
import dayjs from 'dayjs';

const dateStringSchema = z
  .string()
  .refine((value) => dayjs(value).isValid(), 'Invalid date string');

export const EventBaseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  startsAt: dateStringSchema,
  endsAt: dateStringSchema.optional(),
  reminderMinutesBefore: z
    .number()
    .int()
    .min(0)
    .max(10080)
    .optional()
    .default(60),
});

export const NewEventInputSchema = EventBaseSchema.superRefine((data, ctx) => {
  if (data.endsAt && dayjs(data.endsAt).isBefore(dayjs(data.startsAt))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'endsAt must be after startsAt',
      path: ['endsAt'],
    });
  }
});

export const EventSchema = EventBaseSchema.extend({
  id: z.string().uuid(),
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema.optional(),
});

export const UpdateEventInputSchema = EventBaseSchema.partial();

export type NewEventInput = z.infer<typeof NewEventInputSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventInputSchema>;
export type Event = z.infer<typeof EventSchema>;