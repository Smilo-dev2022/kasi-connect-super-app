import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import dotenv from "dotenv";
import { createJwt, type JwtPayload } from "@secure/shared";

dotenv.config();

const prisma = new PrismaClient();
const app = Fastify({ logger: true });
app.register(cors, { origin: true });

const otpStartSchema = z.object({ phoneNumber: z.string().min(7).max(20) });
const otpVerifySchema = z.object({ phoneNumber: z.string(), code: z.string(), deviceId: z.string() });

app.post("/otp/start", async (req, reply) => {
  const parsed = otpStartSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
  const { phoneNumber } = parsed.data;

  const code = process.env.OTP_STATIC_CODE || Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.otpCode.create({ data: { phoneNumber, code, expiresAt } });

  app.log.info({ phoneNumber, code }, "OTP generated");
  return { ok: true };
});

app.post("/otp/verify", async (req, reply) => {
  const parsed = otpVerifySchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
  const { phoneNumber, code, deviceId } = parsed.data;

  const now = new Date();
  const otp = await prisma.otpCode.findFirst({ where: { phoneNumber, code, expiresAt: { gt: now } }, orderBy: { createdAt: "desc" } });
  if (!otp) return reply.code(401).send({ error: "Invalid code" });

  let user = await prisma.user.findUnique({ where: { phoneNumber } });
  if (!user) {
    user = await prisma.user.create({ data: { phoneNumber } });
  }

  await prisma.device.upsert({ where: { id: deviceId }, create: { id: deviceId, userId: user.id }, update: {} });

  const payload: JwtPayload = { userId: user.id, deviceId };
  const token = createJwt(payload);

  return { token };
});

const port = Number(process.env.PORT || 4001);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  app.log.info(`auth-service listening on ${port}`);
}).catch((err) => {
  app.log.error(err, "Failed to start server");
  process.exit(1);
});
