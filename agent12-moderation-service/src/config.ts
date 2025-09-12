import dotenv from "dotenv";

export type ServiceConfig = {
  port: number;
  env: "development" | "test" | "production";
  groupChatWebhookUrl?: string;
};

export function loadConfig(): ServiceConfig {
  dotenv.config();
  const env = (process.env.NODE_ENV as ServiceConfig["env"]) || "development";
  const port = Number(process.env.PORT || 4000);
  const groupChatWebhookUrl = process.env.GROUP_CHAT_WEBHOOK_URL || undefined;

  return { port, env, groupChatWebhookUrl };
}

