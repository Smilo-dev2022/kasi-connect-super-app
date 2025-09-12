import jwt from 'jsonwebtoken';
import { config } from './config';

export type JwtSubject = string;

export interface AccessTokenPayload {
  sub: JwtSubject;
  type: 'access';
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: JwtSubject;
  type: 'refresh';
  iat?: number;
  exp?: number;
  tokenId: string;
}

export function signAccessToken(subject: JwtSubject): string {
  const payload: AccessTokenPayload = { sub: subject, type: 'access' };
  return jwt.sign(payload, config.jwt.accessTokenSecret, {
    expiresIn: config.jwt.accessTokenTtlSeconds
  });
}

export function signRefreshToken(subject: JwtSubject, tokenId: string): string {
  const payload: RefreshTokenPayload = { sub: subject, type: 'refresh', tokenId };
  return jwt.sign(payload, config.jwt.refreshTokenSecret, {
    expiresIn: config.jwt.refreshTokenTtlSeconds
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwt.accessTokenSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.jwt.refreshTokenSecret) as RefreshTokenPayload;
}

