import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import dotenv from "dotenv";
import {
  extractBearerToken,
  verifyJwt,
  type JwtPayload,
  type RegisterDeviceKeysRequest,
  type PreKeyBundleResponse,
  type SendMessageRequest,
  type InboxMessage,
} from "@secure/shared";

dotenv.config();

const prisma = new PrismaClient();
const app = Fastify({ logger: true });
app.register(cors, { origin: true });

function requireAuth(request: any, reply: any): JwtPayload | null {
  const token = extractBearerToken(request.headers?.authorization);
  if (!token) {
    reply.code(401).send({ error: "Missing auth" });
    return null;
  }
  try {
    return verifyJwt(token);
  } catch (err) {
    reply.code(401).send({ error: "Invalid token" });
    return null;
  }
}

const registerSchema = z.object({
  deviceId: z.string(),
  keys: z.object({
    identityKeyPublic: z.string(),
    signedPreKeyPublic: z.string(),
    signedPreKeySignature: z.string(),
    oneTimePreKeys: z.array(z.string()).max(500),
  }),
});

app.post("/keys/register", async (req, reply) => {
  const auth = requireAuth(req, reply);
  if (!auth) return;

  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

  const { deviceId, keys } = parsed.data as RegisterDeviceKeysRequest;
  if (deviceId !== auth.deviceId) return reply.code(403).send({ error: "Device mismatch" });

  await prisma.deviceKey.upsert({
    where: { deviceId },
    create: {
      deviceId,
      userId: auth.userId,
      identityKeyPublic: keys.identityKeyPublic,
      signedPreKeyPublic: keys.signedPreKeyPublic,
      signedPreKeySignature: keys.signedPreKeySignature,
    },
    update: {
      userId: auth.userId,
      identityKeyPublic: keys.identityKeyPublic,
      signedPreKeyPublic: keys.signedPreKeyPublic,
      signedPreKeySignature: keys.signedPreKeySignature,
    },
  });

  if (keys.oneTimePreKeys.length > 0) {
    await prisma.oneTimePreKey.createMany({
      data: keys.oneTimePreKeys.map((key) => ({ deviceId, key })),
      skipDuplicates: true,
    });
  }

  return { ok: true };
});

const bundleQuery = z.object({ userId: z.string(), deviceId: z.string() });
app.get("/keys/bundle", async (req, reply) => {
  const auth = requireAuth(req, reply);
  if (!auth) return;

  const parsed = bundleQuery.safeParse(req.query);
  if (!parsed.success) return reply.code(400).send({ error: "Invalid query" });
  const { userId, deviceId } = parsed.data as { userId: string; deviceId: string };

  const device = await prisma.deviceKey.findUnique({ where: { deviceId } });
  if (!device || device.userId !== userId) return reply.code(404).send({ error: "Not found" });

  const prekey = await prisma.oneTimePreKey.findFirst({ where: { deviceId, consumedAt: null }, orderBy: { createdAt: "asc" } });
  if (prekey) {
    await prisma.oneTimePreKey.update({ where: { id: prekey.id }, data: { consumedAt: new Date() } });
  }

  const bundle: PreKeyBundleResponse = {
    deviceId,
    identityKeyPublic: device.identityKeyPublic,
    signedPreKeyPublic: device.signedPreKeyPublic,
    signedPreKeySignature: device.signedPreKeySignature,
    oneTimePreKey: prekey?.key,
  };
  return bundle;
});

const sendSchema = z.object({
  toUserId: z.string(),
  toDeviceId: z.string(),
  ciphertext: z.string(),
});

app.post("/messages/send", async (req, reply) => {
  const auth = requireAuth(req, reply);
  if (!auth) return;
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
  const { toUserId, toDeviceId, ciphertext } = parsed.data as SendMessageRequest;

  await prisma.message.create({
    data: {
      toUserId,
      toDeviceId,
      fromUserId: auth.userId,
      fromDeviceId: auth.deviceId,
      ciphertext,
    },
  });

  return { ok: true };
});

app.get("/inbox", async (req, reply) => {
  const auth = requireAuth(req, reply);
  if (!auth) return;

  const messages = await prisma.message.findMany({
    where: { toUserId: auth.userId, toDeviceId: auth.deviceId },
    orderBy: { createdAt: "asc" },
  });

  const response: InboxMessage[] = messages.map((m) => ({
    fromUserId: m.fromUserId,
    fromDeviceId: m.fromDeviceId,
    ciphertext: m.ciphertext,
    receivedAt: m.createdAt.toISOString(),
  }));

  if (messages.length > 0) {
    await prisma.message.deleteMany({ where: { id: { in: messages.map((m) => m.id) } } });
  }

  return { messages: response };
});

const port = Number(process.env.PORT || 4002);
app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`messaging-service listening on ${port}`);
  })
  .catch((err) => {
    app.log.error(err, "Failed to start server");
    process.exit(1);
  });
