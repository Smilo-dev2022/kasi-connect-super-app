import { SignJWT, jwtVerify } from 'jose';
import { createSecretKey } from 'crypto';
import { config } from './config';

export type AuthTokenPayload = {
  userId: string;
  deviceId?: string;
  iat?: number;
  exp?: number;
};

const secretKey = () => createSecretKey(Buffer.from(config.jwtSecret));

export async function signAuthToken(
  payload: { userId: string; deviceId?: string },
  expiresIn: string = '30d'
): Promise<string> {
  const jwt = await new SignJWT({ userId: payload.userId, deviceId: payload.deviceId })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setIssuer('auth-service')
    .sign(secretKey());
  return jwt;
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload> {
  const { payload } = await jwtVerify(token, secretKey(), { issuer: 'auth-service' });
  return payload as AuthTokenPayload;
}

