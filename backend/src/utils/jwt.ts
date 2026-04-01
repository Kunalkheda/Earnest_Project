import jwt, { SignOptions } from "jsonwebtoken";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || "access-secret";
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh-secret";
const ACCESS_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

export interface TokenPayload {
  userId: string;
  email: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: ACCESS_EXPIRY as any };
  return jwt.sign(payload, ACCESS_SECRET, options);
}

export function generateRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: REFRESH_EXPIRY as any };
  return jwt.sign(payload, REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}
