import { z } from "zod";

export const ReportReasonSchema = z.enum([
  "spam",
  "harassment",
  "hate",
  "sexual_content",
  "self_harm_threat",
  "copyright",
  "other"
]);

export const TargetTypeSchema = z.enum(["message", "user", "room", "other"]);

export const CreateReportSchema = z.object({
  reporterId: z.string().min(1),
  targetId: z.string().min(1),
  targetType: TargetTypeSchema,
  reason: ReportReasonSchema,
  description: z.string().max(2000).optional(),
  contextUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;

export const ReviewActionSchema = z.enum([
  "remove_content",
  "ban_user",
  "escalate",
  "ignore",
  "dismiss"
]);

export const ReviewReportSchema = z.object({
  reviewerId: z.string().min(1),
  action: ReviewActionSchema,
  notes: z.string().max(2000).optional()
});

export type ReviewReportInput = z.infer<typeof ReviewReportSchema>;

export type ReportStatus = "pending" | "reviewed" | "dismissed" | "in_review";

export type Report = {
  id: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  status: ReportStatus;
  reporterId: string;
  targetId: string;
  targetType: z.infer<typeof TargetTypeSchema>;
  reason: z.infer<typeof ReportReasonSchema>;
  description?: string;
  contextUrl?: string;
  metadata?: Record<string, unknown>;
  review?: {
    reviewerId: string;
    action: z.infer<typeof ReviewActionSchema>;
    notes?: string;
    reviewedAt: string;
  };
};

