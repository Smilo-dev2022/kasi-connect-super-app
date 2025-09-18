import dotenv from "dotenv";

export type ServiceConfig = {
  port: number;
  env: "development" | "test" | "production";
  groupChatWebhookUrl?: string;
  dataFilePath?: string;
  adminToken?: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
};

export function loadConfig(): ServiceConfig {
  dotenv.config();
  const env = (process.env.NODE_ENV as ServiceConfig["env"]) || "development";
  const port = Number(process.env.PORT || 4000);
  const groupChatWebhookUrl = process.env.GROUP_CHAT_WEBHOOK_URL || undefined;
  const dataFilePath = process.env.DATA_FILE || undefined;
  const adminToken = process.env.ADMIN_TOKEN || undefined;
  const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
  const rateLimitMax = Number(process.env.RATE_LIMIT_MAX || 30);

  return { port, env, groupChatWebhookUrl, dataFilePath, adminToken, rateLimitWindowMs, rateLimitMax };
}

