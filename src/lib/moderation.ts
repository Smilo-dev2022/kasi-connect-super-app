export type ReportCategory =
  | "harassment"
  | "hate_speech"
  | "spam"
  | "sexual_content"
  | "violence"
  | "misinformation"
  | "other";

export interface ModerationReport {
  id: string;
  createdAtIso: string;
  reporterUserId?: string;
  targetId: string; // could be user id, message id, or group id
  targetType: "user" | "message" | "room";
  category: ReportCategory;
  details?: string;
  attachments?: string[]; // urls/base64 (placeholder)
  status: "open" | "reviewing" | "resolved" | "dismissed";
}

export interface BlockEntry {
  id: string; // user id
  createdAtIso: string;
  reason?: string;
}

const REPORTS_KEY = "kasi.moderation.reports.v1";
const BLOCKLIST_KEY = "kasi.moderation.blocklist.v1";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId(prefix: string = "r"): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  const timePart = Date.now().toString(36);
  return `${prefix}_${timePart}_${randomPart}`;
}

export const moderationStore = {
  // Reports
  listReports(): ModerationReport[] {
    return readJson<ModerationReport[]>(REPORTS_KEY, []);
  },
  addReport(input: Omit<ModerationReport, "id" | "createdAtIso" | "status"> & { status?: ModerationReport["status"] }): ModerationReport {
    const next: ModerationReport = {
      id: generateId("rep"),
      createdAtIso: new Date().toISOString(),
      status: input.status ?? "open",
      reporterUserId: input.reporterUserId,
      targetId: input.targetId,
      targetType: input.targetType,
      category: input.category,
      details: input.details,
      attachments: input.attachments ?? [],
    };
    const reports = readJson<ModerationReport[]>(REPORTS_KEY, []);
    reports.unshift(next);
    writeJson(REPORTS_KEY, reports);
    return next;
  },
  updateReport(id: string, updates: Partial<ModerationReport>): ModerationReport | undefined {
    const reports = readJson<ModerationReport[]>(REPORTS_KEY, []);
    const idx = reports.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    const updated: ModerationReport = { ...reports[idx], ...updates };
    reports[idx] = updated;
    writeJson(REPORTS_KEY, reports);
    return updated;
  },
  clearReports() {
    writeJson(REPORTS_KEY, []);
  },

  // Blocklist
  listBlocked(): BlockEntry[] {
    return readJson<BlockEntry[]>(BLOCKLIST_KEY, []);
  },
  isBlocked(userId: string): boolean {
    return this.listBlocked().some(b => b.id === userId);
  },
  block(userId: string, reason?: string): BlockEntry {
    if (this.isBlocked(userId)) {
      return this.listBlocked().find(b => b.id === userId)!;
    }
    const entry: BlockEntry = { id: userId, createdAtIso: new Date().toISOString(), reason };
    const list = this.listBlocked();
    list.unshift(entry);
    writeJson(BLOCKLIST_KEY, list);
    return entry;
  },
  unblock(userId: string): boolean {
    const list = this.listBlocked();
    const next = list.filter(b => b.id !== userId);
    writeJson(BLOCKLIST_KEY, next);
    return next.length !== list.length;
  },
};

export type { ModerationReport as Report, BlockEntry as BlockedUser };
