"use strict";
// Lightweight moderation service stubs (Agent 12)
// Provides abuse reporting, content classification, and a local moderation queue
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyContent = classifyContent;
exports.submitReport = submitReport;
exports.listQueue = listQueue;
exports.updateItemStatus = updateItemStatus;
exports.clearQueue = clearQueue;
// In-memory queue; in a real app, back this with an API
const moderationQueue = [];
function generateId(prefix = "mod") {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
async function classifyContent(text) {
    const normalized = text.toLowerCase();
    // Very naive keyword-based classification placeholder
    const isThreat = /(kill|harm|bomb|attack)/.test(normalized);
    const isHate = /(hate|slur|racist|xenophob(e|ic)|homophob(e|ic))/i.test(normalized);
    const isSpam = /(free money|click here|loan|crypto)/.test(normalized);
    let category = "other";
    let severity = "low";
    let confidence = 0.4;
    if (isThreat) {
        category = "threats";
        severity = "critical";
        confidence = 0.9;
    }
    else if (isHate) {
        category = "hate_speech";
        severity = "high";
        confidence = 0.85;
    }
    else if (isSpam) {
        category = "spam";
        severity = "medium";
        confidence = 0.7;
    }
    return { category, severity, confidence };
}
async function submitReport(input) {
    const classification = await classifyContent(input.content);
    const item = {
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
async function listQueue() {
    return moderationQueue;
}
async function updateItemStatus(id, status) {
    const index = moderationQueue.findIndex((q) => q.id === id);
    if (index === -1)
        return undefined;
    moderationQueue[index] = { ...moderationQueue[index], status };
    return moderationQueue[index];
}
async function clearQueue() {
    moderationQueue.length = 0;
}
