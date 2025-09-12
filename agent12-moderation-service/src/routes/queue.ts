import express, { Request, Response } from "express";
import { store } from "../store";

export const queueRouter = express.Router();

queueRouter.get("/", (_req: Request, res: Response) => {
  return res.json(store.getQueue());
});

queueRouter.post("/claim", (_req: Request, res: Response) => {
  const claimed = store.claimNext();
  if (!claimed) return res.status(204).send();
  return res.json(claimed);
});

