import jwt from "jsonwebtoken";
import type { JwtPayload } from "./index";

function getSecret(override?: string): string {
  return override || process.env.JWT_SECRET || "dev-secret";
}

export function createJwt(payload: JwtPayload, options?: jwt.SignOptions, secretOverride?: string): string {
  const secret = getSecret(secretOverride);
  return jwt.sign(payload, secret, { algorithm: "HS256", expiresIn: "7d", ...options });
}

export function verifyJwt(token: string, secretOverride?: string): JwtPayload {
  const secret = getSecret(secretOverride);
  return jwt.verify(token, secret) as JwtPayload;
}

export function extractBearerToken(authHeader?: string | null): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (!token || scheme.toLowerCase() !== "bearer") return null;
  return token;
}
