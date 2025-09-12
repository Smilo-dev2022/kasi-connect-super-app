import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { loadConfig } from "./config";
import { logger } from "./logger";
import { reportsRouter } from "./routes/reports";
import { queueRouter } from "./routes/queue";

const app = express();
const config = loadConfig();

app.use(cors());
app.use(express.json());

// Request logging (concise)
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: req.url }, "http_request");
  next();
});

// API routes
app.use("/api/reports", reportsRouter);
app.use("/api/queue", queueRouter);

// Health
app.get("/healthz", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Static admin panel
app.use(
  "/admin",
  express.static(path.join(__dirname, "../public"), { index: "admin.html" })
);

const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, "moderation_service_started");
});

// Graceful shutdown
const shutdownSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
shutdownSignals.forEach((signal) => {
  process.on(signal, () => {
    logger.info({ signal }, "shutdown_signal_received");
    server.close(() => {
      logger.info("http_server_closed");
      process.exit(0);
    });
    // Force shutdown if not closed in time
    setTimeout(() => process.exit(1), 10_000).unref();
  });
});

