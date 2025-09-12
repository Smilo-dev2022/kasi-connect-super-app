import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import {
  initializeSchema,
  getUserByEmail,
  getUserByPhone,
  createUser,
  createOtp,
  verifyOtp,
  generateNumericCode,
} from "./db.js";

initializeSchema();

const router = Router();

const signupSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  name: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
});

const otpVerifySchema = z.object({
  userId: z.string(),
  code: z.string().length(6),
  purpose: z.enum(["signup", "login"]),
});

router.post("/signup", (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const { email, phone, name } = parsed.data;
  if (!email && !phone) {
    return res.status(400).json({ error: "Provide email or phone" });
  }
  const existing = email ? getUserByEmail(email) : getUserByPhone(phone);
  if (existing) {
    return res.status(409).json({ error: "Account exists. Use login." });
  }
  const id = uuidv4();
  const user = createUser({ id, email, phone, name });

  const code = generateNumericCode(6);
  const otpId = uuidv4();
  createOtp({ id: otpId, userId: user.id, purpose: "signup", code, ttlSeconds: 300 });

  // In production, send via email/SMS. For dev, return code.
  return res.json({ userId: user.id, delivery: email ? "email" : "sms", devCode: code });
});

router.post("/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const { email, phone } = parsed.data;
  if (!email && !phone) {
    return res.status(400).json({ error: "Provide email or phone" });
  }
  const user = email ? getUserByEmail(email) : getUserByPhone(phone);
  if (!user) {
    return res.status(404).json({ error: "Account not found" });
  }
  const code = generateNumericCode(6);
  const otpId = uuidv4();
  createOtp({ id: otpId, userId: user.id, purpose: "login", code, ttlSeconds: 300 });
  return res.json({ userId: user.id, delivery: email ? "email" : "sms", devCode: code });
});

router.post("/otp/verify", (req, res) => {
  const parsed = otpVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const { userId, code, purpose } = parsed.data;
  const result = verifyOtp({ userId, purpose, code });
  if (!result.ok) {
    return res.status(400).json({ error: "Invalid or expired code" });
  }
  // set session
  req.session.user = { id: userId };
  return res.json({ ok: true });
});

router.get("/session", (req, res) => {
  const user = req.session?.user || null;
  res.json({ user });
});

router.post("/logout", (req, res) => {
  req.session?.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

export default router;

