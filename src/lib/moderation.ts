// Lightweight moderation service stubs (Agent 12)
// Provides abuse reporting, content classification, and a local moderation queue

export type ContentType = "message" | "image" | "profile" | "room";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export interface ModerationReportInput {
  reporterId?: string;
  targetId: string;
  content: string;
  contentType: ContentType;
  context?: string;
}

export interface ModerationItem {
  id: string;
  targetId: string;
  contentSnippet: string;
  contentType: ContentType;
  category: string;
  severity: SeverityLevel;
  status: "pending" | "reviewed" | "escalated" | "resolved";
  createdAt: number;
}

export interface ClassificationResult {
  category: string;
  severity: SeverityLevel;
  confidence: number; // 0..1
}

// In-memory queue; in a real app, back this with an API
const moderationQueue: ModerationItem[] = [];

function generateId(prefix: string = "mod") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function classifyContent(text: string): Promise<ClassificationResult> {
  const normalized = text.toLowerCase();

  // Very naive keyword-based classification placeholder
  const isThreat = /(kill|harm|bomb|attack)/.test(normalized);
  const isHate = /(hate|slur|racist|xenophob(e|ic)|homophob(e|ic))/i.test(normalized);
  const isSpam = /(free money|click here|loan|crypto)/.test(normalized);

  let category = "other";
  let severity: SeverityLevel = "low";
  let confidence = 0.4;

  if (isThreat) {
    category = "threats";
    severity = "critical";
    confidence = 0.9;
  } else if (isHate) {
    category = "hate_speech";
    severity = "high";
    confidence = 0.85;
  } else if (isSpam) {
    category = "spam";
    severity = "medium";
    confidence = 0.7;
  }

  return { category, severity, confidence };
}

export async function submitReport(input: ModerationReportInput): Promise<ModerationItem> {
  const classification = await classifyContent(input.content);

  const item: ModerationItem = {
    id: generateId(),
    targetId: input.targetId,
    contentSnippet: input.content.slice(0, 160),
    contentType: input.contentType,
    category: classification.category,
    severity: classification.severity,
    status: "pending",
    createdAt: Date.now(),
  };

  moderationQueue.unshift(item);
  return item;
}

export async function listQueue(): Promise<ModerationItem[]> {
  return moderationQueue;
}

export async function updateItemStatus(id: string, status: ModerationItem["status"]): Promise<ModerationItem | undefined> {
  const index = moderationQueue.findIndex((q) => q.id === id);
  if (index === -1) return undefined;
  moderationQueue[index] = { ...moderationQueue[index], status };
  return moderationQueue[index];
}

export async function clearQueue(): Promise<void> {
  moderationQueue.length = 0;
}

