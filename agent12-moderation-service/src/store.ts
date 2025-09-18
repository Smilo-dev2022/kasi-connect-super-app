import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { CreateReportInput, Report, ReviewReportInput } from "./types";
import { loadConfig } from "./config";
import { logger } from "./logger";

type PersistedData = {
  reports: Report[];
  queueIds: string[];
};

class InMemoryStore {
  private reportsById: Map<string, Report> = new Map();
  private queueIds: string[] = [];
  private dataFilePath?: string;
  private persistTimer?: NodeJS.Timeout;

  constructor() {
    const config = loadConfig();
    this.dataFilePath = config.dataFilePath;
    if (this.dataFilePath) {
      this.loadFromDiskSafe(this.dataFilePath);
    }
  }

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
    this.persistDebounced();
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
    this.persistDebounced();
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
      this.persistDebounced();
      return updated;
    }
    return undefined;
  }

  private toPersistedData(): PersistedData {
    return {
      reports: Array.from(this.reportsById.values()),
      queueIds: [...this.queueIds]
    };
  }

  private loadFromDiskSafe(filePath: string) {
    try {
      const resolved = path.resolve(filePath);
      if (!fs.existsSync(resolved)) return;
      const raw = fs.readFileSync(resolved, "utf-8");
      const data = JSON.parse(raw) as PersistedData;
      this.reportsById.clear();
      for (const r of data.reports || []) {
        this.reportsById.set(r.id, r);
      }
      this.queueIds = Array.isArray(data.queueIds) ? data.queueIds : [];
      logger.info({ filePath: resolved, count: this.reportsById.size }, "store_loaded_from_disk");
    } catch (err) {
      logger.warn({ err: String(err) }, "store_load_failed");
    }
  }

  private persistDebounced() {
    if (!this.dataFilePath) return;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => this.persistNow(), 250);
  }

  private persistNow() {
    if (!this.dataFilePath) return;
    try {
      const resolved = path.resolve(this.dataFilePath);
      const dir = path.dirname(resolved);
      fs.mkdirSync(dir, { recursive: true });
      const tmp = `${resolved}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.toPersistedData(), null, 2), "utf-8");
      fs.renameSync(tmp, resolved);
    } catch (err) {
      logger.warn({ err: String(err) }, "store_persist_failed");
    }
  }
}

export const store = new InMemoryStore();

