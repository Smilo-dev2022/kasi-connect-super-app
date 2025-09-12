import { z } from 'zod';

export const RsvpStatusSchema = z.enum(['yes', 'no', 'maybe']);

export const NewRsvpInputSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  status: RsvpStatusSchema.optional().default('yes'),
});

export const RsvpSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  status: RsvpStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const UpdateRsvpInputSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  status: RsvpStatusSchema.optional(),
});

export type NewRsvpInput = z.infer<typeof NewRsvpInputSchema>;
export type UpdateRsvpInput = z.infer<typeof UpdateRsvpInputSchema>;
export type Rsvp = z.infer<typeof RsvpSchema>;