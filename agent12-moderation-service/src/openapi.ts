import express, { Request, Response } from "express";

const spec = {
  openapi: "3.0.0",
  info: { title: "Moderation Service API", version: "1.0.0" },
  paths: {
    "/healthz": { get: { summary: "Health check", responses: { "200": { description: "ok" } } } },
    "/api/reports": {
      get: { summary: "List reports", responses: { "200": { description: "OK" } } },
      post: { summary: "Create report", responses: { "201": { description: "Created" }, "400": { description: "Bad Request" }, "429": { description: "Rate Limited" } } }
    },
    "/api/reports/{id}": { get: { summary: "Get report", parameters: [{ name: "id", in: "path", required: true }], responses: { "200": { description: "OK" }, "404": { description: "Not Found" } } } },
    "/api/reports/{id}/review": { post: { summary: "Review report", parameters: [{ name: "id", in: "path", required: true }], responses: { "200": { description: "OK" }, "400": { description: "Bad Request" }, "401": { description: "Unauthorized" }, "404": { description: "Not Found" } } } },
    "/api/queue": { get: { summary: "Get queue", responses: { "200": { description: "OK" } } } },
    "/api/queue/claim": { post: { summary: "Claim next", responses: { "200": { description: "OK" }, "204": { description: "No Content" }, "401": { description: "Unauthorized" } } } }
  }
};

export const docsRouter = express.Router();

docsRouter.get("/docs", (_req: Request, res: Response) => {
  res.json(spec);
});

