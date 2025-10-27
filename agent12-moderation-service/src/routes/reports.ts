import express, { Request, Response } from "express";
import { z } from "zod";
import { CreateReportSchema, ReviewReportSchema } from "../types";
import { store } from "../store";
import { postReportToGroupChat } from "../integrations/groupChat";
import { loadConfig } from "../config";
import { adminAuth } from "../middleware/adminAuth";
import { rateLimitReports } from "../middleware/rateLimit";

export const reportsRouter = express.Router();

reportsRouter.post("/", rateLimitReports, async (req: Request, res: Response) => {
  const parsed = CreateReportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.issues });
  }
  const created = store.createReport(parsed.data);
  // Fire-and-forget group chat notification
  postReportToGroupChat(created, loadConfig()).catch(() => void 0);
  return res.status(201).json(created);
});

reportsRouter.get("/", (req: Request, res: Response) => {
  const status = z
    .union([z.literal("pending"), z.literal("reviewed"), z.literal("dismissed"), z.literal("in_review")])
    .optional()
    .safeParse(req.query.status);
  const list = store.listReports(status.success ? (status.data as any) : undefined);
  return res.json(list);
});

reportsRouter.get("/:id", (req: Request, res: Response) => {
  const report = store.getReport(req.params.id);
  if (!report) return res.status(404).json({ error: "not_found" });
  return res.json(report);
});

reportsRouter.post("/:id/review", adminAuth, (req: Request, res: Response) => {
  const parsed = ReviewReportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.issues });
  }
  const updated = store.reviewReport(req.params.id, parsed.data);
  if (!updated) return res.status(404).json({ error: "not_found" });
  return res.json(updated);
});

