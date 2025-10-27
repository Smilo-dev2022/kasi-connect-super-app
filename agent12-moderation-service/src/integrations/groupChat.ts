import { Report } from "../types";
import { ServiceConfig } from "../config";
import { logger } from "../logger";

export async function postReportToGroupChat(report: Report, config: ServiceConfig) {
  const message = {
    title: "New Abuse Report",
    id: report.id,
    reason: report.reason,
    targetType: report.targetType,
    targetId: report.targetId,
    reporterId: report.reporterId,
    createdAt: report.createdAt,
    description: report.description ?? null,
    contextUrl: report.contextUrl ?? null
  };

  if (!config.groupChatWebhookUrl) {
    logger.info({ message }, "group_chat_stub_no_webhook_configured");
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(config.groupChatWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: JSON.stringify(message) }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    logger.info({ id: report.id }, "group_chat_notified");
  } catch (err) {
    logger.warn({ err: String(err) }, "group_chat_notification_failed");
  }
}

