import { v4 as uuidv4 } from "uuid";
import { CreateReportInput, Report, ReviewReportInput } from "./types";

class InMemoryStore {
  private reportsById: Map<string, Report> = new Map();
  private queueIds: string[] = [];

  createReport(input: CreateReportInput): Report {
    const now = new Date().toISOString();
    const id = uuidv4();
    const report: Report = {
      id,
      createdAt: now,
      updatedAt: now,
      status: "pending",
      reporterId: input.reporterId,
      targetId: input.targetId,
      targetType: input.targetType,
      reason: input.reason,
      description: input.description,
      contextUrl: input.contextUrl,
      metadata: input.metadata
    };

    this.reportsById.set(id, report);
    this.queueIds.push(id);
    return report;
  }

  listReports(status?: Report["status"]): Report[] {
    const all = Array.from(this.reportsById.values());
    if (!status) return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return all
      .filter((r) => r.status === status)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  getReport(id: string): Report | undefined {
    return this.reportsById.get(id);
  }

  reviewReport(id: string, input: ReviewReportInput): Report | undefined {
    const existing = this.reportsById.get(id);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const updated: Report = {
      ...existing,
      updatedAt: now,
      status: input.action === "dismiss" ? "dismissed" : "reviewed",
      review: {
        reviewerId: input.reviewerId,
        action: input.action,
        notes: input.notes,
        reviewedAt: now
      }
    };
    this.reportsById.set(id, updated);
    // Remove from queue if present
    this.queueIds = this.queueIds.filter((qid) => qid !== id);
    return updated;
  }

  getQueue(): Report[] {
    const reports: Report[] = [];
    for (const id of this.queueIds) {
      const r = this.reportsById.get(id);
      if (r && r.status === "pending") {
        reports.push(r);
      }
    }
    return reports;
  }

  claimNext(reviewerId?: string): Report | undefined {
    while (this.queueIds.length > 0) {
      const id = this.queueIds.shift() as string;
      const r = this.reportsById.get(id);
      if (!r) continue;
      if (r.status !== "pending") continue;
      const now = new Date().toISOString();
      const updated: Report = {
        ...r,
        status: "in_review",
        updatedAt: now,
        review: r.review ?? undefined
      };
      this.reportsById.set(id, updated);
      return updated;
    }
    return undefined;
  }
}

export const store = new InMemoryStore();

