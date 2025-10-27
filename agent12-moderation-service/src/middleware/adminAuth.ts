import { Request, Response, NextFunction } from "express";
import { loadConfig } from "../config";

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const { adminToken } = loadConfig();
  if (!adminToken) return next();
  const provided = req.header("x-admin-token");
  if (provided && provided === adminToken) return next();
  return res.status(401).json({ error: "unauthorized" });
}

